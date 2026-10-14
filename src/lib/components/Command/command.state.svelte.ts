import { createItemMatcher } from '$lib/utils/match.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { CommandGroup, CommandItem, CommandProps } from './command.props.js';
import { elementById } from '$lib/utils/id.js';
import {
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeInit
} from '$lib/utils/openChange.js';

type CommandOptions<Value extends string = string> = Pick<
	CommandProps<Value>,
	| 'items'
	| 'dialog'
	| 'shortcut'
	| 'closeOnSelect'
	| 'shouldFilter'
	| 'filter'
	| 'limit'
	| 'autoHighlight'
	| 'loop'
	| 'onSelect'
	| 'onHighlightChange'
	| 'onOpenChange'
	| 'onValueChange'
	| 'onSearchChange'
> & {
	id: string;
	isOpen: boolean;
	/** Live search query. */
	search: string;
	/** Value of the selected command, or null when nothing has been selected. */
	value: Value | null;
	/** Locale the default filter compares text in: the active I18n locale. */
	locale?: string;
};

// `bind()` copies the option accessors onto the instance; this typed base is what declares
// them on `this`. A generic class cannot call a mixin factory in its `extends` clause, and
// merging an interface into the class declaration would be unsafe declaration merging.
const BoundCommandOptions = createBindableStateClass<object>() as unknown as new <
	Options extends object
>(
	options: Options
) => Options;

export class CommandState<Value extends string = string> extends BoundCommandOptions<
	CommandOptions<Value>
> {
	private triggerElement = $state<HTMLElement | null>(null);

	listId = $derived(`${this.id}-list`);

	/**
	 * Groups whose items match the current search query (or all groups when filtering is off),
	 * cut off after `limit` items.
	 */
	filteredGroups: CommandGroup<Value>[] = $derived.by(() => {
		const query = this.search.trim();
		const limit = this.shouldFilter ? this.limit : undefined;
		if (!this.shouldFilter || (query === '' && limit === undefined)) return this.items;
		const match = this.filter ?? this.defaultMatch;
		// Matching stops once the limit is reached: the rest of a long list is never compared.
		let remaining = limit !== undefined && limit >= 0 ? limit : Infinity;
		const groups: CommandGroup<Value>[] = [];
		for (const group of this.items) {
			if (remaining <= 0) break;
			const kept: CommandItem<Value>[] = [];
			for (const item of group.items) {
				if (remaining <= 0) break;
				if (query !== '' && !match(item, query)) continue;
				kept.push(item);
				remaining -= 1;
			}
			if (kept.length > 0) groups.push({ ...group, items: kept });
		}
		return groups;
	});

	/** Groups that actually render — those with at least one (possibly disabled) item. Filtering
	 *  here keeps separators contiguous (no orphan separator before the first visible group when an
	 *  earlier group is empty, e.g. under `shouldFilter={false}`). */
	visibleGroups = $derived(this.filteredGroups.filter((group) => group.items.length > 0));

	/** Flat list of selectable (non-disabled) items — drives keyboard navigation. */
	navItems = $derived(
		this.visibleGroups.flatMap((group) => group.items).filter((item) => !item.disabled)
	);

	isEmpty = $derived(this.visibleGroups.length === 0);

	/** Keyboard navigation: value-driven virtual focus (see useListNavigation). */
	nav = ((state: CommandState<Value>) =>
		useListNavigation<Value>({
			values: () => state.navItems.map((item) => item.value),
			get autoHighlight() {
				return state.autoHighlight ?? 'always';
			},
			get loop() {
				return state.loop ?? 'wrap';
			},
			query: () => state.search,
			// Each value gets its own numbered id, so values such as a.b and a_b never collide.
			idPrefix: `${state.id}-opt`,
			onHighlightChange: (value) => state.onHighlightChange?.(value),
			onSelect: (value) => state.selectValue(value)
		}))(this);

	/** Value of the currently highlighted (keyboard-active) option. */
	get highlighted() {
		return this.nav.highlighted;
	}

	constructor(options: CommandOptions<Value>) {
		super(options);

		// ⌘/Ctrl + shortcut toggles the palette. Dialog mode only.
		$effect(() => {
			if (!this.dialog || !this.shortcut) return;
			const key = this.shortcut.toLowerCase();
			const onKeydown = (event: KeyboardEvent) => {
				if (event.key.toLowerCase() === key && (event.metaKey || event.ctrlKey)) {
					event.preventDefault();
					untrack(() => this.toggle({ reason: 'trigger-press', event }));
				}
			};
			window.addEventListener('keydown', onKeydown);
			return () => window.removeEventListener('keydown', onKeydown);
		});

		$effect(() => {
			const triggerElement = this.triggerElement;
			const isOpen = this.isOpen;
			untrack(() => triggerElement?.setAttribute('aria-expanded', String(isOpen)));
		});
	}

	trigger: Attachment<HTMLElement> = (node) => {
		return untrack(() => {
			const triggerElement = node.querySelector<HTMLElement>('button, a[href], [tabindex]') ?? node;
			triggerElement.setAttribute('aria-haspopup', 'dialog');
			this.triggerElement = triggerElement;
			return () => {
				triggerElement.removeAttribute('aria-haspopup');
				triggerElement.removeAttribute('aria-expanded');
				this.triggerElement = null;
			};
		});
	};

	/** DOM id of a command's option row, unique per value. */
	optionId = (value: string): string => this.nav.optionId(value as Value) as string;

	/**
	 * Case- and accent-insensitive substring match on `label`, `keywords` and `value`, compared in
	 * the active locale.
	 */
	defaultMatch: (item: CommandItem<Value>, query: string) => boolean = $derived(
		createItemMatcher({ locale: this.locale })
	);

	/** Set the highlight without scrolling — used by pointermove on rows. */
	setHighlighted = (value: Value | undefined) => {
		this.nav.setHighlighted(value);
	};

	/**
	 * Pointer hover highlight: ignores moves that did not change the pointer position (Safari
	 * fires one when keyboard scrolling slides a row under a resting pointer).
	 */
	pointerHighlight = (value: Value | undefined, event?: MouseEvent | PointerEvent) => {
		this.nav.pointerHighlight(value, event);
	};

	/** Move the highlight by `delta` selectable items, wrapping around both ends. */
	move = (delta: number) => {
		this.nav.move(delta);
	};

	select = (item: CommandItem<Value>) => {
		if (item.disabled) return;
		// Selection state and activation are distinct: `value` only moves when the
		// selected command actually changes, while `onSelect` reports every activation.
		this.setValue(item.value);
		item.onSelect?.(item.value);
		this.onSelect?.(item.value);
		if (this.dialog && this.closeOnSelect) this.close({ reason: 'item-press' });
	};

	/** Select an item by value. Link items are clicked so navigation happens natively
	 *  (SvelteKit intercepts the click); their own `onclick` runs `select()`. */
	selectValue = (value: Value) => {
		const item = this.navItems.find((it) => it.value === value);
		if (!item) return;
		if (item.href) elementById(this.triggerElement, this.optionId(item.value))?.click();
		else this.select(item);
	};

	/** Select the highlighted item. Returns `false` when nothing is highlighted. */
	selectHighlighted = () => {
		if (this.nav.highlighted === undefined) return false;
		this.selectValue(this.nav.highlighted);
		return true;
	};

	setValue = (value: Value | null) => {
		if (value === this.value) return;
		this.value = value;
		this.onValueChange?.(value);
	};

	setSearch = (search: string) => {
		if (search === this.search) return;
		this.search = search;
		this.onSearchChange?.(search);
	};

	open = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		this.setOpen(true, input);
	};

	close = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		this.setOpen(false, input);
	};

	toggle = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		this.setOpen(!this.isOpen, input);
	};

	/**
	 * Asks to open or close the palette. `onOpenChange(open, details)` runs first and may cancel;
	 * returns `false` when it did.
	 */
	setOpen = (open: boolean, input?: OpenChangeDetails | OpenChangeInit | Event): boolean => {
		if (open === this.isOpen) return true;
		const details = resolveOpenChangeDetails(input, { reason: 'imperative-action' });
		if (!requestOpenChange(this.onOpenChange, open, details)) return false;
		this.isOpen = open;
		return true;
	};

	onKeydown = (event: KeyboardEvent) => {
		this.nav.onKeydown(event);
	};
}
