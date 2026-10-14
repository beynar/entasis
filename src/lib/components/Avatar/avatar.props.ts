import type { Sizes } from '../../types/index.js';
import type { HTMLImgAttributes } from 'svelte/elements';
import type { Slot } from '../Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AvatarThemeProps } from './avatar.theme.js';

/** The data an avatar needs: an optional image plus the name its initials fall back to. */
export type AvatarItem = {
	/** Image URL. When omitted, or when the image fails, the initials render instead. */
	src?: string;
	/**
	 * Accessible name of the avatar, announced once for the whole avatar. Defaults to `name`.
	 * An empty string marks the avatar decorative and hides it from assistive technology.
	 */
	alt?: string;
	/** Display name; its initials are the fallback when no image renders. */
	name: string;
};

/** Native `<img>` attributes an avatar forwards to its image. */
export type AvatarImageAttributes = Pick<
	HTMLImgAttributes,
	'srcset' | 'sizes' | 'crossorigin' | 'referrerpolicy' | 'loading' | 'decoding' | 'fetchpriority'
>;

/** Where the image is in its lifecycle; mirrored on the root as `data-status`. */
export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type AvatarProps = WithAttachments<
	AvatarItem & {
		/**
		 * The size of the avatar.
		 * @default 'normal'
		 */
		size?: Sizes;
		/**
		 * Native attributes forwarded to the `<img>`: `srcset`, `sizes`, `crossorigin`,
		 * `referrerpolicy`, `loading`, `decoding` and `fetchpriority`. With `loading: 'lazy'` the
		 * initials stay on screen until the browser has fetched and decoded the image.
		 */
		image?: AvatarImageAttributes;
		/**
		 * The delay in milliseconds before the initials render while the image is still loading.
		 * Until it elapses the surface stays empty, so an image that arrives quickly never flashes
		 * the fallback. A failed image, or an avatar without `src`, shows the initials immediately.
		 * @default 0
		 */
		fallbackDelay?: number;
		/**
		 * The delay in milliseconds before a loaded image is revealed.
		 * @default 0
		 */
		revealDelay?: number;
		/**
		 * @deprecated Use `revealDelay`. It still delays revealing a loaded image; it never
		 * delays the initials (that is `fallbackDelay`).
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
