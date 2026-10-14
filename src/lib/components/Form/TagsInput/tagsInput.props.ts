import type { InputProps } from '../Field/field.js';
import type { ComboboxListProps } from '../Combobox/combobox.props.js';
import type { TagsInputThemeProps } from './tagsInput.theme.js';

export type TagsInputProps = Omit<InputProps<'tag'>, 'onValueChange' | 'density'> &
	ComboboxListProps & {
		/** Called when the tags change, with the new array of tag values. */
		onValueChange?: (value: string[]) => void;
		/** Hint text shown in the input when no tag is being typed. */
		placeholder?: string;
		/** When items is provided, also allow Enter to add free text that is not in the option list. */
		customTags?: boolean;
		/** Maximum number of tags allowed; further adds are ignored once reached. */
		maxTags?: number;
		/**
		 * Keep the typed text after an option is chosen, so several matches of the same search can be
		 * added in a row. Free text added with Enter always clears it.
		 * @default false
		 */
		keepSearchOnSelect?: boolean;
		/** Theme overrides for the tags input container, tags, dropdown, and field parts. */
		theme?: TagsInputThemeProps & InputProps<'tag'>['theme'];
	};
