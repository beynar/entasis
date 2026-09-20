import type { MapProps as BaseMapProps } from './map-types.js';
import type { MapThemeProps } from './map.theme.js';
import type { Sizes } from '$lib/types/theme.js';

// Re-export the full public type surface (marker/shape/snippet-arg types, control
// actions, etc.) so consumers import everything from the component entry point.
export type * from './map-types.js';
export type { MapMarker } from './map-data.js';

/**
 * Props for the `Map` component. Extends the base MapLibre props with entasis's
 * `size` viewport variant and the per-instance `theme` override.
 */
export type MapProps<TData = unknown> = BaseMapProps<TData> & {
	/**
	 * Viewport size variant controlling the map height.
	 * @default 'normal'
	 */
	size?: Sizes;
	/**
	 * Per-instance theme overrides for the map root container.
	 */
	theme?: MapThemeProps;
};
