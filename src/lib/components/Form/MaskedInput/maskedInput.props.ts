import type { HTMLInputAttributes } from 'svelte/elements';
import type { InputProps } from '../Field/field.js';
import type {
	MaskedInputMask,
	MaskedInputTokens,
	MaskedInputValueDetails
} from './maskedInput.mask.js';
import type { MaskedInputShowMask } from './maskedInput.maskito.js';
import type { MaskedInputThemeProps } from './maskedInput.theme.js';

/** Which text the value holds: the typed characters only, or the text as shown. */
export type MaskedInputValueFormat = 'raw' | 'masked';

export type MaskedInputAttributes = Omit<
	HTMLInputAttributes,
	| 'class'
	| 'disabled'
	| 'form'
	| 'id'
	| 'name'
	| 'placeholder'
	| 'readonly'
	| 'required'
	| 'type'
	| 'value'
>;

export type MaskedInputProps = Omit<InputProps<'masked'>, 'onValueChange'> & {
	/**
	 * The format the text follows. In a pattern, `#` is a digit, `A` a letter (kept in the case
	 * typed) and `*` a letter or a digit; `?` after a token makes it optional and `+` lets it
	 * repeat; `\` makes the next character literal; any other character is a separator the mask
	 * writes. A list of patterns uses the first one the text fits; a function receives the
	 * characters typed so far and returns the pattern.
	 */
	mask: MaskedInputMask;
	/**
	 * Slot characters added to, or replacing, `#`, `A` and `*`: a one-character name, the
	 * `pattern` one accepted character matches, and an optional `transform` (`'upper'`,
	 * `'lower'` or a function) applied to a typed character first.
	 */
	tokens?: MaskedInputTokens;
	/** The character shown in an empty slot when the mask shows. Defaults to `_`. */
	placeholderChar?: string;
	/**
	 * When the empty slots and separators show in the input: `'always'`, while it has focus
	 * (`'focus'`), or `'never'` (the default; the empty input then shows the format as its
	 * placeholder).
	 */
	showMask?: MaskedInputShowMask;
	/**
	 * What `value` holds: `'raw'` (the default) keeps only the characters typed into slots,
	 * `'masked'` the text as shown, separators included. A value set from outside may be either;
	 * it is read through the mask and stored in this format.
	 */
	valueFormat?: MaskedInputValueFormat;
	/**
	 * Called when the user changes the value, with the value in `valueFormat`. A value set from
	 * outside does not call it.
	 */
	onValueChange?: (value: string | null) => void;
	/**
	 * Called with `onValueChange`, with the same change described: the `masked` text, the `raw`
	 * characters and whether the mask is `complete`.
	 */
	onMaskedChange?: (details: MaskedInputValueDetails) => void;
	/** Hint shown in the empty input. Defaults to the format with empty slots, such as `__-___-__`. */
	placeholder?: string;
	/**
	 * Virtual keyboard hint. Defaults to `numeric` when every slot takes a digit, `text`
	 * otherwise.
	 */
	inputMode?: HTMLInputAttributes['inputmode'];
	/** Autofill token passed to the input, such as `tel-national` or `postal-code`. */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/** Native attributes applied to the underlying input control. */
	inputAttrs?: MaskedInputAttributes;
	/** Theme overrides for the input element and its field container. */
	theme?: MaskedInputThemeProps & InputProps<'masked'>['theme'];
};
