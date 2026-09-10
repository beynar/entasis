import type { Slot } from '../../Slot/slot.js';
import type { InputProps } from '../Field/field.js';

export type RadioOption = {
	/** Display text for the option, rendered inside the option button. */
	label?: string;
	/** Unique value submitted when this option is selected. */
	value: string;
	/** Optional icon snippet shown before the option label. */
	icon?: Slot;
	/** Supporting text rendered below the option label. */
	description?: string;
	/** Prevents selecting this individual option. */
	disabled?: boolean;
};
export type RadioInputProps<T extends RadioOption = RadioOption> = InputProps<'radio'> & {
	/** Visual layout style for the radio group (`normal` or `card`). */
	mode?: 'card' | 'normal';
	/** Items to render as radio choices. */
	items: T[];
};
