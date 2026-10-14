import type { FieldButtonAttributes, InputProps } from '../Field/field.js';
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
	/**
	 * Native attributes for the switch control, such as `aria-label`, `title` or `data-*`. An
	 * `aria-label` names the switch instead of its label.
	 */
	inputAttrs?: FieldButtonAttributes;
	/** Theme overrides for the switch toggle, thumb, input container, and field parts. */
	theme?: SwitchThemeProps & InputProps<'switch'>['theme'];
};
