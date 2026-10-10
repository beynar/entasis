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
	/**
	 * Transforms pasted text before it is inserted. A result at least `length` characters long
	 * replaces the whole code, wherever the caret is.
	 */
	pasteTransformer?: (text: string) => string;
	/** Called when the value changes. */
	onValueChange?: (value: string) => void;
	/**
	 * Called when the value becomes complete. A paste or autofill that leaves the code complete
	 * calls it again, even when the code was already complete or unchanged; typing over one cell
	 * of a complete code does not.
	 */
	onComplete?: (value: string) => void;
	/** Whether displayed characters should be visually masked. */
	mask?: boolean;
	/** Theme overrides for the pin input cells and field container. */
	theme?: PinInputThemeProps & InputProps<'pin'>['theme'];
};
