import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The map viewport container. The MapLibre canvas, skeleton, controls and markers
// live inside it. The cartographic colours themselves are driven by the tokenized
// style (see map-token-style.ts), not by these classes.
const defaultMapRoot = cva({
	base: 'relative w-full overflow-hidden rounded-lg border border-neutral-muted bg-neutral-muted',
	variants: {
		size: {
			small: 'h-[240px] min-h-[200px]',
			normal: 'h-[360px] min-h-[280px]',
			large: 'h-[520px] min-h-[360px]'
		},
		interactive: {
			true: '',
			false: '[&_.maplibregl-canvas]:!cursor-default'
		}
	},
	defaultVariants: {
		size: 'normal',
		interactive: true
	}
});

export const mapTheme = {
	root: defaultMapRoot
};

export type MapTheme = typeof mapTheme;
export type MapThemeProps = InferComponentTheme<MapTheme>;
export const setMapTheme = setComponentTheme<MapTheme>('map');
export const useMapTheme = useComponentTheme('map', mapTheme);
