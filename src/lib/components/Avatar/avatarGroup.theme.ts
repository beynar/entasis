import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

// Each size overlaps its neighbour by about a fifth of an avatar (7.2/32, 4.8/24, 8/40px), so a
// stack reads the same at every size. Small used to overlap 0.4rem — over a quarter of its 24px —
// which slid each circle across the end of the previous avatar's two-letter initials.
const defaultAvatarGroup = cva({
	base: 'flex gap-[-0.25rem] items-center isolate ml-[0.3rem]',
	variants: {
		size: {
			normal: '[&>[data-avatar]]:ml-[-0.45rem]',
			small: '[&>[data-avatar]]:ml-[-0.3rem]',
			large: '[&>[data-avatar]]:ml-[-0.5rem]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAvatarGroupCount = cva({
	base: 'bg-surface-floating border-neutral-muted text-neutral text-center rounded-full flex items-center justify-center uppercase font-bold ml-[-0.75rem] z-[+1]',
	variants: {
		size: {
			normal: 'size-8 text-sm',
			small: 'size-6 text-xs',
			large: 'size-10 text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const avatarGroupTheme = {
	root: defaultAvatarGroup,
	avatarGroupCount: defaultAvatarGroupCount
};

export type AvatarGroupTheme = typeof avatarGroupTheme;
export type AvatarGroupThemeProps = InferComponentTheme<AvatarGroupTheme>;
export const setAvatarGroupTheme = setComponentTheme<AvatarGroupTheme>('avatar-group');
export const useAvatarGroupTheme = useComponentTheme<AvatarGroupTheme>(
	'avatarGroup',
	avatarGroupTheme
);
