import type { HTMLInputAttributes } from 'svelte/elements';
import type { InputProps } from '../Field/field.js';
import type { NumberInputThemeProps } from './numberInput.theme.js';

/**
 * What ended an edit of a NumberInput: `blur` and `keyboard` (Enter) commit typed text, a
 * `keyboard` arrow, Page or Home/End key and a `wheel` notch each commit one step, and `step`
 * is the release of a stepper button (or a keyboard click on one).
 */
export type NumberInputCommitReason = 'blur' | 'keyboard' | 'step' | 'wheel';

/** Details `onValueCommit` receives. */
export type NumberInputCommitDetail = {
	/** The committed value, after Intl rounding; `null` when the field is empty. */
	value: number | null;
	/** What ended the edit. */
	reason: NumberInputCommitReason;
};

/** Native attributes of the text input; the component keeps its role, value and handlers. */
export type NumberInputInputAttributes = Omit<
	HTMLInputAttributes,
	| 'class'
	| 'disabled'
	| 'form'
	| 'id'
	| 'max'
	| 'min'
	| 'name'
	| 'placeholder'
	| 'readonly'
	| 'required'
	| 'role'
	| 'step'
	| 'type'
	| 'value'
>;

export type NumberInputProps = InputProps<'number'> & {
	/** Hint text shown in the empty number input. */
	placeholder?: string;
	/** Minimum allowed value; stepping stops there, and a typed lower value reports a range error. */
	min?: number;
	/** Maximum allowed value; stepping stops there, and a typed higher value reports a range error. */
	max?: number;
	/** Size of one step by the arrow keys, the +/- buttons and the wheel. Defaults to 1. */
	step?: number;
	/** Alias of `step` that wins when both are set. */
	increment?: number;
	/**
	 * Step of Shift+Arrow, PageUp and PageDown. Defaults to ten times the step.
	 */
	largeStep?: number;
	/**
	 * Step of Alt+Arrow. Defaults to a tenth of the step.
	 */
	smallStep?: number;
	/**
	 * Snaps the value to the step grid (counted from `min`, else 0) when stepping, before it is
	 * clamped, so a value of 7 with a step of 5 moves to 10. Without it a step adds or subtracts
	 * the step from the current value.
	 * @default false
	 */
	snapOnStep?: boolean;
	/**
	 * Steps the value with the mouse wheel while the input is focused and hovered: a vertical
	 * scroll, or a horizontal one with Shift. The wheel never changes the value otherwise.
	 * @default false
	 */
	wheelStep?: boolean;
	/** Whether to render the decrement and increment buttons. */
	showControls?: boolean;
	/**
	 * `Intl.NumberFormat` options for the displayed text and for parsing what is typed: currency,
	 * percent and unit styles, fraction digits, grouping. The input shows the value formatted this
	 * way when it loses focus. Without a rounding option the value keeps its full precision;
	 * with one (`maximumFractionDigits`, `maximumSignificantDigits`...), the value is rounded
	 * the way the text is when it is committed.
	 */
	format?: Intl.NumberFormatOptions;
	/**
	 * BCP 47 locale of the displayed and parsed text (`fr`, `ar-EG`, `pt-BR`). Defaults to the
	 * locale of the i18n catalog. Digits of other numeral systems are read in any locale.
	 */
	locale?: string;
	/**
	 * Called when an edit ends: text committed on blur or Enter, each keyboard or wheel step, and
	 * the release of a stepper button (one call for a whole press-and-hold).
	 */
	onValueCommit?: (detail: NumberInputCommitDetail) => void;
	/**
	 * Native attributes for the text input: `autocomplete`, `aria-label`, `aria-roledescription`,
	 * `inputmode`, data attributes and event handlers, which run before the built-in ones.
	 */
	inputAttrs?: NumberInputInputAttributes;
	/** Theme overrides for the number input element and its field container. */
	theme?: NumberInputThemeProps & InputProps<'number'>['theme'];
};
