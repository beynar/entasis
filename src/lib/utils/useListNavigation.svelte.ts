import { untrack } from 'svelte';
import { createTypeahead } from './typeahead.js';

type ListNavigationOptions<Value extends string = string> = {
	/**
	 * Ordered, selectable values (already filtered — exclude disabled items).
	 * Re-read reactively: derive it from your filtered data.
	 */
	values: () => Value[];
	/**
	 * DOM id of a value's option element — drives `aria-activedescendant` and scroll-into-view.
	 */
	optionId?: (value: Value) => string;
	/** Fires whenever the highlight moves (keyboard, hover, or re-anchoring). */
	onHighlightChange?: (value: Value | undefined) => void;
	/**
	 * Type-to-highlight: printable keys jump to the next value whose text starts with the
	 * typed buffer. Only for lists whose focus is NOT in a text input (Select, not Combobox).
	 */
	typeahead?: (value: Value) => string;
	/** Fires on Enter with the highlighted value. */
	onSelect?: (value: Value) => void;
	/** Wrap around both ends when moving past them. Default `true`. */
	loop?: boolean;
};

/**
 * Value-driven keyboard navigation for combobox-style widgets (command palettes, dropdowns,
 * autocompletes): DOM focus stays on the input, only the highlight moves ("virtual focus",
 * exposed via `aria-activedescendant`).
 *
 * Unlike `useNavigation` (DOM/index-based roving tabindex — right for menus, tabs, toolbars),
 * the highlight here is a *value*, so it survives the item set changing underneath it: when the
 * highlighted value disappears (typing in a filter), the highlight re-anchors to the first value.
 *
 * Must be called during component init (it registers an `$effect`).
 *
 * Wire-up: `onkeydown={nav.onKeydown}` on the input, `aria-activedescendant={nav.activeDescendant}`,
 * `onpointermove={() => nav.setHighlighted(value)}` on rows, `aria-selected={nav.highlighted === value}`.
 */
export const useListNavigation = <Value extends string = string>(
	opts: ListNavigationOptions<Value>
) => {
	let highlighted = $state<Value | undefined>();

	const setHighlighted = (value: Value | undefined) => {
		if (highlighted === value) return;
		highlighted = value;
		opts.onHighlightChange?.(value);
	};

	// Re-anchor to the first value whenever the set changes (typing, external item updates).
	// `highlighted` reads/writes are untracked so this reacts only to `values` — arrow/hover
	// moves change `highlighted` but not the set, so they won't clobber an in-progress selection.
	$effect(() => {
		const values = opts.values();
		untrack(() => {
			if (highlighted === undefined || !values.includes(highlighted)) {
				setHighlighted(values[0]);
			}
		});
	});

	/** Highlight a value and scroll its option into view. */
	const highlight = (value: Value | undefined) => {
		setHighlighted(value);
		if (value !== undefined && opts.optionId) {
			document.getElementById(opts.optionId(value))?.scrollIntoView({ block: 'nearest' });
		}
	};

	/** Move the highlight by `delta` values, wrapping around both ends (unless `loop: false`). */
	const move = (delta: number) => {
		const values = opts.values();
		if (values.length === 0) return;
		const current = highlighted === undefined ? -1 : values.indexOf(highlighted);
		const next =
			opts.loop === false
				? Math.max(0, Math.min(values.length - 1, current + delta))
				: (((current + delta) % values.length) + values.length) % values.length;
		highlight(values[next]);
	};

	/** Highlight the first value. */
	const first = () => {
		const values = opts.values();
		if (values.length) highlight(values[0]);
	};

	/** Highlight the last value. */
	const last = () => {
		const values = opts.values();
		if (values.length) highlight(values[values.length - 1]);
	};

	const typeahead = opts.typeahead
		? createTypeahead<Value>({
				getItems: () => opts.values(),
				getText: opts.typeahead,
				getCurrentIndex: () =>
					highlighted === undefined ? -1 : opts.values().indexOf(highlighted),
				onMatch: (_index, value) => highlight(value)
			})
		: null;

	/** Keydown handler for the focused input: ArrowUp/Down, Home, End, Enter, typeahead. */
	const onKeydown = (event: KeyboardEvent) => {
		if (typeahead?.handleKey(event)) {
			event.preventDefault();
			return;
		}
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				move(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				move(-1);
				break;
			case 'Home':
				if (opts.values().length) {
					event.preventDefault();
					first();
				}
				break;
			case 'End':
				if (opts.values().length) {
					event.preventDefault();
					last();
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
		/** DOM id of the highlighted option, for `aria-activedescendant`. */
		get activeDescendant() {
			return highlighted !== undefined ? opts.optionId?.(highlighted) : undefined;
		},
		/** Set the highlight without scrolling — for pointermove/hover. */
		setHighlighted,
		highlight,
		move,
		first,
		last,
		onKeydown
	};
};
