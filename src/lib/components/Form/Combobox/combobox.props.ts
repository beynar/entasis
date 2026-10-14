import type { Density } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { InputProps } from '../Field/field.js';
import type { ComboboxThemeProps } from './combobox.theme.js';
import type { Snippet } from 'svelte';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { HighlightReason, ListLoop } from '$lib/utils/useListNavigation.svelte.js';

export type MaybePromise<T> = T | Promise<T>;

export type ComboboxOption = {
	/** Unique value submitted when this option is selected. */
	value: string;
	/** Display text shown in the option list and search input when selected. */
	label: string;
	/** Supporting text rendered below the option label in the dropdown. */
	description?: string;
	/** Dims the option and keeps it out of keyboard navigation: it cannot be highlighted or selected. */
	disabled?: boolean;
	/** Optional arbitrary metadata attached to the option. */
	data?: Record<string, unknown>;
};

export type ComboboxOptionGroup = {
	/** Optional group label rendered above the group's options. */
	label?: string;
	/** The options of the group. */
	items: ComboboxOption[];
};

/** Flat options and `{ label, items }` groups can be mixed freely, as in Select. */
export type ComboboxItems = (ComboboxOption | ComboboxOptionGroup)[];

/** Second argument of an `items` function. */
export type ComboboxItemsRequest = {
	/**
	 * Aborted when a newer search replaces this request (or the list is no longer wanted). Pass it
	 * to `fetch` to cancel the network call; results of an aborted request are ignored either way.
	 */
	signal: AbortSignal;
};

/** The options, or a function that returns the options for the current search text. */
export type ComboboxItemsSource =
	| ComboboxItems
	| ((
			searchValue: string | undefined,
			request: ComboboxItemsRequest
	  ) => MaybePromise<ComboboxItems>);

/** Decides whether an option matches the search text. */
export type ComboboxFilter = (option: ComboboxOption, searchValue: string) => boolean;

export type ComboboxValueChangePayload = {
	value: string | null;
	option: ComboboxOption | null;
};

/** Why the highlighted option changed: the keyboard, the pointer, or the list changing underneath it. */
export type ComboboxHighlightReason = HighlightReason;

export type ComboboxHighlightChangePayload = {
	/** The highlighted option's value, or `undefined` when nothing is highlighted. */
	value: string | undefined;
	/** `'keyboard'` for keys, `'pointer'` for hover, `'list'` when results changed or the list opened. */
	reason: ComboboxHighlightReason;
	/** The keyboard or pointer event behind the change; absent for `'list'`. */
	event?: Event;
};

/**
 * Props shared by Combobox and TagsInput: the searchable list behind them. Both read the same
 * options, open state and highlight model.
 */
export type ComboboxListProps = {
	/** Bindable text currently typed in the search input. */
	searchValue?: string;
	/** Bindable flag indicating async options are being fetched. */
	loading?: boolean;
	/**
	 * Whether the options list is open. Bindable. The list only shows while there is something to
	 * show (options, a loading or error message, or a "no options" message for the typed text).
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
	 * Open the list when the input receives focus, even before anything is typed: static arrays
	 * list every option, `items` functions are called with an empty search.
	 * @default false
	 */
	openOnFocus?: boolean;
	/** @deprecated Use `openOnFocus`. Kept as an alias for one minor. */
	showAllOnFocus?: boolean;
	/**
	 * Static array, or a function returning the options for the current search text. The function
	 * receives `{ signal }` as its second argument: it is aborted when a newer search replaces the
	 * request, and a response that is not the latest is ignored.
	 */
	items?: ComboboxItemsSource;
	/**
	 * Decides whether an option matches the typed text, for static arrays. Defaults to a case- and
	 * accent-insensitive substring match on the label, compared in the active I18n locale
	 * ("eclair" finds "Éclair"). Functions passed as `items` filter themselves.
	 */
	filter?: ComboboxFilter;
	/** Shows at most this many matching options. Matching stops once the limit is reached. */
	limit?: number;
	/**
	 * Which option is highlighted without keyboard input. `'always'` (default for Combobox) keeps
	 * the first match, or the selected option while the text is empty, highlighted; `true` does so
	 * only while text is typed; `false` highlights nothing until an arrow key or the pointer moves
	 * it, so Enter acts on the typed text.
	 */
	autoHighlight?: boolean | 'always';
	/**
	 * What moving past either end of the list does: `'wrap'` continues at the other end (default),
	 * `'input'` lands on no highlight first (focus stays in the input) and wraps from there, and
	 * `false` stops at the end.
	 * @default 'wrap'
	 */
	loop?: ListLoop;
	/** Called when the highlighted option changes, with the value, why it moved and the event behind it. */
	onHighlightChange?: (payload: ComboboxHighlightChangePayload) => void;
	/** Render a separator between consecutive groups. @default true */
	separators?: boolean;
	/** Custom row renderer: receives the option. Overrides the default title and description layout. */
	item?: Snippet<[ComboboxOption]>;
	/**
	 * Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height).
	 * @default 'normal'
	 */
	density?: Density;
	/**
	 * Function to get the label for a value when the option is not yet loaded.
	 * Useful for async options where the default value might not be in the initial options list.
	 */
	getValueOption?: (value: string) => MaybePromise<ComboboxOption | null | undefined>;
	/** Text to display when loading options. Defaults to "Loading...". */
	loadingText?: string;
	/** Text to display when no options are found or available. Defaults to "No options found". */
	noOptionsText?: string;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
};

export type ComboboxProps = Omit<InputProps<'combobox'>, 'prefix' | 'onValueChange' | 'density'> &
	ComboboxListProps & {
		/** Static array, or a function returning the options for the current search text. */
		items: ComboboxItemsSource;
		/** Called when the selection changes with its value and resolved option context. */
		onValueChange?: (payload: ComboboxValueChangePayload) => void;
		/** Hint text shown in the search input when no option is selected. */
		placeholder?: string;
		/**
		 * Prefix content. Set to `false` to hide the default magnifying glass icon.
		 * If not provided, the magnifying glass icon is shown by default.
		 */
		prefix?: Snippet | false;
		/** Theme overrides for the combobox dropdown, options, and field parts. */
		theme?: ComboboxThemeProps & InputProps<'combobox'>['theme'];
	};
