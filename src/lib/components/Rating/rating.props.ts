import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Messages } from '$lib/i18n/en.js';
import type { RatingThemeProps } from './rating.theme.js';

/** Payload passed to the custom `star` snippet, once per rendered layer of each star. */
export type RatingStarPayload = {
	/** 1-based index of the star being rendered. */
	index: number;
	/** Filled fraction of this star: 0 empty, 0.5 half, 1 full (partial values supported). */
	fraction: number;
	/** Which layer is being rendered: the muted outline base or the colored fill overlay. */
	layer: 'base' | 'fill';
};

export type RatingProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'onclick' | 'onpointermove'> & {
		/**
		 * The displayed rating; fractions render as partially filled stars. Read-only
		 * display data: Rating never writes it, so it takes no `defaultValue` and is not
		 * bindable. Use `RatingInput` for an editable rating.
		 *
		 * @readonly-value Rating renders a score; RatingInput is the editable control.
		 */
		value?: number | null;
		/** Number of stars rendered, which is also the maximum value. */
		max?: number;
		/** Color of the filled stars; defaults to the gold star color `warning`. */
		color?: Colors;
		/** Size token controlling the star box dimensions and gap. */
		size?: Sizes;
		/** Reading direction override; in `rtl` stars order and fill from the right. */
		dir?: 'ltr' | 'rtl';
		/** Applies the disabled styling to the star row. */
		disabled?: boolean;
		/** Applies the interactive (pointer) styling to the stars. */
		interactive?: boolean;
		/** The class name of the star row. First element that the component outputs in the DOM. */
		class?: string;
		/** Custom star icon; rendered twice per star (once per `layer`). Defaults to the star icons. */
		star?: Snippet<[RatingStarPayload]>;
		/** Bindable reference to the root star-row element. */
		ref?: HTMLElement | null;
		/** Native pointer-move handler attached to each star. */
		onpointermove?: (event: PointerEvent & { currentTarget: HTMLSpanElement }) => void;
		/** Native click handler attached to each star. */
		onclick?: (event: MouseEvent & { currentTarget: HTMLSpanElement }) => void;
		/** Per-instance i18n overrides merged over the global catalog. */
		i18n?: Partial<Messages>;
		/** Theme overrides for the container, star, starBase and starFill parts. */
		theme?: RatingThemeProps;
	}
>;
