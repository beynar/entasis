import type { Sizes } from '../../types/index.js';
import type { Slot } from '../Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AvatarThemeProps } from './avatar.theme.js';

/** The data an avatar needs: an optional image plus the name its initials fall back to. */
export type AvatarItem = {
	/** Image URL. When omitted, or when the image fails, the initials render instead. */
	src?: string;
	/** Alternative text for the image. Defaults to `name`. */
	alt?: string;
	/** Display name; its initials are the fallback when no image renders. */
	name: string;
};

export type AvatarProps = WithAttachments<
	AvatarItem & {
		/**
		 * The size of the avatar.
		 * @default 'normal'
		 */
		size?: Sizes;
		/**
		 * The delay in milliseconds before a loaded image is revealed.
		 * @default 0
		 */
		delay?: number;
		/**
		 * Whether the image is still loading. Bindable, so a parent can show its own
		 * placeholder. It is `false` when no `src` is set, and `false` once the image has
		 * loaded or failed — a failed image is reported by rendering the initials.
		 * @default false
		 */
		loading?: boolean;
		/**
		 * The class name of the avatar. First element that the component outputs in the DOM.
		 */
		class?: string;
		/** Slot overlay positioned at the bottom-left corner of the avatar. */
		prefix?: Slot;
		/** Slot overlay positioned at the bottom-right corner of the avatar. */
		suffix?: Slot;
		/** Theme overrides for avatar, image, prefix, suffix, and initials parts. */
		theme?: AvatarThemeProps;
	}
>;
