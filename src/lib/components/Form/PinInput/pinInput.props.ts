import type { InputProps } from '../Field/field.js';
import type { PinInputThemeProps } from './pinInput.theme.js';
import type { PinInputPattern, PinInputRejectDetail } from './pinInput.state.svelte.js';
import type { HTMLInputAttributes } from 'svelte/elements';

export type PinInputProps = Omit<InputProps<'pin'>, 'onValueChange'> & {
	/** Number of visible cells. */
	length?: number;
	/**
	 * Partial-value pattern the code must match after normalization. Text that fails it is
	 * refused whole, and reported to `onRejectInput`.
	 */
	pattern?: PinInputPattern;
	/** Input mode forwarded to the real input for mobile keyboards. */
	inputMode?: HTMLInputAttributes['inputmode'];
	/** Autocomplete hint forwarded to the real input. */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/**
	 * Transforms pasted text before the shared normalization runs (a paste-only first step). A
	 * result at least `length` characters long replaces the whole code, wherever the caret is.
	 */
	pasteTransformer?: (text: string) => string;
	/**
	 * Final step of the normalization every typed, pasted, autofilled, composed and controlled
	 * code goes through, after whitespace and separators are removed and digits of other numeral
	 * systems become ASCII. Use it to fold case: `(text) => text.toUpperCase()`. It should give
	 * the same result when run again on its own output.
	 */
	normalizeValue?: (text: string) => string;
	/**
	 * Called when the pattern refuses text, with the text as it arrived and where it came from.
	 */
	onRejectInput?: (detail: PinInputRejectDetail) => void;
	/** Called when the value changes. */
	onValueChange?: (value: string) => void;
	/**
	 * Called when the value becomes complete. A paste or autofill that leaves the code complete
	 * calls it again, even when the code was already complete or unchanged; typing over one cell
	 * of a complete code does not.
	 */
	onComplete?: (value: string) => void;
	/**
	 * Submits the owning form when the user types, pastes or autofills a complete code: through
	 * the surrounding Form (which validates first and focuses an earlier invalid field), else the
	 * native form with `requestSubmit()`. A code set by the parent, and a read-only or disabled
	 * input, never submit.
	 * @default false
	 */
	submitOnComplete?: boolean;
	/**
	 * Splits the cells into groups with a separator between them: `[3, 3]` for a code written
	 * 123-456. The separator is decorative and hidden from assistive technology.
	 */
	groups?: number[];
	/** Whether displayed characters should be visually masked. */
	mask?: boolean;
	/** Theme overrides for the pin input cells and field container. */
	theme?: PinInputThemeProps & InputProps<'pin'>['theme'];
};
