import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultAvatar = cva({
	base: 'relative items-center border border-neutral-muted text-neutral aspect-ratio-1 rounded-full',
	variants: {
		size: {
			normal: 'size-8',
			small: 'size-6',
			large: 'size-10'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAvatarImage = cva({
	base: 'rounded-full absolute top-0 left-0 z-0 object-cover w-full max-w-full h-full max-h-full',
	variants: {
		size: {
			normal: '',
			small: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAvatarPrefix = cva({
	base: 'absolute bottom-[-0.25rem] rounded-full border border-neutral-muted p-[0.25rem] bg-surface size-4 left-[-0.25rem] aspect-square',
	variants: {
		size: {
			normal: 'size-4 right-[-0.3rem] bottom-[-0.2rem]',
			small: 'size-5 right-[-0.25rem] bottom-[-0.25rem]',
			large: 'size-5 left-[-0.4rem] bottom-[-0.4rem]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAvatarSuffix = cva({
	base: 'absolute  rounded-full border border-neutral-muted p-[0.25rem] bg-surface aspect-square',
	variants: {
		size: {
			normal: 'size-4 right-[-0.3rem] bottom-[-0.3rem]',
			small: 'size-3.5 left-[-0.25rem] bottom-[-0.25rem]',
			large: 'size-3.5 right-[-0.4rem] bottom-[-0.4rem]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Small initials sit on the type scale's smallest step, so they tighten their tracking instead:
// two bold capitals then fill the 24px circle in the same proportion the larger sizes do.
const defaultAvatarInitials = cva({
	base: 'absolute bg-surface-floating bottom-0 w-full h-full text-center left-0 rounded-full flex items-center justify-center uppercase font-bold text-sm',
	variants: {
		size: {
			normal: 'text-sm',
			small: 'text-xs tracking-tight',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const avatarTheme = {
	root: defaultAvatar,
	avatarImage: defaultAvatarImage,
	avatarPrefix: defaultAvatarPrefix,
	avatarSuffix: defaultAvatarSuffix,
	avatarInitials: defaultAvatarInitials
};

export type AvatarTheme = typeof avatarTheme;
export type AvatarThemeProps = InferComponentTheme<AvatarTheme>;
export const setAvatarTheme = setComponentTheme<AvatarTheme>('avatar');
export const useAvatarTheme = useComponentTheme<AvatarTheme>('avatar', avatarTheme);
