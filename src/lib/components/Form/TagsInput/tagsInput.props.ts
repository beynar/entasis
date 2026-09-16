import type { Density } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { InputProps } from '../Field/field.js';
import type { ComboboxOption, MaybePromise } from '../Combobox/combobox.props.js';
import type { TagsInputThemeProps } from './tagsInput.theme.js';

export type TagsInputProps = Omit<InputProps<'tag'>, 'onValueChange'> & {
	/** Called when the tags change, with the new array of tag values. */
	onValueChange?: (value: string[]) => void;
	/** Bindable text currently typed in the search input. */
	searchValue?: string;
	/** Bindable flag indicating async options are being fetched. */
	loading?: boolean;
	/** Hint text shown in the input when no tag is being typed. */
	placeholder?: string;
	/** Static array or function returning items filtered by the current search value. Omit for free-text entry. */
	items?: ComboboxOption[] | ((searchValue?: string) => MaybePromise<ComboboxOption[]>);
	/**
	 * Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height).
	 * @default 'normal'
	 */
	density?: Density;
	/** When items is provided, also allow Enter to add free text that is not in the option list. */
	customTags?: boolean;
	/** Maximum number of tags allowed; further adds are ignored once reached. */
	maxTags?: number;
	/** When true, shows all options on focus without a search query (static arrays only). */
	showAllOnFocus?: boolean;
	/**
	 * Function to resolve the option (and its label) for a value when the option is not yet loaded.
	 * Useful for async options where initial values might not be in the option list.
	 */
	getValueOption?: (value: string) => MaybePromise<ComboboxOption | null | undefined>;
	/** Text to display while loading options. Defaults to "Loading...". */
	loadingText?: string;
	/** Text to display when no options are found or available. Defaults to "No options found". */
	noOptionsText?: string;
	/** Theme overrides for the tags input container, tags, dropdown, and field parts. */
	theme?: TagsInputThemeProps & InputProps<'tag'>['theme'];
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
};
