import type { MapMarker } from './map-data.js';
import type { MapBounds } from './map-types.js';
import type { MapLibreBounds, MapLibreFitBoundsOptions } from './maplibre-types.js';

const SINGLE_MARKER_BOUNDS_DELTA = 0.01;

export function normalizeMapBounds(bounds: MapBounds): MapLibreBounds {
	const normalizedBounds = isNestedMapBounds(bounds) ? [...bounds[0], ...bounds[1]] : bounds;
	const [west, south, east, north] = normalizedBounds;

	validateCoordinate(west, 'west', -180, 180);
	validateCoordinate(east, 'east', -180, 180);
	validateCoordinate(south, 'south', -90, 90);
	validateCoordinate(north, 'north', -90, 90);

	if (west === east) {
		throw new Error('Map bounds west and east cannot be identical.');
	}

	if (south === north) {
		throw new Error('Map bounds south and north cannot be identical.');
	}

	return [west, south, east, north];
}

function isNestedMapBounds(bounds: MapBounds): bounds is [[number, number], [number, number]] {
	return Array.isArray(bounds[0]);
}

export function getMapMarkerBounds(markers: readonly MapMarker[]): MapLibreBounds | null {
	if (markers.length === 0) {
		return null;
	}

	const firstMarker = markers[0];
	let west = firstMarker.lng;
	let east = firstMarker.lng;
	let south = firstMarker.lat;
	let north = firstMarker.lat;

	for (let index = 1; index < markers.length; index += 1) {
		const marker = markers[index];
		west = Math.min(west, marker.lng);
		east = Math.max(east, marker.lng);
		south = Math.min(south, marker.lat);
		north = Math.max(north, marker.lat);
	}

	return expandMapBounds([west, south, east, north]);
}

export function getMapFitBoundsOptions(padding?: number): MapLibreFitBoundsOptions | undefined {
	return padding === undefined ? undefined : { padding };
}

export function mapBoundsEqual(
	currentBounds: MapLibreBounds | undefined,
	nextBounds: MapLibreBounds | null | undefined
): boolean {
	return (
		!!currentBounds &&
		!!nextBounds &&
		currentBounds.every((value, index) => value === nextBounds[index])
	);
}

function expandMapBounds(bounds: MapLibreBounds): MapLibreBounds {
	let [west, south, east, north] = bounds;

	if (west === east) {
		west = Math.max(-180, west - SINGLE_MARKER_BOUNDS_DELTA);
		east = Math.min(180, east + SINGLE_MARKER_BOUNDS_DELTA);
	}

	if (south === north) {
		south = Math.max(-90, south - SINGLE_MARKER_BOUNDS_DELTA);
		north = Math.min(90, north + SINGLE_MARKER_BOUNDS_DELTA);
	}

	return [west, south, east, north];
}

function validateCoordinate(value: number, name: string, min: number, max: number): void {
	if (!Number.isFinite(value)) {
		throw new Error(`Map bounds ${name} must be a finite number.`);
	}

	if (value < min || value > max) {
		throw new Error(`Map bounds ${name} must be between ${min} and ${max}.`);
	}
}
