import type { InputProps } from '../Field/field.js';
import type { PinInputThemeProps } from './pinInput.theme.js';
import type { PinInputPattern } from './pinInput.state.svelte.js';
import type { HTMLInputAttributes } from 'svelte/elements';

export type PinInputProps = Omit<InputProps<'pin'>, 'onValueChange'> & {
	/** Number of visible cells. */
	length?: number;
	/** Partial-value pattern used to accept typed and pasted input. */
	pattern?: PinInputPattern;
	/** Input mode forwarded to the real input for mobile keyboards. */
	inputMode?: HTMLInputAttributes['inputmode'];
	/** Autocomplete hint forwarded to the real input. */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/** Transforms pasted text before it is inserted. */
	pasteTransformer?: (text: string) => string;
	/** Called when the value changes. */
	onValueChange?: (value: string) => void;
	/** Called once when the input reaches the configured length. */
	onComplete?: (value: string) => void;
	/** Whether displayed characters should be visually masked. */
	mask?: boolean;
	/** Theme overrides for the pin input cells and field container. */
	theme?: PinInputThemeProps & InputProps<'pin'>['theme'];
};
