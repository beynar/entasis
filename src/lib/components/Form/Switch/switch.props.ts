import type { InputProps } from '../Field/field.js';
import type { SwitchThemeProps } from './switch.theme.js';

export type SwitchProps = InputProps<'switch'> & {
	/** Theme overrides for the switch toggle, thumb, input container, and field parts. */
	theme?: SwitchThemeProps & InputProps<'switch'>['theme'];
};
