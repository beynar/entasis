import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultImageZoomRoot = cva({
	base: 'relative inline-block max-w-full'
});

const defaultImageZoomTrigger = cva({
	base: 'group/image-zoom relative m-0 block max-w-full cursor-zoom-in border-0 bg-transparent p-0 text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
});

const defaultImageZoomImage = cva({
	base: 'block h-auto max-w-full'
});

const defaultImageZoomIndicator = cva({
	base: 'bg-neutral/70 text-neutral-contrast pointer-events-none absolute inline-flex size-9 items-center justify-center rounded-full opacity-0 lift-1 transition-opacity group-hover/image-zoom:opacity-100 group-focus-visible/image-zoom:opacity-100 [&_svg]:size-icon-md',
	variants: {
		position: {
			'top-left': 'top-2 left-2',
			'top-right': 'top-2 right-2',
			'bottom-left': 'bottom-2 left-2',
			'bottom-right': 'right-2 bottom-2'
		}
	},
	defaultVariants: {
		position: 'top-right'
	}
});

const defaultImageZoomCaption = cva({
	base: 'text-neutral bg-surface-floating/85 fixed bottom-4 left-1/2 z-[1100] max-w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full px-xl py-md text-center text-sm lift-1 backdrop-blur-md'
});

// The lightbox is animated by LightGallery, which only takes a duration — so this
// preset exists for its `duration` token (the fly/scale params are unused). Retune it
// with `theme={{ motion: { duration: 250 } }}`; reduced motion collapses it to 0.
export const defaultImageZoomMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slower',
		easing: 'enter'
	}
});

export const imageZoomTheme = {
	motion: defaultImageZoomMotion,
	root: defaultImageZoomRoot,
	trigger: defaultImageZoomTrigger,
	image: defaultImageZoomImage,
	indicator: defaultImageZoomIndicator,
	caption: defaultImageZoomCaption
};

export type ImageZoomTheme = typeof imageZoomTheme;
export type ImageZoomThemeProps = InferComponentTheme<ImageZoomTheme>;
export const setImageZoomTheme = setComponentTheme<ImageZoomTheme>('image-zoom');
export const useImageZoomTheme = useComponentTheme<ImageZoomTheme>('image-zoom', imageZoomTheme);
export const useImageZoomMotion = () => useComponentMotion('image-zoom', defaultImageZoomMotion);
