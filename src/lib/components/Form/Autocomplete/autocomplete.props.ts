import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Messages } from '$lib/i18n/en.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { ListLoop } from '$lib/utils/useListNavigation.svelte.js';
import type { InputProps } from '../Field/field.js';
import type {
	ComboboxFilter,
	ComboboxHighlightChangePayload,
	ComboboxItemsRequest,
	ComboboxOption,
	MaybePromise
} from '../Combobox/combobox.props.js';
import type { AutocompleteThemeProps } from './autocomplete.theme.js';

/** One suggestion: plain text, or an option with a label, description and metadata. */
export type AutocompleteItem = string | ComboboxOption;

/** A labelled group of suggestions. */
export type AutocompleteItemGroup = {
	/** Label rendered above the group's suggestions. */
	label?: string;
	/** The suggestions of the group. */
	items: AutocompleteItem[];
};

/** Suggestions and `{ label, items }` groups can be mixed freely. */
export type AutocompleteItems = (AutocompleteItem | AutocompleteItemGroup)[];

/** Second argument of an `items` function. */
export type AutocompleteItemsRequest = ComboboxItemsRequest;

/** The suggestions, or a function that returns them for the current text. */
export type AutocompleteItemsSource =
	| AutocompleteItems
	| ((query: string, request: AutocompleteItemsRequest) => MaybePromise<AutocompleteItems>);

/** Decides whether a suggestion matches the typed text. */
export type AutocompleteFilter = ComboboxFilter;

/**
 * How the suggestions relate to the text:
 * - `'list'`: suggestions are filtered by the text. The text only changes when you choose one.
 * - `'both'`: filtered, and the text previews the highlighted suggestion (inline completion).
 * - `'inline'`: not filtered, and the text previews the highlighted suggestion.
 * - `'none'`: not filtered, and the text never changes until you choose one.
 */
export type AutocompleteMode = 'list' | 'both' | 'inline' | 'none';

/** What `onSelect` receives. */
export type AutocompleteSelectPayload = {
	/** The chosen suggestion; a plain-text item arrives as `{ value: text, label: text }`. */
	item: ComboboxOption;
	/** The text now in the input: the suggestion's label. */
	value: string;
	/** The click or key event behind the choice. */
	event?: Event;
};

export type AutocompleteHighlightChangePayload = ComboboxHighlightChangePayload;

/** Native attributes the underlying input accepts; the component owns identity, value and ARIA state. */
export type AutocompleteInputAttributes = Omit<
	HTMLInputAttributes,
	| 'class'
	| 'disabled'
	| 'id'
	| 'name'
	| 'placeholder'
	| 'readonly'
	| 'required'
	| 'role'
	| 'type'
	| 'value'
	| 'form'
	| 'autocomplete'
	| 'aria-activedescendant'
	| 'aria-autocomplete'
	| 'aria-controls'
	| 'aria-expanded'
	| 'aria-haspopup'
	| 'aria-invalid'
>;

export type AutocompleteProps = InputProps<'text'> & {
	/**
	 * The suggestions: strings, `{ value, label, description?, disabled?, data? }` options, groups
	 * of either, or a function returning them for the current text. The function receives
	 * `(query, { signal })`: it is called after a 100ms pause in typing, the signal is aborted when
	 * a newer text replaces the request, and a response that is not the latest is ignored.
	 */
	items: AutocompleteItemsSource;
	/**
	 * How suggestions relate to the text. See `AutocompleteMode`.
	 * @default 'list'
	 */
	mode?: AutocompleteMode;
	/**
	 * Which suggestion is highlighted without keyboard input. `true` highlights the first match
	 * while text is typed, `'always'` also while the text is empty, and `false` highlights nothing
	 * until an arrow key moves it, so Enter keeps the typed text. Pair `true` with `mode="both"` or
	 * `"inline"` to complete the text as you type.
	 * @default false
	 */
	autoHighlight?: boolean | 'always';
	/**
	 * Whether the list is open. Bindable. The list only shows while there is something to show
	 * (suggestions, a loading or error message, or a "no options" message for the typed text).
	 */
	open?: boolean;
	/** Initial open state when `open` is omitted. */
	defaultOpen?: boolean;
	/**
	 * Called before the list opens or closes, with the requested state and the change details:
	 * `reason` (`'input-change'`, `'escape-key'`, `'item-press'`, `'list-navigation'`,
	 * `'trigger-press'`, `'trigger-focus'`, `'focus-out'`…), the originating `event`, the
	 * `interaction` type and `cancel()`. Calling `details.cancel()` keeps the list as it is.
	 */
	onOpenChange?: OpenChangeHandler;
	/** Called once per open, after the open transition finishes. */
	onAfterOpen?: () => void;
	/** Called once per close, after the close transition finishes. */
	onAfterClose?: () => void;
	/**
	 * Opens the list when the input receives focus, even before anything is typed: static
	 * arrays list every suggestion and `items` functions are called with an empty text.
	 * @default false
	 */
	openOnFocus?: boolean;
	/**
	 * Whether the component narrows static suggestions to the typed text. Turn it off when the
	 * suggestions are already the right ones for the text. Always off for `mode="inline"` and
	 * `"none"`. Functions passed as `items` filter themselves.
	 * @default true
	 */
	shouldFilter?: boolean;
	/**
	 * Decides whether a suggestion matches the typed text. Defaults to a case- and
	 * accent-insensitive substring match on the label, in the active I18n locale.
	 */
	filter?: AutocompleteFilter;
	/** Shows at most this many matching suggestions. Matching stops once the limit is reached. */
	limit?: number;
	/**
	 * What moving past either end of the list does: `'wrap'` continues at the other end, `'input'`
	 * lands on no highlight first (the text returns to what was typed) and wraps from there, and
	 * `false` stops at the end.
	 * @default 'wrap'
	 */
	loop?: ListLoop;
	/** Called when a suggestion is chosen with a click or Enter, after the value changed. */
	onSelect?: (payload: AutocompleteSelectPayload) => void;
	/** Called when the highlighted suggestion changes, with why it moved and the event behind it. */
	onHighlightChange?: (payload: AutocompleteHighlightChangePayload) => void;
	/** Called with the new text for every edit the user makes or a suggestion fills in. */
	onValueChange?: (value: string | null) => void;
	/** Hint text shown in the empty input. */
	placeholder?: string;
	/** Text shown while suggestions load. Defaults to "Loading...". */
	loadingText?: string;
	/** Text shown when no suggestion matches. Defaults to "No options found". */
	emptyText?: string;
	/**
	 * Browser autofill hint for the input, such as `'email'` or `'address-level2'`. The component
	 * offers its own suggestions, so the browser's are off unless you ask.
	 * @default 'off'
	 */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/** Render a separator between consecutive groups. @default true */
	separators?: boolean;
	/** Custom row renderer: receives the suggestion. Overrides the default title and description layout. */
	item?: Snippet<[ComboboxOption]>;
	/** Native attributes applied to the underlying input, such as `inputmode` or `maxlength`. */
	inputAttrs?: AutocompleteInputAttributes;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Theme overrides for the input, its container and the suggestion list. */
	theme?: AutocompleteThemeProps & InputProps<'text'>['theme'];
};
