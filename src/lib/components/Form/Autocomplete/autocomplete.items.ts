// Pure helpers behind Autocomplete: suggestions as the Combobox list expects them, and the text
// an inline completion writes into the input.
import { createListFilter } from '$lib/utils/listFilter.js';
import type {
	ComboboxItems,
	ComboboxItemsSource,
	ComboboxOption,
	ComboboxOptionGroup
} from '../Combobox/combobox.props.js';
import type {
	AutocompleteItem,
	AutocompleteItemGroup,
	AutocompleteItems,
	AutocompleteItemsSource
} from './autocomplete.props.js';

const isGroup = (entry: AutocompleteItem | AutocompleteItemGroup): entry is AutocompleteItemGroup =>
	typeof entry === 'object' && 'items' in entry && Array.isArray(entry.items);

/** A plain-text suggestion is an option whose value and label are that text. */
export const toOption = (item: AutocompleteItem): ComboboxOption =>
	typeof item === 'string' ? { value: item, label: item } : item;

/** Suggestions as options: strings become `{ value, label }`, everything else is passed through. */
export const normalizeItems = (items: AutocompleteItems): ComboboxItems =>
	items.map((entry): ComboboxOption | ComboboxOptionGroup =>
		isGroup(entry) ? { ...entry, items: entry.items.map(toOption) } : toOption(entry)
	);

/** The Combobox list's source for these suggestions; functions have their results normalized. */
export const normalizeSource = (
	source: AutocompleteItemsSource | undefined
): ComboboxItemsSource | undefined => {
	if (source === undefined) return undefined;
	if (typeof source !== 'function') return normalizeItems(source);
	return async (query, request) => normalizeItems((await source(query ?? '', request)) ?? []);
};

/** What previewing a suggestion over the typed text writes into the input. */
export type InlineCompletion = {
	/** The text the input shows while the suggestion is previewed. */
	text: string;
	/** Where the previewed (not yet typed) part starts; selected, so typing replaces it. */
	selectionStart: number;
	/** The end of the text. */
	selectionEnd: number;
	/** Whether the suggestion continues what was typed, rather than replacing it. */
	continues: boolean;
};

/**
 * The input text for previewing `label` over what was `typed`. A label that continues the typed
 * text completes it, with the added part selected so the next key replaces it. Any other label
 * replaces the text outright, with the caret at its end. `null` when the suggestion reads the
 * same as the typed text.
 */
export const completeInline = (
	label: string,
	typed: string,
	locale: string
): InlineCompletion | null => {
	const filter = createListFilter({ locale });
	// A suggestion that reads the same as the text has nothing to preview.
	if (filter.equals(label, typed)) return null;
	const continues = typed !== '' && label.length > typed.length && filter.startsWith(label, typed);
	// The typed letters stay as typed, so deleting the completion leaves exactly what was typed.
	const keepsTyping = continues && filter.equals(label.slice(0, typed.length), typed);
	const text = keepsTyping ? typed + label.slice(typed.length) : label;
	return {
		text,
		selectionStart: keepsTyping ? typed.length : text.length,
		selectionEnd: text.length,
		continues
	};
};
