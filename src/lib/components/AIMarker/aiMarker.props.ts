import type { Sizes } from '$lib/types/theme.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIMarkerThemeProps } from './aiMarker.theme.js';

export type AIMarkerVariant = 'default' | 'separator' | 'border';

export type AIMarkerProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'content'> & {
		/** Bindable reference to the marker root. */
		ref?: HTMLDivElement | null;
		/** Type and icon scale: `small`, `normal` (default) or `large`, matching AIMessage sizes. AIThread passes its `messageSize`. */
		size?: Sizes;
		/** Marker layout and separator treatment. */
		variant?: AIMarkerVariant;
		/** Fallback marker label used when `content` is omitted. */
		children?: Slot;
		/** Icon rendered beside marker content. */
		icon?: Slot;
		/** Marker label or rich inline content. */
		content?: Slot;
		/** Class applied to the marker root. */
		class?: string;
		/** Theme overrides for marker layout and separators. */
		theme?: AIMarkerThemeProps;
	}
>;
