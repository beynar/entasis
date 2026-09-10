import type { InputProps } from '../Field/field.js';
import type { CheckboxMode } from '../CheckboxesInput/checkboxesInput.props.js';
import type { CheckboxesInputThemeProps } from '../CheckboxesInput/checkboxesInput.theme.js';

export type CheckboxProps = InputProps<'checkbox'> & {
	/** Display mode: normal row, card row, or compact standalone control. */
	mode?: CheckboxMode | 'control';
	/** Shows a mixed state without changing the boolean field value. */
	indeterminate?: boolean;
	/** Accessible name for compact controls without a visible label. */
	ariaLabel?: string;
	/** Theme overrides for the checkbox row and field parts. */
	theme?: CheckboxesInputThemeProps & InputProps<'checkbox'>['theme'];
};
