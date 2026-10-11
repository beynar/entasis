/**
 * Locale-aware text matching for filterable lists (Combobox, TagsInput, Command, PhoneInput,
 * menus). Comparisons go through `Intl.Collator` with `usage: 'search'` and, by default,
 * `sensitivity: 'base'`, so `eclair` finds `Éclair` and case never matters, while each language
 * keeps its own rules (in Turkish, `i` matches `İ` but not `I`).
 */

export type ListFilterOptions = Omit<Intl.CollatorOptions, 'usage'> & {
	/** Locale of the compared text. Components pass the active I18n locale; defaults to the runtime's. */
	locale?: Intl.LocalesArgument;
};

/** How an item's text has to relate to the query. */
export type ListFilterMatch = 'contains' | 'startsWith';

export type ListFilterQueryOptions<T> = {
	/**
	 * The text of an item: one string, or several (label, keywords…) of which any may match.
	 * Defaults to `String(item)`.
	 */
	text?: (item: T) => string | readonly (string | null | undefined)[];
	/** `contains` (default), `startsWith`, or a predicate built on this filter. */
	match?: ListFilterMatch | ((text: string, query: string) => boolean);
	/**
	 * Stop after this many results. Matching stops as soon as the limit is reached, so the rest
	 * of a long list is never compared. For grouped lists, pass what is left of the limit to each
	 * group.
	 */
	limit?: number;
};

export type ListFilter = {
	/** The locale the collator resolved to. */
	readonly locale: string;
	/** Whether `query` appears anywhere in `text`. An empty query matches everything. */
	contains: (text: string, query: string) => boolean;
	/** Whether `text` starts with `query`. An empty query matches everything. */
	startsWith: (text: string, query: string) => boolean;
	/** Whether `text` and `query` are the same text under this filter's sensitivity. */
	equals: (text: string, query: string) => boolean;
	/** The items whose text matches `query`, in order, up to `limit`. */
	filter: <T>(items: Iterable<T>, query: string, options?: ListFilterQueryOptions<T>) => T[];
};

const CACHE_LIMIT = 64;
const cache = new Map<string, ListFilter>();

const ASCII_RE = /^[\x20-\x7e]*$/;
const MARK_RE = /\p{M}/u;
const MARK_CHAR_RE = /^\p{M}$/u;

const localeKey = (locale: Intl.LocalesArgument) => {
	if (locale === undefined) return '';
	return Array.isArray(locale) ? locale.map(String).join(',') : String(locale);
};

// Offsets of the characters of `text` that are not combining marks.
const baseOffsets = (text: string) => {
	const offsets: number[] = [];
	for (let index = 0; index < text.length; index++) {
		if (!MARK_CHAR_RE.test(text[index])) offsets.push(index);
	}
	return offsets;
};

const buildFilter = (
	locale: Intl.LocalesArgument,
	collatorOptions: Omit<ListFilterOptions, 'locale'>
): ListFilter => {
	const collator = new Intl.Collator(locale, {
		sensitivity: 'base',
		...collatorOptions,
		usage: 'search'
	});
	const resolved = collator.resolvedOptions();
	const resolvedLocale = resolved.locale;
	const ignoresCase = resolved.sensitivity === 'base' || resolved.sensitivity === 'accent';
	// Plain comparisons decide most queries; the collator only runs when they can't. Lower-casing
	// in the resolved locale keeps Turkish dotted and dotless i apart, as the collator does.
	const fold = (text: string) => (ignoresCase ? text.toLocaleLowerCase(resolvedLocale) : text);
	// Printable ASCII has no accents to ignore, so a plain miss is a collator miss as well.
	const plainSuffices = (text: string, query: string) =>
		!resolved.ignorePunctuation && ASCII_RE.test(text) && ASCII_RE.test(query);

	const equals = (text: string, query: string) =>
		collator.compare(text.normalize('NFC'), query.normalize('NFC')) === 0;

	const same = (text: string, start: number, end: number, query: string) =>
		collator.compare(text.slice(start, end), query) === 0;

	// Whether a slice of `text` equals `query` (both normalized), trying only the slice at the
	// start with `prefixOnly`. Slices are as long as the query. When either side carries combining
	// marks (Arabic tashkeel, Hebrew niqqud, which the default sensitivity ignores), a slice holds
	// as many characters other than marks as the query instead, tried with and without the marks
	// that follow it, so marks present on one side only don't shift it.
	const matchesSlice = (text: string, query: string, prefixOnly: boolean) => {
		if (!MARK_RE.test(text) && !MARK_RE.test(query)) {
			const last = prefixOnly ? 0 : text.length - query.length;
			for (let start = 0; start <= last; start++) {
				if (same(text, start, start + query.length, query)) return true;
			}
			return false;
		}
		const count = baseOffsets(query).length;
		const bases = baseOffsets(text);
		if (count === 0 || bases.length < count) return false;
		const last = prefixOnly ? 0 : bases.length - count;
		for (let first = 0; first <= last; first++) {
			const start = first === 0 ? 0 : bases[first];
			const withMarks = bases[first + count] ?? text.length;
			const withoutMarks = bases[first + count - 1] + 1;
			if (same(text, start, withMarks, query)) return true;
			if (withoutMarks !== withMarks && same(text, start, withoutMarks, query)) return true;
		}
		return false;
	};

	const startsWith = (text: string, query: string) => {
		if (query === '' || text.startsWith(query)) return true;
		if (fold(text).startsWith(fold(query))) return true;
		if (plainSuffices(text, query)) return false;
		return matchesSlice(text.normalize('NFC'), query.normalize('NFC'), true);
	};

	const contains = (text: string, query: string) => {
		if (query === '' || text.includes(query)) return true;
		if (fold(text).includes(fold(query))) return true;
		if (plainSuffices(text, query)) return false;
		return matchesSlice(text.normalize('NFC'), query.normalize('NFC'), false);
	};

	const filter = <T>(
		items: Iterable<T>,
		query: string,
		{ text, match = 'contains', limit = Infinity }: ListFilterQueryOptions<T> = {}
	): T[] => {
		const results: T[] = [];
		if (limit <= 0) return results;
		const predicate =
			typeof match === 'function' ? match : match === 'startsWith' ? startsWith : contains;
		for (const item of items) {
			const texts = text ? text(item) : String(item);
			const matched =
				typeof texts === 'string'
					? predicate(texts, query)
					: texts.some((candidate) => candidate != null && predicate(candidate, query));
			if (!matched) continue;
			results.push(item);
			if (results.length >= limit) break;
		}
		return results;
	};

	return { locale: resolvedLocale, contains, startsWith, equals, filter };
};

/**
 * A cached filter for `options`. Building an `Intl.Collator` is expensive, so filters are shared
 * per locale and collator options.
 */
export const createListFilter = (options: ListFilterOptions = {}): ListFilter => {
	const { locale, ...rest } = options;
	// An option given as `undefined` is not set: it neither overrides a default nor gets a cache
	// entry of its own (JSON drops it, so it would share the key of the defaults).
	const collatorOptions = Object.fromEntries(
		Object.entries(rest)
			.filter(([, value]) => value !== undefined)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
	) as Omit<ListFilterOptions, 'locale'>;
	const key = `${localeKey(locale)}|${JSON.stringify(collatorOptions)}`;
	const cached = cache.get(key);
	if (cached) return cached;
	const listFilter = buildFilter(locale, collatorOptions);
	if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
	cache.set(key, listFilter);
	return listFilter;
};
