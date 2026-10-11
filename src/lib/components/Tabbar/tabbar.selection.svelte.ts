import { untrack } from 'svelte';
import { getTabValue, type TabItem } from './tabbar.props.js';

/**
 * Why a tab list selected a tab by itself: `initial` when `defaultValue` named a disabled or
 * unknown tab, `disabled` when the selected tab became disabled, `missing` when it was removed.
 */
export type TabFallbackReason = 'initial' | 'disabled' | 'missing';

/**
 * The tab that shows as selected. `fallback` is set when the tab list moves the selection by
 * itself: the new value is written back, and reported unless it is the silent `default`.
 */
export type TabSelection = { index: number; fallback?: TabFallbackReason | 'default' };

/**
 * Who chose the value a tab list starts with: the parent (`value`), the parent's `defaultValue`,
 * or the tab list's own `default` (the first enabled tab) when neither was given.
 */
export type TabValueOrigin = 'value' | 'defaultValue' | 'default';

/**
 * What a tab list remembers between resolutions.
 * - `settled`: the value that last selected an enabled tab and that tab's index, kept while the
 *   value stays the same, so removing or disabling that tab is known to be the list's own change.
 * - `initial`: the list's own starting value (`defaultValue` or the default), kept until a tab is
 *   first selected, so tabs that arrive after mount still replace it.
 */
export type TabSelectionHistory = {
	settled?: { value: string; index: number };
	initial?: { value: string; origin: Exclude<TabValueOrigin, 'value'> };
};

export const isTabDisabled = (item: TabItem | undefined) =>
	typeof item === 'object' && item.disabled === true;

const firstEnabledIndex = (items: TabItem[]) => items.findIndex((item) => !isTabDisabled(item));

/** The default selection: the first enabled tab's value, else the first tab's, else `''`. */
export const getDefaultTabValue = (items: TabItem[]): string => {
	const index = Math.max(0, firstEnabledIndex(items));
	const item = items[index];
	return item === undefined ? '' : getTabValue(item, index);
};

/**
 * Who chose the starting value; read before `createBindableValue` writes its default back. A
 * `value` equal to `defaultValue` is the default written back into a binding: the server renders
 * a bound component again with it.
 */
export const getTabValueOrigin = (value: unknown, defaultValue: unknown): TabValueOrigin => {
	if (defaultValue !== undefined && (value === undefined || value === defaultValue)) {
		return 'defaultValue';
	}
	return value === undefined ? 'default' : 'value';
};

// After a removal, the tabs that sat on either side of the removed one are at `from` and
// `from - 1`; the next ring out is `from + 1` and `from - 2`, and so on. Following tabs win ties.
const nearestEnabledIndex = (items: TabItem[], from: number) => {
	for (let distance = 0; distance <= Math.max(from, items.length); distance += 1) {
		for (const index of [from + distance, from - distance - 1]) {
			if (index >= 0 && index < items.length && !isTabDisabled(items[index])) return index;
		}
	}
	return firstEnabledIndex(items);
};

/**
 * Resolves the tab to show for `value`. A value that names an enabled tab is kept. The tab list
 * replaces a value only when the change is its own: the selected tab was removed (`missing`, the
 * nearest enabled neighbour) or disabled (`disabled`, the first enabled tab), or its starting
 * value names no enabled tab (`initial` for `defaultValue`, the silent `default` otherwise). Any
 * other value came from the parent and is never replaced: a disabled tab it names stays selected
 * and an unknown value selects nothing (-1). With no enabled tab nothing can be replaced either.
 */
export const resolveTabSelection = (
	items: TabItem[],
	value: string,
	history: TabSelectionHistory = {}
): TabSelection => {
	const index = items.findIndex((item, itemIndex) => getTabValue(item, itemIndex) === value);
	if (index !== -1 && !isTabDisabled(items[index])) return { index };

	const first = firstEnabledIndex(items);
	if (first === -1) return { index };
	const { settled, initial } = history;
	if (settled?.value === value) {
		return index === -1
			? { index: nearestEnabledIndex(items, settled.index), fallback: 'missing' }
			: { index: first, fallback: 'disabled' };
	}
	if (initial?.value === value) {
		return { index: first, fallback: initial.origin === 'default' ? 'default' : 'initial' };
	}
	return { index };
};

type TabSelectionOptions = {
	items: () => TabItem[];
	value: () => string;
	/** Who chose the value present on mount; see `getTabValueOrigin`. */
	origin: TabValueOrigin;
	/**
	 * Writes a selection the tab list made by itself; runs untracked, once per fallback. `reason`
	 * is undefined for the default selection, which is written back but not reported.
	 */
	onFallback: (value: string, details: { index: number; reason?: TabFallbackReason }) => void;
};

/**
 * One effective selection for a tab list. `index` is what renders — on the server too — and a
 * fallback the list owns is written back through `onFallback` after it renders, so a bound
 * `value` and the rendered tab never disagree for longer than one flush. A value the parent set
 * is never written over, so two lists sharing one value cannot undo each other's picks.
 */
export const useTabSelection = (options: TabSelectionOptions) => {
	// A plain object on purpose: it describes the last committed selection and must not make the
	// selection depend on its own write-back.
	const history: TabSelectionHistory = {};
	if (options.origin !== 'value') {
		history.initial = { value: untrack(options.value), origin: options.origin };
	}

	const selection = $derived(resolveTabSelection(options.items(), options.value(), history));

	$effect(() => {
		const { index, fallback } = selection;
		const items = options.items();
		const value = options.value();
		if (!fallback && index !== -1 && !isTabDisabled(items[index])) {
			history.settled = { value, index };
			history.initial = undefined;
		} else {
			// The value moved on: there is no selected tab left to fall back from.
			if (history.settled?.value !== value) history.settled = undefined;
			if (history.initial?.value !== value) history.initial = undefined;
		}
		if (!fallback) return;
		const reason = fallback === 'default' ? undefined : fallback;
		untrack(() => options.onFallback(getTabValue(items[index], index), { index, reason }));
	});

	return {
		/** Index of the tab that shows as selected; -1 when no tab is. */
		get index() {
			return selection.index;
		}
	};
};
