import { untrack } from 'svelte';
import { getTabValue, type TabItem } from './tabbar.props.js';

/**
 * Why a tab list selected a tab by itself: `initial` on mount, `disabled` when the selected tab
 * became disabled, `missing` when it was removed or `value` named no tab.
 */
export type TabFallbackReason = 'initial' | 'disabled' | 'missing';

/** The tab that shows as selected, and why it differs from `value` when it does. */
export type TabSelection = { index: number; reason?: TabFallbackReason };

/** Where the selection last settled: `undefined` until a tab was first resolved. */
export type TabSelectionHistory = { lastIndex: number | undefined } | undefined;

export const isTabDisabled = (item: TabItem | undefined) =>
	typeof item === 'object' && item.disabled === true;

const firstEnabledIndex = (items: TabItem[]) => items.findIndex((item) => !isTabDisabled(item));

/** The default selection: the first enabled tab's value, else the first tab's, else `''`. */
export const getDefaultTabValue = (items: TabItem[]): string => {
	const index = Math.max(0, firstEnabledIndex(items));
	const item = items[index];
	return item === undefined ? '' : getTabValue(item, index);
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
 * Resolves the tab to show for `value`. A value that names an enabled tab is kept. Otherwise the
 * first enabled tab is selected (`initial` before any tab was resolved, `disabled` when the value
 * names a disabled tab), or the enabled tab nearest to where the selection last sat (`missing`).
 * With no enabled tab, a disabled match stays selected and an unknown value selects nothing (-1).
 */
export const resolveTabSelection = (
	items: TabItem[],
	value: string,
	history: TabSelectionHistory
): TabSelection => {
	const index = items.findIndex((item, itemIndex) => getTabValue(item, itemIndex) === value);
	if (index !== -1 && !isTabDisabled(items[index])) return { index };

	const first = firstEnabledIndex(items);
	if (first === -1) return { index };
	if (history === undefined) return { index: first, reason: 'initial' };
	if (index !== -1) return { index: first, reason: 'disabled' };
	return {
		index: history.lastIndex === undefined ? first : nearestEnabledIndex(items, history.lastIndex),
		reason: 'missing'
	};
};

type TabSelectionOptions = {
	items: () => TabItem[];
	value: () => string;
	/** Writes a fallback the component chose by itself; runs untracked, once per fallback. */
	onFallback: (value: string, details: { reason: TabFallbackReason; index: number }) => void;
};

/**
 * One effective selection for a tab list. `index` is what renders — on the server too — and an
 * automatic fallback is written back through `onFallback` after it renders, so a bound `value`
 * and the rendered tab never disagree for longer than one flush.
 */
export const useTabSelection = (options: TabSelectionOptions) => {
	// A plain variable on purpose: it describes the last committed selection and must not make
	// the selection depend on its own write-back.
	let history: TabSelectionHistory;

	const selection = $derived(resolveTabSelection(options.items(), options.value(), history));

	$effect(() => {
		const { index, reason } = selection;
		const items = options.items();
		if (items.length > 0) {
			history = { lastIndex: index >= 0 ? index : history?.lastIndex };
		}
		if (!reason) return;
		untrack(() => options.onFallback(getTabValue(items[index], index), { reason, index }));
	});

	return {
		/** Index of the tab that shows as selected; -1 when no tab can be selected. */
		get index() {
			return selection.index;
		}
	};
};
