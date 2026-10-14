import { createBindableValue } from '$lib/utils/state.svelte.js';
import type { useNavigation } from '$lib/utils/useNavigation.svelte.js';
import type { MenuFilter, MenuFilterOptions, MenuItem } from './menu.props.js';
import { filterMenuItems } from './menuTree.js';

type Navigation = ReturnType<typeof useNavigation>;

/** Where the search text of one menu level lives, and how a change of it is reported. */
export type MenuSearchOptions = {
	/** The `filter` prop. */
	filter: () => MenuFilter | undefined;
	/** The controlled `search` text, `undefined` when the menu is uncontrolled. */
	search: () => string | undefined;
	/** Writes back to a bound `search`. */
	write: (next: string) => void;
	defaultSearch: () => string | undefined;
	onSearchChange: () => ((search: string) => void) | undefined;
};

/**
 * The search state of a filterable menu: the field's text (controlled or not), the options of the
 * filter, and the rows left for that text. Call during component initialisation.
 */
export const useMenuSearch = (opts: MenuSearchOptions) => {
	const state = createBindableValue<string>(
		opts.search,
		opts.write,
		() => opts.defaultSearch() ?? ''
	);
	const config = $derived.by((): MenuFilterOptions | null => {
		const filter = opts.filter();
		if (filter === undefined || filter === false) return null;
		return filter === true ? {} : filter;
	});

	return {
		/** Whether the menu has a search field. */
		get enabled() {
			return config !== null;
		},
		get options(): MenuFilterOptions | undefined {
			return config ?? undefined;
		},
		get search() {
			return state.value;
		},
		/** Edits the text; `onSearchChange` runs once per edit that changes it. */
		set(next: string) {
			if (next === state.value) return;
			state.value = next;
			opts.onSearchChange()?.(next);
		},
		/** The rows that match the text, or all of them without a field. */
		visible(items: readonly MenuItem[]): MenuItem[] {
			return config === null ? [...items] : filterMenuItems(items, state.value, config);
		}
	};
};

// The caret rests at the start or end of the field with nothing selected, so an arrow pointing past
// that edge has no text left to move through. Shift+arrow extends a selection instead.
const isCaretAtEdge = (field: HTMLInputElement, edge: 'start' | 'end', shift: boolean) => {
	if (shift) return false;
	const { selectionStart, selectionEnd, value } = field;
	if (selectionStart === null || selectionEnd === null || selectionStart !== selectionEnd) {
		return false;
	}
	return edge === 'start' ? selectionStart === 0 : selectionEnd === value.length;
};

/** The attribute a row reports its value in, for the highlight callback. */
export const HIGHLIGHT_VALUE_ATTRIBUTE = 'data-menu-value';

/**
 * Reports the highlighted row of a menu list: its element, or `null` when none is. The list marks
 * the row `data-highlighted` itself, whether the keyboard, the pointer or a filter moved it.
 * Returns the cleanup.
 */
export const watchHighlight = (list: HTMLElement, report: (row: HTMLElement | null) => void) => {
	let last: HTMLElement | null | undefined;
	const read = () => {
		const row = list.querySelector<HTMLElement>('[data-highlighted="true"]');
		if (row === last) return;
		last = row;
		report(row);
	};
	const observer = new MutationObserver(read);
	observer.observe(list, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ['data-highlighted']
	});
	read();
	return () => observer.disconnect();
};

/** The value a highlighted row reports: its `data-menu-value`, else its text. */
export const rowValue = (row: HTMLElement | null): string | undefined => {
	if (!row) return undefined;
	return row.getAttribute(HIGHLIGHT_VALUE_ATTRIBUTE) ?? row.textContent?.trim() ?? undefined;
};

/**
 * The key handler of a menu's search field. Focus stays in the field, so ArrowUp and ArrowDown
 * only move the highlight (`virtualFocus`), Enter presses the highlighted row, and ArrowRight at
 * the end of the text opens a highlighted submenu while ArrowLeft at its start leaves this level.
 */
export const createSearchKeys = (options: {
	navigation: Navigation;
	list: () => HTMLElement | null;
	/** Whether text direction is right-to-left, which swaps ArrowLeft and ArrowRight. */
	rtl: () => boolean;
	/** Leaves this menu level; returns whether there was one to leave. */
	leave: () => boolean;
}) => {
	type LevelRow = HTMLElement & { onNext?: () => boolean | void };

	const highlighted = () =>
		options.list()?.querySelector<HTMLElement>('[data-highlighted="true"]') ?? null;

	/** Moves the highlight one row up or down, wrapping, over rows that can take it. */
	const move = (direction: 1 | -1) => {
		const { navigation } = options;
		const count = options.list()?.querySelectorAll('[role^="menuitem"]').length ?? 0;
		if (count === 0) return;
		const current = navigation.focusedIndex;
		let index = current === null || current < 0 ? (direction === 1 ? -1 : count) : current;
		for (let step = 0; step < count; step += 1) {
			index = (index + direction + count) % count;
			navigation.focusItem(index);
			if (navigation.focusedIndex === index) return;
		}
	};

	return (event: KeyboardEvent) => {
		if (event.defaultPrevented || event.isComposing) return;
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const field = event.currentTarget as HTMLInputElement;
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
				event.preventDefault();
				move(event.key === 'ArrowDown' ? 1 : -1);
				return;
			case 'Enter': {
				const row = highlighted();
				if (!row || row.getAttribute('aria-disabled') === 'true' || row.matches(':disabled'))
					return;
				event.preventDefault();
				row.click();
				return;
			}
			case 'ArrowLeft':
			case 'ArrowRight': {
				const forward = (event.key === 'ArrowRight') !== options.rtl();
				if (forward) {
					if (!isCaretAtEdge(field, 'end', event.shiftKey)) return;
					const row = highlighted() as LevelRow | null;
					if (typeof row?.onNext === 'function' && row.onNext() !== false) event.preventDefault();
					return;
				}
				if (!isCaretAtEdge(field, 'start', event.shiftKey)) return;
				if (options.leave()) event.preventDefault();
				return;
			}
		}
	};
};
