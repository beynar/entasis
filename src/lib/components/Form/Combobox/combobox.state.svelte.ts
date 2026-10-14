// The controller behind Combobox and TagsInput: open state with its Escape and focus-out rules,
// the option source (a static array filtered here, or an async function with abort and a latest
// response wins rule), results frozen while the list closes, the highlight model, live
// announcements. The components own what a selection means and how it renders.
import { untrack } from 'svelte';
import type { Messages } from '$lib/i18n/en.js';
import { useLiveAnnouncer } from '$lib/utils/useLiveAnnouncer.svelte.js';
import { useListNavigation, type ListLoop } from '$lib/utils/useListNavigation.svelte.js';
import {
	createOpenChangeDetails,
	requestOpenChange,
	type OpenChangeHandler,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import {
	createOptionMatcher,
	flattenItems,
	narrowItems,
	selectableOptions
} from './combobox.items.js';
import type {
	ComboboxFilter,
	ComboboxHighlightChangePayload,
	ComboboxItems,
	ComboboxItemsSource,
	ComboboxOption
} from './combobox.props.js';

/** The slice of a field the controller reads. */
type ControllerField = {
	readonly focused: boolean;
	readonly disabled: boolean;
	readonly readOnly: boolean;
	readonly node: HTMLElement | null;
};

type Accessor<Value> = { get: () => Value; set: (value: Value) => void };

export type ComboboxControllerOptions = {
	id: string;
	field: ControllerField;
	/** The options, or the function returning them; `undefined` when there is no list (free text). */
	items: () => ComboboxItemsSource | undefined;
	filter: () => ComboboxFilter | undefined;
	limit: () => number | undefined;
	/** Options to leave out of the list (TagsInput's selected tags). */
	exclude?: (option: ComboboxOption) => boolean;
	messages: () => Messages;
	loadingText: () => string | undefined;
	noOptionsText: () => string | undefined;
	query: Accessor<string>;
	/**
	 * Whether a non-empty query asks for results. Defaults to always; Autocomplete's query is its
	 * persistent value rather than a search draft, so only an open list searches.
	 */
	searching?: () => boolean;
	loading: Accessor<boolean>;
	open: Accessor<boolean>;
	onOpenChange: () => OpenChangeHandler | undefined;
	openOnFocus: () => boolean;
	autoHighlight: () => boolean | 'always';
	loop: () => ListLoop | undefined;
	/** The value to highlight when the list opens and when the text clears (the selected value). */
	anchor?: () => string | undefined;
	onHighlightChange: () => ((payload: ComboboxHighlightChangePayload) => void) | undefined;
	/** A highlighted or clicked option was chosen. */
	onSelect: (option: ComboboxOption, event?: Event) => void;
};

/** What the list shows. Kept while the list closes, so its exit never sees empty results. */
type ComboboxView = {
	items: ComboboxItems;
	hasOptions: boolean;
	count: number;
	error: string | null;
	loading: boolean;
	query: string;
};

/** Debounce before an async `items` function runs for a new search. */
const SEARCH_DELAY = 100;
/** Quiet time before result counts and status messages are announced. */
const ANNOUNCE_DELAY = 250;

export class ComboboxController {
	readonly id: string;
	readonly listboxId: string;
	#options: ComboboxControllerOptions;
	/** `typing` opened the list by typing: emptying the text closes it again. `browse` shows every option. */
	#mode = $state<'typing' | 'browse'>('browse');
	#fetched = $state.raw<ComboboxItems>([]);
	#error = $state<string | null>(null);
	#frozen = $state.raw<ComboboxView | null>(null);
	#abort: AbortController | null = null;
	#sequence = 0;
	/** A search is waiting out its debounce: nothing has been asked yet. */
	#queued = $state(false);
	#searchTimer: ReturnType<typeof setTimeout> | undefined;
	#announceTimer: ReturnType<typeof setTimeout> | undefined;
	#lastEvent: Event | undefined;
	#wasFocused = false;
	/** The element that scrolls the options (the ScrollArea viewport), for highlight scrolling. */
	viewport = $state<HTMLDivElement | null>(null);

	readonly announcer;
	readonly nav;

	constructor(options: ComboboxControllerOptions) {
		this.#options = options;
		this.id = options.id;
		this.listboxId = `${options.id}-listbox`;
		this.announcer = useLiveAnnouncer(options.id, 'live');

		this.nav = useListNavigation<string>({
			values: () => selectableOptions(this.#live.items).map((option) => option.value),
			idPrefix: options.id,
			get autoHighlight() {
				return options.autoHighlight();
			},
			get loop() {
				return options.loop() ?? 'wrap';
			},
			query: () => options.query.get(),
			open: () => this.visible,
			anchor: () => options.anchor?.(),
			scrollContainer: () => this.viewport,
			onHighlightChange: (value, details) =>
				options.onHighlightChange()?.({ value, reason: details.reason, event: details.event }),
			onSelect: (value) => {
				const option = flattenItems(this.#live.items).find((entry) => entry.value === value);
				if (option) this.selectOption(option, this.#lastEvent);
			}
		});

		// Async source: one request at a time, the latest search wins.
		$effect(() => {
			const source = this.#source;
			const query = options.query.get();
			const wanted = this.#wantsResults;
			untrack(() => this.#schedule(typeof source === 'function' ? source : null, query, wanted));
		});

		// Keep a snapshot of what is showing, so a closing list keeps its rows through the exit.
		$effect.pre(() => {
			if (this.visible) this.#frozen = this.#live;
		});

		// Focus leaving the field (and the list it opened) dismisses the list.
		let wasFocused = false;
		$effect(() => {
			const focused = options.field.focused;
			untrack(() => {
				if (wasFocused && !focused && options.open.get()) {
					this.close({ reason: 'focus-out' });
				}
			});
			wasFocused = focused;
		});

		// A disabled field has no list.
		$effect(() => {
			if (!options.field.disabled) return;
			untrack(() => {
				if (options.open.get()) this.close({ reason: 'imperative-action' });
			});
		});

		// Result counts and status messages reach screen readers through one persistent region,
		// after typing settles.
		$effect(() => {
			const message = this.statusMessage;
			untrack(() => {
				clearTimeout(this.#announceTimer);
				if (!message) {
					this.announcer.reset();
					return;
				}
				this.#announceTimer = setTimeout(() => this.announcer.announce(message), ANNOUNCE_DELAY);
			});
		});

		$effect(() => () => {
			this.#abort?.abort();
			this.#sequence += 1;
			clearTimeout(this.#searchTimer);
			clearTimeout(this.#announceTimer);
		});
	}

	// -- Source and results ---------------------------------------------------------------

	get #source() {
		return this.#options.items();
	}

	/** Text shown in a query-less list: every option while the list is open for browsing. */
	get #showAll() {
		const open = this.#options.open.get();
		// Only an open list shows every option: a closed one must not fetch before any interaction.
		return open && (this.#mode === 'browse' || this.#options.openOnFocus());
	}

	get #wantsResults() {
		const searching = this.#options.searching?.() ?? true;
		return (searching && this.#options.query.get() !== '') || this.#showAll;
	}

	#live: ComboboxView = $derived.by(() => {
		const options = this.#options;
		const source = this.#source;
		const query = options.query.get();
		const loading = options.loading.get();
		let items: ComboboxItems = [];
		if (source !== undefined && this.#wantsResults) {
			const async = typeof source === 'function';
			items = narrowItems(async ? this.#fetched : source, async ? '' : query, {
				// The collator behind the default matcher is cached per locale.
				match: options.filter() ?? createOptionMatcher(options.messages().locale),
				exclude: options.exclude,
				limit: options.limit()
			});
		}
		const flat = flattenItems(items);
		return {
			items,
			hasOptions: flat.length > 0,
			count: flat.length,
			error: this.#error,
			// A search that has not started yet counts as loading while there is nothing to show,
			// so "No options found" never flashes before the first response.
			loading: loading || (this.#queued && flat.length === 0),
			query
		};
	});

	/** The live async error: the input's validity follows it, not the frozen exit snapshot. */
	get error(): string | null {
		return this.#error;
	}

	/** What the list renders: the live results, or the last ones shown while it closes. */
	get view(): ComboboxView {
		return this.visible ? this.#live : (this.#frozen ?? this.#live);
	}

	#schedule(
		fn: Extract<ComboboxItemsSource, (...args: never[]) => unknown> | null,
		query: string,
		wanted: boolean
	) {
		clearTimeout(this.#searchTimer);
		this.#queued = false;
		if (!fn || !wanted) {
			// Nothing to ask: whatever is in flight no longer matters.
			if (this.#abort || this.#fetched.length > 0 || this.#error) {
				this.#abort?.abort();
				this.#abort = null;
				this.#sequence += 1;
				this.#fetched = [];
				this.#error = null;
				if (this.#options.loading.get()) this.#options.loading.set(false);
			}
			return;
		}
		this.#queued = true;
		this.#searchTimer = setTimeout(() => void this.#run(fn, query), SEARCH_DELAY);
	}

	async #run(
		fn: Extract<ComboboxItemsSource, (...args: never[]) => unknown>,
		query: string
	): Promise<void> {
		this.#abort?.abort();
		const controller = new AbortController();
		this.#abort = controller;
		const sequence = ++this.#sequence;
		this.#queued = false;
		this.#error = null;
		this.#options.loading.set(true);
		try {
			const result = await fn(query, { signal: controller.signal });
			if (sequence !== this.#sequence || controller.signal.aborted) return;
			this.#fetched = result ?? [];
		} catch (error) {
			if (sequence !== this.#sequence || controller.signal.aborted) return;
			this.#fetched = [];
			this.#error =
				error instanceof Error ? error.message : this.#options.messages().failedToLoadOptions;
		} finally {
			if (sequence === this.#sequence) {
				this.#abort = null;
				this.#options.loading.set(false);
			}
		}
	}

	/** Options already resolved by an async source, for label lookups. */
	get fetchedOptions(): ComboboxOption[] {
		return flattenItems(this.#fetched);
	}

	// -- Open state -------------------------------------------------------------------------

	get open(): boolean {
		return this.#options.open.get();
	}

	/** Whether the list has a source to open at all. */
	get hasSource(): boolean {
		return this.#source !== undefined;
	}

	/**
	 * Whether the list is on screen: open, with options, a message or an error to show.
	 * An open list with nothing to say renders nothing.
	 */
	get visible(): boolean {
		const options = this.#options;
		if (!this.hasSource || !options.open.get() || options.field.disabled) return false;
		const live = this.#live;
		return live.hasOptions || live.error !== null || live.loading || live.query !== '';
	}

	/** Whether the option list itself is showing: `aria-expanded` of the input. */
	get expanded(): boolean {
		return this.visible && this.#live.hasOptions;
	}

	get activeDescendant(): string | undefined {
		return this.expanded ? this.nav.activeDescendant : undefined;
	}

	/** What the status row says while no options are listed, or while loading. */
	get status(): { kind: 'loading' | 'error' | 'empty'; text: string } | null {
		const view = this.view;
		const messages = this.#options.messages();
		if (view.loading) {
			return { kind: 'loading', text: this.#options.loadingText() ?? messages.loadingEllipsis };
		}
		if (view.error !== null) return { kind: 'error', text: view.error };
		if (!view.hasOptions && view.query !== '') {
			return { kind: 'empty', text: this.#options.noOptionsText() ?? messages.noOptions };
		}
		return null;
	}

	/** The message the persistent live region announces: result count, loading, error or empty. */
	get statusMessage(): string {
		if (!this.visible) return '';
		const live = this.#live;
		const messages = this.#options.messages();
		if (live.loading) return this.#options.loadingText() ?? messages.loadingEllipsis;
		if (live.error !== null) return live.error;
		if (live.hasOptions) return messages.resultsCount(live.count);
		return this.#options.noOptionsText() ?? messages.noOptions;
	}

	/**
	 * Asks to open or close the list. `onOpenChange` runs first and may cancel; returns whether
	 * the change went through (or was already the state).
	 */
	setOpen(next: boolean, init: OpenChangeInit = {}): boolean {
		const options = this.#options;
		if (next === options.open.get()) return true;
		if (next && (options.field.disabled || !this.hasSource)) return false;
		const details = createOpenChangeDetails({
			...init,
			trigger: init.trigger ?? options.field.node ?? undefined
		});
		if (!requestOpenChange(options.onOpenChange(), next, details)) return false;
		if (!next) this.#mode = 'browse';
		options.open.set(next);
		return true;
	}

	/** Opens the list to browse every option (arrow keys, a press on the input, focus). */
	browse(init: OpenChangeInit = {}): boolean {
		const wasMode = this.#mode;
		this.#mode = 'browse';
		const opened = this.setOpen(true, init);
		if (!opened) this.#mode = wasMode;
		return opened;
	}

	close(init: OpenChangeInit = {}): boolean {
		return this.setOpen(false, init);
	}

	// -- Input events -----------------------------------------------------------------------

	/** The text changed because the user typed: open the list for it. */
	onInput(event: Event) {
		if (this.#options.field.readOnly) return;
		this.#mode = 'typing';
		this.setOpen(true, { reason: 'input-change', event });
	}

	onFocus(event: FocusEvent) {
		const options = this.#options;
		if (options.openOnFocus() && !options.open.get())
			this.browse({ reason: 'trigger-focus', event });
	}

	onPointerDown() {
		const node = this.#options.field.node;
		this.#wasFocused = !!node && node.ownerDocument.activeElement === node;
	}

	/** A press on the input that already had focus toggles the list. */
	onClick(event: MouseEvent) {
		const wasFocused = this.#wasFocused;
		this.#wasFocused = false;
		if (!wasFocused || this.#options.field.disabled) return;
		if (this.visible) this.close({ reason: 'trigger-press', event });
		else this.browse({ reason: 'trigger-press', event });
	}

	/**
	 * Keys on the input. Escape closes the list and keeps focus; with the list closed it clears
	 * the typed text. ArrowDown/ArrowUp open a closed list, and the rest move the highlight.
	 */
	onKeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.isComposing) return;
		const options = this.#options;
		if (event.key === 'Escape') {
			if (this.visible) {
				if (this.close({ reason: 'escape-key', event })) event.preventDefault();
			} else if (options.query.get() !== '' && !options.field.readOnly) {
				options.query.set('');
				event.preventDefault();
			} else if (options.open.get()) {
				this.close({ reason: 'escape-key', event });
			}
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!this.hasSource || options.field.disabled) return;
			if (!this.visible) {
				event.preventDefault();
				this.browse({ reason: 'list-navigation', event });
				return;
			}
		}
		if (this.expanded) {
			this.#lastEvent = event;
			this.nav.onKeydown(event);
			this.#lastEvent = undefined;
		}
	}

	/** Chooses an option: a click, or Enter on the highlighted one. */
	selectOption(option: ComboboxOption, event?: Event) {
		const field = this.#options.field;
		if (option.disabled || field.disabled || field.readOnly) return;
		this.#options.onSelect(option, event);
	}

	/** Props for the keyboard-inert parts of the popup: a press must not move focus off the input. */
	preventBlur = (event: Event) => {
		event.preventDefault();
	};
}
