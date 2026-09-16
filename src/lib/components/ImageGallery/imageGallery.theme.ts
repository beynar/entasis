import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultImageGalleryRoot = cva({
	base: 'contents [&_[data-image-gallery-image]]:cursor-zoom-in'
});

const defaultImageGalleryCaption = cva({
	base: 'text-neutral bg-surface-floating/90 fixed bottom-20 left-1/2 z-[1100] max-w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full px-xl py-md text-center text-sm lift-1 backdrop-blur-md'
});

// The lightbox is animated by LightGallery, which takes a duration plus a CSS easing
// — so this preset exists for its `duration` / `easing` tokens (the fly/scale params
// are unused). Reduced motion collapses the duration to 0.
export const defaultImageGalleryMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'normal',
		easing: 'enter'
	}
});

export const imageGalleryTheme = {
	motion: defaultImageGalleryMotion,
	root: defaultImageGalleryRoot,
	caption: defaultImageGalleryCaption
};

export type ImageGalleryTheme = typeof imageGalleryTheme;
export type ImageGalleryThemeProps = InferComponentTheme<ImageGalleryTheme>;
export const setImageGalleryTheme = setComponentTheme<ImageGalleryTheme>('image-gallery');
export const useImageGalleryTheme = useComponentTheme<ImageGalleryTheme>(
	'image-gallery',
	imageGalleryTheme
);
export const useImageGalleryMotion = () =>
	useComponentMotion('image-gallery', defaultImageGalleryMotion);
