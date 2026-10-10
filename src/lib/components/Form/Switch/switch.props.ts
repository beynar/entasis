import type { InputProps } from '../Field/field.js';
import type { SwitchThemeProps } from './switch.theme.js';

export type SwitchProps = InputProps<'switch'> & {
	/** A required switch is valid only while it is on, in a Form and in a native `<form>`. */
	required?: boolean;
	/**
	 * Value submitted with the switch's `name` by a native `<form>` while the switch is on; an
	 * off switch, or one without a `name`, submits nothing, like a native checkbox. Defaults to
	 * `'true'`.
	 */
	inputValue?: string;
	/** Theme overrides for the switch toggle, thumb, input container, and field parts. */
	theme?: SwitchThemeProps & InputProps<'switch'>['theme'];
};
