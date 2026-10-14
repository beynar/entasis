import { untrack } from 'svelte';
import { bind } from '$lib/utils/state.svelte.js';
import { createOptionIds, useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
import { createTypeahead } from '$lib/utils/typeahead.js';
import {
	createOpenChangeDetails,
	getInteractionType,
	requestOpenChange,
	type OpenChangeHandler,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import { alignItemWithTrigger, SELECT_ALIGN_MARGIN } from './select.align.js';
import type { SelectItems, SelectOption, SelectOptionGroup } from './select.props.js';
import { elementById } from '$lib/utils/id.js';

/** Inline-start edge of an element's first text: what lines up between the value and an option. */
const textStart = (element: Element, rtl: boolean) => {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
	});
	const text = walker.nextNode();
	let rect = element.getBoundingClientRect();
	const range = text ? document.createRange() : null;
	// Ranges without layout (jsdom) fall back to the element's own box.
	if (range?.getBoundingClientRect) {
		range.selectNodeContents(text!);
		rect = range.getBoundingClientRect();
	}
	return rtl ? rect.right : rect.left;
};

const isGroup = (entry: SelectOption | SelectOptionGroup): entry is SelectOptionGroup =>
	Array.isArray((entry as SelectOptionGroup).items);

/** A `max-height` in px, or `Infinity` for `none` and anything a pixel count cannot describe. */
const pixelCap = (maxHeight: string) => {
	const px = /^(-?\d*\.?\d+)px$/.exec(maxHeight.trim());
	return px ? Math.max(0, Number(px[1])) : Infinity;
};

type SelectValue = string | readonly string[] | null | undefined;

interface SelectStateOptions {
	id: string;
	/** Items list — reactive getter bridged from the component props. */
	items: SelectItems | undefined;
	/**
	 * Selected value — reactive getter/setter bridged to the field state: a string or `null`, or
	 * the array of values when `multiple`.
	 */
	value: SelectValue;
	/** The Select holds a list of values and stays open while options are toggled. */
	multiple?: boolean;
	disabled: boolean | undefined;
	/** Browsable but unchangeable: the list opens, nothing is committed. */
	readOnly?: boolean;
	/** The trigger button — reactive getter bridged to `field.node`, refocused after selection. */
	triggerEl: HTMLElement | null;
	/** Open over the trigger with the selected option on the value, like a native select. */
	alignItemWithTrigger: boolean;
	/** The trigger's value text, the option list root, and its scrolling viewport (the listbox). */
	valueEl: HTMLElement | null;
	listEl: HTMLElement | null;
	viewportEl: HTMLElement | null;
	/** The panel's content: the listbox and the close button, the elements focus may rest in. */
	contentEl?: HTMLElement | null;
	/** Where the open state lives (a bindable prop); the state keeps its own when absent. */
	openState?: { get: () => boolean; set: (open: boolean) => void };
	/** Runs before every open or close and may cancel it. */
	onOpenChange?: OpenChangeHandler;
}

export class SelectState {
	declare id: string;
	declare items: SelectItems | undefined;
	declare value: SelectValue;
	declare multiple: boolean | undefined;
	declare disabled: boolean | undefined;
	declare readOnly: boolean | undefined;
	declare triggerEl: HTMLElement | null;
	declare alignItemWithTrigger: boolean;
	declare valueEl: HTMLElement | null;
	declare listEl: HTMLElement | null;
	declare viewportEl: HTMLElement | null;
	declare contentEl: HTMLElement | null | undefined;
	declare openState: SelectStateOptions['openState'];
	declare onOpenChange: OpenChangeHandler | undefined;
	#localOpen = $state(false);
	/** The current open session was started by a finger: it is a dropdown, never item-aligned. */
	#touch = $state(false);
	/** Type of the last press on the trigger, for browsers whose click event does not carry it. */
	#pointerType: string | null = null;
	/** A click on a `<label for>` is on its way to the trigger as a second click. */
	#labelClick = false;
	// Where this open session placed the panel. Measured once: later repositioning (the panel
	// resizing, the list scrolling) must not re-scroll the list under the pointer. A new viewport
	// size measures again.
	#alignment: {
		position: { x: number; y: number; minWidth: number };
		viewport: { width: number; height: number };
	} | null = null;
	/** The open session in progress has been set up (opened through `setOpen`, or noticed by the effect). */
	#sessionStarted = false;
	/** Focus has been given to the trigger for the open session in progress. */
	#focusedSession = false;
	#ids!: ReturnType<typeof createOptionIds<string>>;

	listboxId = $derived.by(() => `${this.id}-listbox`);

	get isOpen(): boolean {
		return this.openState ? this.openState.get() : this.#localOpen;
	}

	set isOpen(open: boolean) {
		if (this.openState) this.openState.set(open);
		else this.#localOpen = open;
	}

	/**
	 * The list is a dropdown below the trigger rather than item-aligned: the prop says so, or a
	 * finger opened it (the alignment is for mouse and keyboard).
	 */
	get dropdown(): boolean {
		return !this.alignItemWithTrigger || this.#touch;
	}

	/** All options, flattened across groups — render order. */
	flatOptions: SelectOption[] = $derived.by(() =>
		(this.items ?? []).flatMap((entry) => (isGroup(entry) ? entry.items : [entry]))
	);

	/** Options as rendered: consecutive bare options bundled into one unlabeled group. */
	renderGroups = $derived.by(() => {
		const groups: { label?: string; items: readonly SelectOption[] }[] = [];
		let bare: { label?: string; items: SelectOption[] } | null = null;
		for (const entry of this.items ?? []) {
			if (isGroup(entry)) {
				bare = null;
				groups.push({ label: entry.label, items: entry.items });
			} else {
				if (!bare) {
					bare = { items: [] };
					groups.push(bare);
				}
				bare.items.push(entry);
			}
		}
		return groups;
	});

	/** The enabled values in render order: what the highlight and the typeahead move over. */
	enabledValues = $derived.by(() =>
		this.flatOptions.filter((option) => !option.disabled).map((option) => option.value)
	);

	/** The selected values, in the order the value holds them. */
	selectedValues = $derived.by((): string[] => {
		const value = this.value;
		if (Array.isArray(value)) return [...value];
		return typeof value === 'string' ? [value] : [];
	});

	/** The selected values as a set, so a row asks whether it is selected in constant time. */
	selectedSet = $derived.by(
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- derived value, rebuilt whole
		() => new Set(this.selectedValues)
	);

	/** The selected options in render order (the value of a single Select, at most one). */
	selectedOptions = $derived.by(() =>
		this.selectedSet.size === 0
			? []
			: this.flatOptions.filter((option) => this.selectedSet.has(option.value))
	);

	/** The first selected option in render order: what the trigger shows for a single Select. */
	selectedOption = $derived(this.selectedOptions[0] ?? null);

	/**
	 * The option the list opens on: the first enabled selected one in render order, found in one
	 * pass over the options (a Set lookup per option, never a search per selected value).
	 */
	anchorOption = $derived.by(() => {
		if (this.selectedSet.size === 0) return undefined;
		return this.flatOptions.find(
			(option) => !option.disabled && this.selectedSet.has(option.value)
		);
	});

	/** Keyboard navigation: value-driven virtual focus — DOM focus stays on the trigger. */
	nav = useListNavigation({
		values: () => this.enabledValues,
		optionId: (value) => this.optionId(value),
		onSelect: (value) => this.activate(value),
		open: () => this.isOpen,
		anchor: () => this.anchorOption?.value,
		scrollContainer: () => this.viewportEl
	});

	// One search session for the open list (moves the highlight) and the closed trigger (picks the
	// match, as a native select does). Space belongs to the search while it has characters.
	#keyEvent: KeyboardEvent | undefined;
	#typeahead = createTypeahead<string>({
		getItems: () => this.enabledValues,
		getText: (value) => this.flatOptions.find((option) => option.value === value)?.label ?? value,
		getCurrentIndex: () => {
			const current = this.isOpen ? this.nav.highlighted : this.selectedValues[0];
			return current === undefined ? -1 : this.enabledValues.indexOf(current);
		},
		onMatch: (_index, value) => {
			if (this.isOpen) this.nav.highlight(value, { reason: 'keyboard', event: this.#keyEvent });
			else this.#commitSingle(value);
		}
	});

	constructor(options: SelectStateOptions) {
		bind(this, options);
		this.#ids = createOptionIds(this.id);
		// An item-aligned panel sits on the trigger, so the page holds still while it is open, as
		// it does for a native select. Popover's body lock does not reach an app's own scroll
		// container (a scrolling <main>), so wheel and touch scrolling are blocked outside the
		// panel. The panel is portaled under the locked body: its own scrolling cannot chain out.
		$effect(() => {
			if (!this.isOpen || this.dropdown) return;
			const block = (event: Event) => {
				// The content sits in the popover's panel, the only child of its positioning wrapper.
				const panel = this.contentEl?.parentElement?.parentElement;
				// The composed path, not `event.target`: a window listener sees a shadow root's events
				// retargeted to its host.
				if (panel && event.composedPath().includes(panel)) return;
				event.preventDefault();
			};
			const listen = { capture: true, passive: false };
			window.addEventListener('wheel', block, listen);
			window.addEventListener('touchmove', block, listen);
			return () => {
				window.removeEventListener('wheel', block, listen);
				window.removeEventListener('touchmove', block, listen);
			};
		});
		// A list opened from outside (`open`, `defaultOpen`) never went through `setOpen`: it starts
		// a fresh session all the same, with no measurement or touch flag left from the last one.
		// Before the DOM updates, so the panel positions against the clean state.
		$effect.pre(() => {
			if (!this.isOpen) {
				this.#sessionStarted = false;
				return;
			}
			if (this.#sessionStarted) return;
			this.#sessionStarted = true;
			this.#alignment = null;
			this.#touch = false;
		});
		// Keys and blur drive the list through the trigger, so an externally opened list takes focus
		// there, as an open through the trigger does.
		$effect(() => {
			if (!this.isOpen || this.#focusedSession) {
				if (!this.isOpen) this.#focusedSession = false;
				return;
			}
			const trigger = this.triggerEl;
			if (!trigger) return;
			this.#focusedSession = true;
			untrack(() => {
				if (document.activeElement !== trigger) trigger.focus();
			});
		});
		// A disabled Select has no list.
		$effect(() => {
			if (!this.disabled || !this.isOpen) return;
			untrack(() => this.setOpen(false, { reason: 'imperative-action', cancelable: false }));
		});
		// A pending search must not outlive the Select.
		$effect(() => () => this.#typeahead.reset());
	}

	/**
	 * DOM id of an option. Each value gets the next number the first time it is asked for, so
	 * values that would collide once sanitised ('a.b', 'a_b') never share an id, and a lookup costs
	 * the same however long the list is.
	 */
	optionId = (value: string) => this.#ids.get(value);

	/** Whether `value` is selected. */
	isSelected = (value: string) => this.selectedSet.has(value);

	/** Whether a node is the trigger or inside the panel: focus there keeps the list open. */
	contains = (node: EventTarget | null) =>
		node instanceof Node && (!!this.triggerEl?.contains(node) || !!this.contentEl?.contains(node));

	/**
	 * Popover `positionPanel`: places the open panel over the trigger with the selected option (or
	 * the first one) on the value, and sizes and scrolls the list to keep it there. `null` falls
	 * back to the dropdown below the trigger.
	 */
	positionPanel = ({ panel, reference }: { panel: HTMLElement; reference: unknown }) => {
		const { valueEl, listEl, viewportEl } = this;
		if (this.dropdown) {
			// A previous aligned session left its measured height on the list.
			listEl?.style.removeProperty('max-height');
			return null;
		}
		if (!valueEl || !listEl || !viewportEl) return null;
		if (!(reference instanceof HTMLElement)) return null;
		const anchor = this.anchorOption ?? this.flatOptions.find((option) => !option.disabled);
		const item = anchor && elementById(reference, this.optionId(anchor.value));
		if (!item) return null;

		const width = window.innerWidth;
		const height = window.innerHeight;
		const kept = this.#alignment;
		if (kept && kept.viewport.width === width && kept.viewport.height === height)
			return kept.position;

		// A `max-height` the theme or consumer put on the list caps it. Read it without our own
		// inline height from an earlier measurement in the way.
		listEl.style.removeProperty('max-height');
		const maxListHeight = pixelCap(getComputedStyle(listEl).maxHeight);

		// Measure the list at its natural height and scroll, the panel at least as wide as the
		// trigger (what `fitTrigger` applies on the next render).
		const trigger = reference.getBoundingClientRect();
		const surface = panel.firstElementChild as HTMLElement | null;
		if (surface) surface.style.minWidth = `${trigger.width}px`;
		listEl.style.maxHeight = 'none';
		viewportEl.scrollTop = 0;
		const rtl = getComputedStyle(reference).direction === 'rtl';
		const panelRect = panel.getBoundingClientRect();
		const listRect = listEl.getBoundingClientRect();
		const itemRect = item.getBoundingClientRect();

		const placed = alignItemWithTrigger({
			viewport: { width, height },
			trigger: { top: trigger.top, height: trigger.height },
			valueTextStart: textStart(valueEl, rtl),
			panel: {
				left: panelRect.left,
				right: panelRect.right,
				top: panelRect.top,
				width: panelRect.width,
				height: panelRect.height
			},
			list: { top: listRect.top, height: listRect.height },
			item: { top: itemRect.top, height: itemRect.height, textStart: textStart(item, rtl) },
			rtl,
			maxListHeight
		});
		listEl.style.maxHeight = `${placed.listHeight}px`;
		viewportEl.scrollTop = placed.scrollTop;

		// Overhang the trigger on both sides. The text alignment fixes the start edge, so the panel
		// widens at the end to match the start's overhang (at least 4px) and stays in the viewport.
		const end = rtl ? placed.x + panelRect.width : placed.x;
		const startOverhang = rtl ? end - trigger.right : trigger.left - placed.x;
		const overhang = Math.max(4, startOverhang);
		const minWidth = Math.max(
			panelRect.width,
			rtl ? end - (trigger.left - overhang) : trigger.right + overhang - placed.x
		);
		const x = Math.min(
			Math.max(rtl ? end - minWidth : placed.x, SELECT_ALIGN_MARGIN),
			width - SELECT_ALIGN_MARGIN - minWidth
		);
		// Popover applies `minWidth` through a style binding, which skips the write when the value
		// matches the previous session's: put back what the measurement overwrote.
		if (surface) surface.style.minWidth = `${minWidth}px`;
		const position = { x: Math.max(SELECT_ALIGN_MARGIN, x), y: placed.y, minWidth };
		this.#alignment = { position, viewport: { width, height } };
		return position;
	};

	/**
	 * Opens or closes the list. `onOpenChange` runs first and may cancel; returns whether the
	 * change went through (or was already the state).
	 */
	setOpen = (next: boolean, init: OpenChangeInit = {}): boolean => {
		if (next === this.isOpen) return true;
		if (next && this.disabled) return false;
		// The press on the trigger knows what a click cannot: WebKit reports the click that follows a
		// tap as a `mouse` pointer event.
		const press = this.#pointerType;
		const pressKind = press === 'mouse' || press === 'touch' || press === 'pen' ? press : null;
		const interaction =
			init.interaction ??
			(init.event?.type === 'click' && pressKind
				? pressKind
				: getInteractionType(init.event, press));
		const details = createOpenChangeDetails({
			...init,
			interaction,
			trigger: init.trigger ?? this.triggerEl ?? undefined
		});
		if (!requestOpenChange(this.onOpenChange, next, details)) return false;
		this.#pointerType = null;
		if (next) {
			this.#sessionStarted = true;
			this.#alignment = null;
			this.#touch = interaction === 'touch';
			this.isOpen = true;
			// Safari/Firefox-macOS don't focus buttons on click — grab focus explicitly so the
			// blur-to-close and trigger keydown paths work for mouse users everywhere.
			this.triggerEl?.focus();
			// The highlight lands on the selected option (native <select> behaviour) through the
			// navigation's open/anchor rule, which also scrolls it into view inside the list.
		} else {
			this.isOpen = false;
			this.#sessionStarted = false;
			this.#typeahead.reset();
		}
		return true;
	};

	open = (init?: OpenChangeInit) => this.setOpen(true, init);

	close = (init?: OpenChangeInit) => this.setOpen(false, init);

	toggle = (init?: OpenChangeInit) => this.setOpen(!this.isOpen, init);

	/** Writes a single value through the field, which publishes one `onValueChange`. */
	#commitSingle = (value: string) => {
		if (this.readOnly || this.disabled) return;
		const option = this.flatOptions.find((entry) => entry.value === value);
		if (!option || option.disabled) return;
		this.value = option.value;
	};

	/** The selection after toggling `value`, in render order (values no option names keep the end). */
	#toggled = (value: string): string[] => {
		// Local sets, rebuilt per call and never read reactively.
		/* eslint-disable svelte/prefer-svelte-reactivity */
		const next = new Set(this.selectedValues);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		const known = new Set(this.flatOptions.map((option) => option.value));
		/* eslint-enable svelte/prefer-svelte-reactivity */
		return [
			...this.flatOptions.filter((option) => next.has(option.value)).map((option) => option.value),
			...[...next].filter((entry) => !known.has(entry))
		];
	};

	/**
	 * Chooses an option: a single Select takes it, closes and refocuses the trigger; a multiple
	 * Select toggles it and stays open. A read-only Select commits nothing.
	 */
	activate = (value: string, event?: Event) => {
		const option = this.flatOptions.find((entry) => entry.value === value);
		if (!option || option.disabled || this.readOnly || this.disabled) return;
		if (this.multiple) {
			this.value = this.#toggled(option.value);
			return;
		}
		this.#commitSingle(option.value);
		this.close({ reason: 'item-press', event });
		this.triggerEl?.focus();
	};

	/** @deprecated Use `activate`. */
	selectValue = (value: string) => this.activate(value);

	/** Empties the selection: `null` for a single Select, `[]` for a multiple one. */
	clear = () => {
		if (this.readOnly || this.disabled) return;
		this.value = this.multiple ? [] : null;
	};

	/**
	 * A label elsewhere on the page was clicked: the browser forwards the click to the trigger, which
	 * should take focus, as a label focuses a native select, rather than toggle the list.
	 */
	noteLabelClick = () => {
		this.#labelClick = true;
		setTimeout(() => (this.#labelClick = false));
	};

	/** Whether the click now arriving at the trigger is a label's: consumed once. */
	consumeLabelClick = () => {
		const forwarded = this.#labelClick;
		this.#labelClick = false;
		return forwarded;
	};

	/** A press on the trigger: remembers the pointer type so a touch open can be told from a mouse one. */
	onTriggerPointerDown = (event: PointerEvent) => {
		this.#pointerType = event.pointerType || null;
	};

	/** Focus left the trigger: the list closes, unless focus moved into the panel (a screen reader's cursor). */
	onTriggerBlur = (event: FocusEvent) => {
		if (this.contains(event.relatedTarget)) return;
		this.close({ reason: 'focus-out', event });
	};

	/** Focus left the panel: the list closes unless it went back to the trigger or stayed inside. */
	onPanelFocusOut = (event: FocusEvent) => {
		if (this.contains(event.relatedTarget)) return;
		this.close({ reason: 'focus-out', event });
	};

	/** Keys while focus rests in the panel (a screen reader moved it onto an option). */
	onPanelKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		if (this.close({ reason: 'escape-key', event })) {
			event.preventDefault();
			this.triggerEl?.focus();
		}
	};

	/** The visually hidden close button, for touch screen-reader users with no Escape key. */
	onCloseButton = (event: MouseEvent) => {
		this.close({ reason: 'close-press', event });
		this.triggerEl?.focus();
	};

	/** Keydown handler for the trigger — closed: open on ArrowUp/Down/Enter/Space and type to pick;
	 *  open: Escape/Tab close, Enter/Space choose, arrows/Home/End/typing move the highlight. */
	onTriggerKeydown = (event: KeyboardEvent) => {
		if (this.disabled) return;
		this.#pointerType = null;
		const open = this.isOpen;

		// Typing: a closed single Select picks the match like a native select (no list, one
		// `onValueChange`); an open one moves its highlight. Space belongs to the search while it
		// has characters, and only then.
		if (open || (!this.multiple && !this.readOnly)) {
			this.#keyEvent = event;
			const consumed = this.#typeahead.handleKey(event);
			this.#keyEvent = undefined;
			if (consumed) {
				event.preventDefault();
				return;
			}
		}

		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
				event.preventDefault();
				// A held key repeats: the list that just opened must not toggle again.
				if (event.repeat) return;
				this.open({
					reason: event.key.startsWith('Arrow') ? 'list-navigation' : 'trigger-press',
					event
				});
			}
			return;
		}
		switch (event.key) {
			case 'Escape':
				if (this.close({ reason: 'escape-key', event })) event.preventDefault();
				return;
			case 'Enter':
			case ' ':
				event.preventDefault();
				// Suppress key-repeat: a held Enter would select, close, then reopen through the
				// closed-state branch on the next repeat tick.
				if (event.repeat) return;
				if (this.nav.highlighted !== undefined) this.activate(this.nav.highlighted, event);
				return;
			case 'Tab':
				// No preventDefault — let focus move on naturally.
				this.close({ reason: 'focus-out', event });
				return;
			default:
				this.nav.onKeydown(event);
		}
	};
}
