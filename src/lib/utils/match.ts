/**
 * The default search matcher for Command, filterable menus and lists: an item matches when the
 * query appears in its text, ignoring case and accents in the given locale.
 */
import { createListFilter, type ListFilterOptions } from './listFilter.js';

/** The searchable fields of a list, menu or command item. */
export type MatchableItem = {
	/** Visible label. */
	label?: string | null;
	/** Plain text to search instead of the label, for items whose label is not plain text. */
	textValue?: string | null;
	/** Extra terms that also find the item. */
	keywords?: readonly string[] | null;
	/** The item's value, searched last. */
	value?: string | number | null;
};

/** Decides whether `item` matches the search `query`. */
export type ItemMatcher<Item extends MatchableItem = MatchableItem> = (
	item: Item,
	query: string
) => boolean;

export type ItemMatcherOptions = ListFilterOptions & {
	/**
	 * `contains` (default) finds the query anywhere in the item's text, label, keywords and value
	 * read as one string. `startsWith` matches when the label, a keyword or the value starts
	 * with the query.
	 */
	mode?: 'contains' | 'startsWith';
};

/** The fields of `item` that searches read, in order: label (or `textValue`), keywords, value. */
export const getItemSearchTexts = (item: MatchableItem): string[] => {
	const texts: string[] = [];
	const label = item.textValue ?? item.label;
	if (label) texts.push(label);
	for (const keyword of item.keywords ?? []) if (keyword) texts.push(keyword);
	if (item.value != null && item.value !== '') texts.push(String(item.value));
	return texts;
};

/** Builds a matcher for `options`; the locale and collator options decide case and accents. */
export const createItemMatcher = <Item extends MatchableItem = MatchableItem>(
	options: ItemMatcherOptions = {}
): ItemMatcher<Item> => {
	const { mode = 'contains', ...filterOptions } = options;
	const filter = createListFilter(filterOptions);
	if (mode === 'startsWith') {
		return (item, query) =>
			query === '' || getItemSearchTexts(item).some((text) => filter.startsWith(text, query));
	}
	return (item, query) =>
		query === '' || filter.contains(getItemSearchTexts(item).join(' '), query);
};

let defaultMatcher: ItemMatcher | undefined;

/**
 * The default matcher: case- and accent-insensitive `contains` over label (or `textValue`),
 * keywords and value, in the runtime locale. Command uses it when no `filter` is given.
 */
export const matchItem: ItemMatcher = (item, query) => {
	defaultMatcher ??= createItemMatcher();
	return defaultMatcher(item, query);
};
