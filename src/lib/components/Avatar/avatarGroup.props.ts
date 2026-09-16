import type { Snippet } from 'svelte';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { AvatarThemeProps } from './avatar.theme.js';
import type { AvatarGroupThemeProps } from './avatarGroup.theme.js';
import type { AvatarItem, AvatarProps } from './avatar.props.js';

type AvatarGroupItem<I extends object> = AvatarItem & I;
type AvatarGroupAvatarProps = Omit<AvatarProps, keyof AvatarItem | 'class' | 'theme'>;

export type AvatarGroupProps<I extends object> = WithoutAttachments<AvatarGroupAvatarProps> &
	WithAttachments<{
		/**
		 * The class name of the avatar group. First element that the component outputs in the DOM.
		 */
		class?: string;
		/**
		 * Maximum number of avatars to display before showing a remaining count.
		 * By default, all items are displayed.
		 */
		max?: number;
		/** Custom snippet to render each avatar instead of the default Avatar component. */
		avatar?: Snippet<
			[{ item: AvatarGroupItem<I>; index: number; avatarProps: AvatarGroupAvatarProps }]
		>;
		/** Custom snippet to render the overflow count when items exceed max. */
		remainingCount?: Snippet<[{ items: AvatarGroupItem<I>[]; remaining: number }]>;
		/** Items displayed in the group; each carries the `src`, `alt`, and `name` of one avatar. */
		items: AvatarGroupItem<I>[];
		/** Theme overrides for both the group and its default avatars. */
		theme?: AvatarGroupThemeProps & AvatarThemeProps;
	}>;
