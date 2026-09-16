import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors } from '$lib/types/theme.js';
import type { ChipProps, ChipThemeProps } from '../../Chip/index.js';
import type { FieldProps, InputProps } from '../Field/field.js';
import type { TagGroupThemeProps } from './tagGroup.theme.js';

export type TagGroupValue = string | string[] | null;

export type TagGroupOption = {
	/** Unique value used for selection and form submission. */
	value: string;
	/** Visible chip label; falls back to value when omitted. */
	label?: Slot;
	/** Optional icon rendered before the chip label. */
	icon?: Slot;
	/** Prevents selecting this option while keeping it visible. */
	disabled?: boolean;
	/** Per-option color override for the rendered chip. */
	color?: Colors;
	/** Per-option variant override for the rendered chip. */
	variant?: ChipProps['variant'];
};

type TagGroupFieldProps = Omit<
	InputProps<'tag-group'>,
	'value' | 'defaultValue' | 'onValueChange' | 'onValidate' | 'theme'
> & {
	/** Selected value. Single mode writes string|null; multiple mode writes string[]. Bindable. */
	value?: TagGroupValue;
	/** Initial selected value when `value` is omitted. */
	defaultValue?: TagGroupValue;
	/** Called when selection changes with the normalized value shape. */
	onValueChange?: (value: TagGroupValue) => void;
	/** Validates the normalized selected value. */
	onValidate?: (value: TagGroupValue) => string[] | boolean;
	/** Theme overrides for the tag group and field parts. */
	theme?: TagGroupThemeProps & InputProps<'tag-group'>['theme'];
};

export type TagGroupProps<Option extends TagGroupOption = TagGroupOption> = WithAttachments<
	TagGroupFieldProps & {
		/** Options rendered as selectable chips. */
		items: Option[];
		/** When true, allows selecting more than one tag and writes string[]. */
		multiple?: boolean;
		/** Color used for selected chips. */
		color?: Colors;
		/** Color used for unselected chips. */
		unselectedColor?: Colors;
		/** Chip variant used for selected chips. */
		selectedVariant?: ChipProps['variant'];
		/** Chip variant used for unselected chips. */
		unselectedVariant?: ChipProps['variant'];
		/** Theme overrides forwarded to each inner Chip. */
		chipTheme?: ChipThemeProps;
	} & Partial<Omit<FieldProps<'tag-group'>, 'children' | 'type'>>
>;
