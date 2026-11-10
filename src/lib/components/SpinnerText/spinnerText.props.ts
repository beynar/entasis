import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { SpinnerVariant } from '$lib/components/Spinner/spinner.props.js';
import type { SpinnerTextThemeProps } from './spinnerText.theme.js';

export type SpinnerTextTransition = 'vertical' | 'reveal';

export type SpinnerTextSpinnerPayload = {
	color: Colors;
	size: Sizes;
	variant: SpinnerVariant;
};

type SpinnerTextBaseProps = {
	/** Bindable reference to the root status element. */
	ref?: HTMLElement | null;
	/** Classes applied to the root element. */
	class?: string;
	/** Messages displayed in sequence. */
	texts: readonly string[];
	/** Time in milliseconds before advancing to the next message. Non-positive values pause cycling. */
	delay?: number;
	/** Motion used when replacing the active message. */
	transition?: SpinnerTextTransition;
	/**
	 * Fits a row narrower than the message: the root takes the row's free width (`flex-1`, never
	 * wider than its container) and the message ends with an ellipsis instead of being clipped or
	 * widening the row. The status region still announces the full text.
	 * @default false
	 */
	truncate?: boolean;
	/** Applies the shimmer utility to the active message. */
	shimmer?: boolean;
	/** Whether to render the leading spinner. */
	showSpinner?: boolean;
	/** Visual animation for the leading spinner. Overrides the Theme default when provided. */
	spinnerVariant?: SpinnerVariant;
	/** Accessible fallback used when `texts` is empty. */
	label?: string;
	/** Visual size of the spinner and message. */
	size?: Sizes;
	/** Semantic color applied to the spinner and message. */
	color?: Colors;
	/** Theme overrides for the component's structural parts. */
	theme?: SpinnerTextThemeProps;
};

export type SpinnerTextProps = WithAttachments<
	WithSlot<SpinnerTextBaseProps, 'spinner', SpinnerTextSpinnerPayload>
>;
