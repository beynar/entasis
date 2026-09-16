import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultGlobe = cva({
	base: 'origin-center mx-auto block aspect-square size-[400px] max-w-full touch-none select-none transition-opacity duration-slower ease-enter',
	variants: {
		draggable: {
			true: 'cursor-grab',
			false: ''
		},
		// Fades the canvas in once the first frame has rendered.
		ready: {
			true: 'opacity-100',
			false: 'opacity-0'
		}
	},
	defaultVariants: {
		draggable: true,
		ready: false
	}
});

export const globeTheme = {
	root: defaultGlobe
};

export type GlobeTheme = typeof globeTheme;
export type GlobeThemeProps = InferComponentTheme<GlobeTheme>;
export const setGlobeTheme = setComponentTheme<GlobeTheme>('globe');
export const useGlobeTheme = useComponentTheme<GlobeTheme>('globe', globeTheme);
