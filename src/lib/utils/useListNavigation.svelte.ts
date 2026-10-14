import { untrack } from 'svelte';
import { createTypeahead } from './typeahead.js';

/** What moved the highlight: keys (and typeahead), the pointer, or the list changing underneath it. */
export type HighlightReason = 'keyboard' | 'pointer' | 'list';

/** Second argument of `onHighlightChange`: why the highlight moved and the event behind it. */
export type HighlightDetails = {
	reason: HighlightReason;
	/** The originating KeyboardEvent or pointer event; absent for `'list'` changes. */
	event?: Event;
};

/**
 * What moving past either end does: `'wrap'` continues at the other end, `'input'` lands on no
 * highlight first (focus stays in the input) and wraps from there, `false` stops at the end.
 */
export type ListLoop = 'wrap' | 'input' | false;

type ListNavigationOptions<Value extends string = string> = {
	/**
	 * Ordered, selectable values (already filtered — exclude disabled items).
	 * Re-read reactively: derive it from your filtered data.
	 */
	values: () => Value[];
	/**
	 * DOM id of a value's option element — drives `aria-activedescendant` and scrolling.
	 * Leave it out and pass `idPrefix` to get collision-free ids from `nav.optionId`.
	 */
	optionId?: (value: Value) => string;
	/**
	 * Prefix for the ids `nav.optionId` hands out when `optionId` is omitted. Each distinct value
	 * gets the next number in sequence (`<prefix>-option-3`), so values such as `a.b` and `a_b`
	 * never collide and lookups stay constant-time however long the list is.
	 */
	idPrefix?: string;
	/**
	 * Fires whenever the highlight moves (keyboard, hover, or re-anchoring). The second argument
	 * says why and carries the originating event.
	 */
	onHighlightChange?: (value: Value | undefined, details: HighlightDetails) => void;
	/**
	 * Type-to-highlight: printable keys jump to the next value whose text starts with the
	 * typed buffer. Only for lists whose focus is NOT in a text input (Select, not Combobox).
	 */
	typeahead?: (value: Value) => string;
	/** Fires on Enter with the highlighted value. */
	onSelect?: (value: Value) => void;
	/**
	 * Moving past either end: `'wrap'` (default, `true`), `'input'` (the end lands on no highlight,
	 * then wraps) or `false` (stop at the end).
	 */
	loop?: boolean | ListLoop;
	/**
	 * Whether the first value is highlighted on its own. `'always'` (default, the long-standing
	 * behaviour) keeps something highlighted whenever the list has values; `true` does it only
	 * while a `query` is typed; `false` never does, so Enter with no highlight is the consumer's.
	 */
	autoHighlight?: boolean | 'always';
	/** The typed query. Re-read reactively: changes reset the list scroll and drive `autoHighlight: true`. */
	query?: () => string;
	/**
	 * Whether the list is showing. When given, the highlight re-anchors each time it turns true and
	 * is left alone while it is false. Omit it for lists that are always visible.
	 */
	open?: () => boolean;
	/**
	 * The value to highlight when the list opens and when the query clears (the selected value).
	 * Read untracked, at those moments only.
	 */
	anchor?: () => Value | undefined;
	/**
	 * The element that scrolls the options. Highlighting scrolls only this element (never the
	 * page or other ancestors) and a changed query scrolls it back to the top. Defaults to the
	 * nearest ancestor of the option that scrolls vertically.
	 */
	scrollContainer?: () => HTMLElement | null | undefined;
};

/**
 * Hands each distinct value its own DOM id, numbered in the order the values are first asked
 * for. Sanitizing a value into an id collides (`a.b` and `a_b` both become `a_b`) and searching
 * for its index is quadratic; a map lookup is neither. Ids are stable for the life of the map.
 */
export const createOptionIds = <Value extends string = string>(prefix: string) => {
	// Plain map on purpose: ids are handed out while rendering and must not be tracked state.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const ids = new Map<Value, string>();
	let sequence = 0;
	return {
		/** The id of `value`; the first request assigns the next number. */
		get(value: Value): string {
			let id = ids.get(value);
			if (id === undefined) {
				id = `${prefix}-option-${sequence}`;
				sequence += 1;
				ids.set(value, id);
			}
			return id;
		},
		/** Forgets every assignment (numbering carries on, so old ids are never reused). */
		clear() {
			ids.clear();
		}
	};
};

const scrollsVertically = (element: Element) => {
	const overflow = getComputedStyle(element).overflowY;
	return overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay';
};

const nearestScroller = (element: HTMLElement) => {
	for (let parent = element.parentElement; parent; parent = parent.parentElement) {
		if (scrollsVertically(parent)) return parent;
	}
	return null;
};

/**
 * Brings `element` into view by moving the container's own `scrollTop`. Unlike `scrollIntoView`
 * it never scrolls the page or an ancestor, so an inline list inside a page stays put.
 *
 * Rects include ancestor transforms (a popover mid-open animation is scaled), while `scrollTop`
 * is in layout pixels, so the offsets are divided by the container's rendered scale first.
 */
const scrollWithin = (container: HTMLElement, element: HTMLElement) => {
	const style = getComputedStyle(container);
	const paddingTop = parseFloat(style.scrollPaddingTop) || 0;
	const paddingBottom = parseFloat(style.scrollPaddingBottom) || 0;
	const bounds = container.getBoundingClientRect();
	const target = element.getBoundingClientRect();
	const scale =
		container.offsetHeight > 0 && bounds.height > 0 ? bounds.height / container.offsetHeight : 1;
	// The element's edges in the container's layout space, from the top of its padding box.
	const targetTop = (target.top - bounds.top) / scale - container.clientTop;
	const targetBottom = (target.bottom - bounds.top) / scale - container.clientTop;
	const top = paddingTop;
	const bottom = container.clientHeight - paddingBottom;
	if (targetTop < top) container.scrollTop -= top - targetTop;
	else if (targetBottom > bottom) container.scrollTop += targetBottom - bottom;
};

/**
 * Value-driven keyboard navigation for combobox-style widgets (command palettes, dropdowns,
 * autocompletes): DOM focus stays on the input, only the highlight moves ("virtual focus",
 * exposed via `aria-activedescendant`).
 *
 * Unlike `useNavigation` (DOM/index-based roving tabindex — right for menus, tabs, toolbars),
 * the highlight here is a *value*, so it survives the item set changing underneath it: when the
 * highlighted value disappears (typing in a filter), the highlight re-anchors per
 * `autoHighlight` — the first value by default. With `open` and `anchor` it also lands on the
 * selected value each time the list opens and when the query clears.
 *
 * Must be called during component init (it registers an `$effect`).
 *
 * Wire-up: `onkeydown={nav.onKeydown}` on the input, `aria-activedescendant={nav.activeDescendant}`,
 * `id={nav.optionId(value)}` and `onpointermove={(event) => nav.pointerHighlight(value, event)}` on
 * rows, `aria-selected={nav.highlighted === value}`.
 */
export const useListNavigation = <Value extends string = string>(
	opts: ListNavigationOptions<Value>
) => {
	let highlighted = $state<Value | undefined>();
	let lastDetails = $state<HighlightDetails>({ reason: 'list' });
	let lastPointer: { x: number; y: number } | null = null;
	let scrollTimer: ReturnType<typeof setTimeout> | undefined;

	const loopMode = (): ListLoop =>
		opts.loop === false ? false : opts.loop === 'input' ? 'input' : 'wrap';
	const autoHighlight = () => opts.autoHighlight ?? 'always';

	const ids = opts.idPrefix !== undefined ? createOptionIds<Value>(opts.idPrefix) : null;
	const optionId = (value: Value): string | undefined => opts.optionId?.(value) ?? ids?.get(value);

	const setHighlighted = (value: Value | undefined, details?: HighlightDetails) => {
		if (highlighted === value) return;
		const next = details ?? { reason: 'pointer' };
		highlighted = value;
		lastDetails = next;
		opts.onHighlightChange?.(value, next);
	};

	/** Scroll the highlighted option into view, inside its scroll container only. */
	const scrollToHighlighted = () => {
		if (highlighted === undefined || typeof document === 'undefined') return;
		const id = optionId(highlighted);
		const element = id ? document.getElementById(id) : null;
		if (!element) return;
		const container = opts.scrollContainer?.() ?? nearestScroller(element);
		if (container) scrollWithin(container, element);
	};

	/** Scroll now and once more after the next flush, for options a popup is still mounting. */
	const scrollSoon = () => {
		scrollToHighlighted();
		if (scrollTimer) clearTimeout(scrollTimer);
		scrollTimer = setTimeout(scrollToHighlighted, 0);
	};

	/** The value to highlight with no keyboard input: the anchor, else the auto-highlight rule. */
	const resting = (values: Value[], query: string, useAnchor: boolean): Value | undefined => {
		if (useAnchor && query === '') {
			const anchor = untrack(() => opts.anchor?.());
			if (anchor !== undefined && values.includes(anchor)) return anchor;
		}
		const mode = autoHighlight();
		if (mode === 'always' || (mode === true && query !== '')) return values[0];
		return undefined;
	};

	// Re-anchor whenever the set, the query or the open state changes (typing, external item
	// updates). `highlighted` reads/writes are untracked so this reacts only to those inputs —
	// arrow/hover moves change `highlighted` but not the set, so they won't clobber an
	// in-progress selection.
	let previousQuery: string | undefined;
	let previousOpen: boolean | undefined;
	let previousCount = 0;
	$effect(() => {
		const values = opts.values();
		const query = opts.query?.() ?? '';
		const open = opts.open?.() ?? true;
		untrack(() => {
			const opened = open && previousOpen !== true;
			const queryChanged = previousQuery !== undefined && query !== previousQuery;
			const cleared = queryChanged && query === '';
			// Options that load after the list opened (async sources) still get the anchor.
			const arrived = previousCount === 0 && values.length > 0;
			previousQuery = query;
			previousOpen = open;
			previousCount = values.length;
			if (!open) return;

			// A new query shows a new list: the first match belongs in view, however far the user
			// had scrolled the previous one.
			const typed = queryChanged && !cleared;
			if (typed) {
				// The old highlight may be gone from the list; any rendered option finds the scroller.
				const probe = [highlighted, values[0]].find(
					(value) => value !== undefined && optionId(value)
				);
				const element =
					probe !== undefined && typeof document !== 'undefined'
						? document.getElementById(optionId(probe)!)
						: null;
				const container = opts.scrollContainer?.() ?? (element ? nearestScroller(element) : null);
				if (container) container.scrollTop = 0;
			}

			if (opened || cleared) {
				setHighlighted(resting(values, query, true), { reason: 'list' });
				scrollSoon();
				return;
			}
			const stale = highlighted === undefined || !values.includes(highlighted);
			// Typing starts the highlight over at the first match; without auto-highlight a
			// surviving highlight stays (and is scrolled back into view below).
			const next = typed || stale ? resting(values, query, arrived) : highlighted;
			if (typed && next === undefined && !stale) {
				scrollToHighlighted();
			} else {
				setHighlighted(next, { reason: 'list' });
				if (arrived) scrollSoon();
				else if (typed) scrollToHighlighted();
			}
		});
	});

	/**
	 * Re-run the resting highlight (anchor, else the auto-highlight rule) on demand, e.g. when a
	 * consumer opens the list itself rather than through `open`.
	 */
	const reanchor = () => {
		setHighlighted(resting(opts.values(), opts.query?.() ?? '', true), { reason: 'list' });
		scrollSoon();
	};

	/** Highlight a value and scroll its option into view (inside the list only). */
	const highlight = (value: Value | undefined, details?: HighlightDetails) => {
		setHighlighted(value, details ?? { reason: 'keyboard' });
		if (value !== undefined) scrollToHighlighted();
	};

	/**
	 * Move the highlight by `delta` values. Past an end it wraps, lands on no highlight (`loop:
	 * 'input'`) or stops (`loop: false`). With nothing highlighted, going forward starts at the
	 * first value and going back at the last.
	 */
	const move = (delta: number, details?: HighlightDetails) => {
		const values = opts.values();
		if (values.length === 0) return;
		const current = highlighted === undefined ? -1 : values.indexOf(highlighted);
		const mode = loopMode();
		let next: number | undefined;
		if (current === -1) {
			next = delta > 0 ? 0 : values.length - 1;
		} else if (mode === 'wrap') {
			next = (((current + delta) % values.length) + values.length) % values.length;
		} else if (mode === 'input') {
			const target = current + delta;
			next = target < 0 || target >= values.length ? undefined : target;
		} else {
			next = Math.max(0, Math.min(values.length - 1, current + delta));
		}
		highlight(next === undefined ? undefined : values[next], details);
	};

	/** Highlight the first value. */
	const first = (details?: HighlightDetails) => {
		const values = opts.values();
		if (values.length) highlight(values[0], details);
	};

	/** Highlight the last value. */
	const last = (details?: HighlightDetails) => {
		const values = opts.values();
		if (values.length) highlight(values[values.length - 1], details);
	};

	/**
	 * Pointer hover: highlights `value` unless the pointer hasn't moved. Browsers (Safari) fire
	 * a pointermove with unchanged coordinates when keyboard scrolling slides an option under a
	 * resting cursor; honoring it would snap the highlight away from the keyboard's choice.
	 * Returns whether the highlight was handled.
	 */
	const pointerHighlight = (value: Value | undefined, event?: MouseEvent | PointerEvent) => {
		if (event) {
			const moved =
				!lastPointer || lastPointer.x !== event.clientX || lastPointer.y !== event.clientY;
			lastPointer = { x: event.clientX, y: event.clientY };
			if (!moved) return false;
		}
		setHighlighted(value, { reason: 'pointer', event });
		return true;
	};

	let keyEvent: KeyboardEvent | undefined;
	const typeahead = opts.typeahead
		? createTypeahead<Value>({
				getItems: () => opts.values(),
				getText: opts.typeahead,
				getCurrentIndex: () =>
					highlighted === undefined ? -1 : opts.values().indexOf(highlighted),
				onMatch: (_index, value) => highlight(value, { reason: 'keyboard', event: keyEvent })
			})
		: null;

	// A pending buffer or scroll must not outlive the list.
	$effect(() => () => {
		typeahead?.reset();
		if (scrollTimer) clearTimeout(scrollTimer);
	});

	/** Keydown handler for the focused input: ArrowUp/Down, Home, End, Enter, typeahead. */
	const onKeydown = (event: KeyboardEvent) => {
		const details: HighlightDetails = { reason: 'keyboard', event };
		if (typeahead) {
			keyEvent = event;
			const consumed = typeahead.handleKey(event);
			keyEvent = undefined;
			if (consumed) {
				event.preventDefault();
				return;
			}
		}
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				move(1, details);
				break;
			case 'ArrowUp':
				event.preventDefault();
				move(-1, details);
				break;
			case 'Home':
				if (opts.values().length) {
					event.preventDefault();
					first(details);
				}
				break;
			case 'End':
				if (opts.values().length) {
					event.preventDefault();
					last(details);
				}
				break;
			case 'Enter':
				if (highlighted === undefined) break;
				event.preventDefault();
				opts.onSelect?.(highlighted);
				break;
		}
	};

	return {
		/** The currently highlighted value. */
		get highlighted() {
			return highlighted;
		},
		/** Why the highlight last moved, and the event behind it. */
		get highlightDetails() {
			return lastDetails;
		},
		/** DOM id of the highlighted option, for `aria-activedescendant`. */
		get activeDescendant() {
			return highlighted !== undefined ? optionId(highlighted) : undefined;
		},
		/**
		 * DOM id of a value's option: `optionId` when given, else the next id in sequence for
		 * `idPrefix`. `undefined` when neither was provided.
		 */
		optionId,
		/** Type-to-highlight state; `null` without the `typeahead` option. */
		typeahead: typeahead
			? {
					/** True while typed characters are buffered (Space belongs to the search, not to selection). */
					get isTyping() {
						return typeahead.isTyping;
					},
					/** Drop the buffered characters, e.g. on blur or close. */
					reset: typeahead.reset
				}
			: null,
		/** Set the highlight without scrolling — for hover. Prefer `pointerHighlight`. */
		setHighlighted,
		pointerHighlight,
		highlight,
		move,
		first,
		last,
		reanchor,
		scrollToHighlighted,
		onKeydown
	};
};
