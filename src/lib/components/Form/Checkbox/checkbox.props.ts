import type { InputProps } from '../Field/field.js';
import type { CheckboxMode } from '../CheckboxesInput/checkboxesInput.props.js';
import type { CheckboxesInputThemeProps } from '../CheckboxesInput/checkboxesInput.theme.js';

export type CheckboxProps = InputProps<'checkbox'> & {
	/**
	 * Display mode: normal row, card row, or compact standalone control. `'control'` paints no
	 * label, so a string `label` becomes the control's `aria-label` instead of visible text.
	 */
	mode?: CheckboxMode | 'control';
	/** Shows a mixed state without changing the boolean field value. */
	indeterminate?: boolean;
	/** Theme overrides for the checkbox row and field parts. */
	theme?: CheckboxesInputThemeProps & InputProps<'checkbox'>['theme'];
};
