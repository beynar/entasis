import type { Density } from '$lib/types/theme.js';
import type { InputProps } from '../Field/field.js';
import type { ComboboxThemeProps } from './combobox.theme.js';
import type { Snippet } from 'svelte';

export type MaybePromise<T> = T | Promise<T>;

export type ComboboxOption = {
	/** Unique value submitted when this option is selected. */
	value: string;
	/** Display text shown in the option list and search input when selected. */
	label: string;
	/** Supporting text rendered below the option label in the dropdown. */
	description?: string;
	/** Optional arbitrary metadata attached to the option. */
	data?: Record<string, unknown>;
};

export type ComboboxValueChangePayload = {
	value: string | null;
	option: ComboboxOption | null;
};

export type ComboboxProps = Omit<InputProps<'combobox'>, 'prefix' | 'onValueChange'> & {
	/** Called when the selection changes with its value and resolved option context. */
	onValueChange?: (payload: ComboboxValueChangePayload) => void;
	/** Bindable text currently typed in the search input. */
	searchValue?: string;
	/** Bindable flag indicating async options are being fetched. */
	loading?: boolean;
	/** Hint text shown in the search input when no option is selected. */
	placeholder?: string;
	/** Static array or function returning items filtered by the current search value. */
	items: ComboboxOption[] | ((searchValue?: string) => MaybePromise<ComboboxOption[]>);
	/**
	 * Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height).
	 * @default 'normal'
	 */
	density?: Density;
	/** When true, shows all options on focus without a search query (static arrays only). */
	showAllOnFocus?: boolean;
	/**
	 * Function to get the label for a value when the option is not yet loaded.
	 * Useful for async options where the default value might not be in the initial options list.
	 */
	getValueOption?: (value: string) => MaybePromise<ComboboxOption | null | undefined>;
	/**
	 * Prefix content. Set to `false` to hide the default magnifying glass icon.
	 * If not provided, the magnifying glass icon is shown by default.
	 */
	prefix?: Snippet | false;
	/**
	 * Text to display when loading options. Defaults to "Loading...".
	 */
	loadingText?: string;
	/**
	 * Text to display when no options are found or available. Defaults to "No options found".
	 */
	noOptionsText?: string;
	/** Theme overrides for the combobox dropdown, options, and field parts. */
	theme?: ComboboxThemeProps & InputProps<'combobox'>['theme'];
};
