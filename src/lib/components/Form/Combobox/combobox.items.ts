// Pure helpers over the options a Combobox or TagsInput lists: groups, matching and limits.
import { createListFilter } from '$lib/utils/listFilter.js';
import type {
	ComboboxFilter,
	ComboboxItems,
	ComboboxOption,
	ComboboxOptionGroup
} from './combobox.props.js';

export const isOptionGroup = (
	entry: ComboboxOption | ComboboxOptionGroup
): entry is ComboboxOptionGroup => 'items' in entry && Array.isArray(entry.items);

/** Every option, flattened across groups, in render order. */
export const flattenItems = (items: ComboboxItems): ComboboxOption[] =>
	items.flatMap((entry) => (isOptionGroup(entry) ? entry.items : [entry]));

/** Options a keyboard or pointer can act on: everything except disabled options. */
export const selectableOptions = (items: ComboboxItems): ComboboxOption[] =>
	flattenItems(items).filter((option) => !option.disabled);

export type RenderGroup = { label?: string; items: ComboboxOption[] };

/** Items as rendered: consecutive bare options bundled into one unlabeled group. */
export const toRenderGroups = (items: ComboboxItems): RenderGroup[] => {
	const groups: RenderGroup[] = [];
	let bare: RenderGroup | null = null;
	for (const entry of items) {
		if (isOptionGroup(entry)) {
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
};

/** The default match: a case- and accent-insensitive substring of the label, in `locale`. */
export const createOptionMatcher = (locale: string): ComboboxFilter => {
	const filter = createListFilter({ locale });
	return (option, query) => filter.contains(option.label, query);
};

type NarrowOptions = {
	/** Keeps an option when it returns `true`; an empty query matches everything. */
	match?: ComboboxFilter;
	/** Leaves out options that are already taken (TagsInput's selected tags). */
	exclude?: (option: ComboboxOption) => boolean;
	/** Stop once this many options are kept. The rest of the list is never compared. */
	limit?: number;
};

/**
 * Narrows `items` to the options that match `query`, keeping their groups (a group with no
 * match disappears) and stopping once `limit` options are kept, across groups.
 */
export const narrowItems = (
	items: ComboboxItems,
	query: string,
	{ match, exclude, limit }: NarrowOptions = {}
): ComboboxItems => {
	let remaining = limit !== undefined && limit >= 0 ? limit : Infinity;
	const keep = (option: ComboboxOption) => {
		if (remaining <= 0) return false;
		if (exclude?.(option)) return false;
		if (query !== '' && match && !match(option, query)) return false;
		remaining -= 1;
		return true;
	};
	const result: ComboboxItems = [];
	for (const entry of items) {
		if (remaining <= 0) break;
		if (isOptionGroup(entry)) {
			const kept = [];
			for (const option of entry.items) {
				if (remaining <= 0) break;
				if (keep(option)) kept.push(option);
			}
			if (kept.length > 0) result.push({ ...entry, items: kept });
		} else if (keep(entry)) {
			result.push(entry);
		}
	}
	return result;
};
