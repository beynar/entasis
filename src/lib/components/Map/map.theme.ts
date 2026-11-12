import { getContext, setContext } from 'svelte';
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

// The surface around a marker's popup: a `popup` snippet that draws its own card can drop the
// padding and surface here, or set its width.
const defaultMapPopup = cva({
	base: 'bg-surface-floating text-neutral raised-3 z-50 w-72 rounded-md p-lg text-sm outline-none'
});

// The size and spacing of a marker's tooltip, on the Tooltip's own surface.
const defaultMapTooltip = cva({
	base: 'max-w-60 rounded-md px-md py-sm text-xs'
});

export const mapTheme = {
	root: defaultMapRoot,
	popup: defaultMapPopup,
	tooltip: defaultMapTooltip
};

export type MapTheme = typeof mapTheme;
export type MapThemeProps = InferComponentTheme<MapTheme>;
export const setMapTheme = setComponentTheme<MapTheme>('map');
export const useMapTheme = useComponentTheme('map', mapTheme);

const MAP_CLASSES = Symbol('map-classes');

/** Map shares its resolved classes (registry, setter and instance theme) with its markers. */
export const provideMapClasses = (classes: () => ReturnType<typeof useMapTheme>) =>
	setContext(MAP_CLASSES, classes);

/** The enclosing Map's classes; outside a Map, the theme without an instance override. */
export const useMapClasses = (): (() => ReturnType<typeof useMapTheme>) => {
	const classes = getContext<(() => ReturnType<typeof useMapTheme>) | undefined>(MAP_CLASSES);
	if (classes) return classes;
	const fallback = useMapTheme(undefined);
	return () => fallback;
};
