import type { MapBounds, MapShape } from './map-types.js';
import type { MapLibreLayerSpecification } from './maplibre-types.js';

export type MapShapeGeometry =
	| {
			type: 'LineString';
			coordinates: [number, number][];
	  }
	| {
			type: 'Polygon';
			coordinates: [number, number][][];
	  };

export const MAP_SHAPE_ID_PREFIX = 'map-shape';
export const DEFAULT_FILL_OPACITY = 0.2;
export const DEFAULT_STROKE_OPACITY = 0.8;
export const DEFAULT_LINE_WIDTH = 2;

const CIRCLE_SEGMENTS = 64;
const EARTH_RADIUS_METERS = 6_371_008.8;

export function createFillLayer(
	id: string,
	source: string,
	color: string,
	opacity: number
): MapLibreLayerSpecification {
	return {
		id,
		type: 'fill',
		source,
		paint: {
			'fill-color': color,
			'fill-opacity': opacity
		}
	};
}

export function createLineLayer(
	id: string,
	source: string,
	paint: { color: string; opacity: number; width: number }
): MapLibreLayerSpecification {
	return {
		id,
		type: 'line',
		source,
		paint: {
			'line-color': paint.color,
			'line-opacity': paint.opacity,
			'line-width': validatePositiveNumber(paint.width, 'width', id, 0)
		}
	};
}

export function createCircleCoordinates(
	center: [number, number],
	radiusMeters: number
): [number, number][][] {
	const [lng, lat] = center;
	const latRadians = toRadians(lat);
	const lngRadians = toRadians(lng);
	const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
	const ring: [number, number][] = [];

	for (let segment = 0; segment < CIRCLE_SEGMENTS; segment += 1) {
		const bearing = (2 * Math.PI * segment) / CIRCLE_SEGMENTS;
		const pointLat = Math.asin(
			Math.sin(latRadians) * Math.cos(angularDistance) +
				Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearing)
		);
		const pointLng =
			lngRadians +
			Math.atan2(
				Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRadians),
				Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(pointLat)
			);

		ring.push([normalizeLng(toDegrees(pointLng)), toDegrees(pointLat)]);
	}

	ring.push(ring[0]);
	return [ring];
}

export function createRectangleCoordinates(
	bounds: [number, number, number, number]
): [number, number][][] {
	const [west, south, east, north] = bounds;

	return [
		[
			[west, south],
			[east, south],
			[east, north],
			[west, north],
			[west, south]
		]
	];
}

export function normalizeShapeBounds(
	bounds: MapBounds,
	id: string,
	index: number
): [number, number, number, number] {
	const flatBounds: [number, number, number, number] =
		Array.isArray(bounds[0]) && Array.isArray(bounds[1])
			? [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]
			: (bounds as [number, number, number, number]);
	const west = validateLng(flatBounds[0], 'bounds west', id, index);
	const south = validateLat(flatBounds[1], 'bounds south', id, index);
	const east = validateLng(flatBounds[2], 'bounds east', id, index);
	const north = validateLat(flatBounds[3], 'bounds north', id, index);

	return [
		Math.min(west, east),
		Math.min(south, north),
		Math.max(west, east),
		Math.max(south, north)
	];
}

export function validatePolygonCoordinates(
	coordinates: [number, number][] | [number, number][][],
	id: string,
	index: number
): [number, number][][] {
	const rings = Array.isArray(coordinates[0]?.[0])
		? (coordinates as [number, number][][])
		: [coordinates as [number, number][]];

	return rings.map((ring, ringIndex) => closeRing(validateRing(ring, ringIndex, id, index)));
}

export function validateLineCoordinates(
	coordinates: [number, number][],
	id: string,
	index: number
): [number, number][] {
	if (!Array.isArray(coordinates) || coordinates.length < 2) {
		throw new Error(
			`Map polyline shape "${id}" at index ${index} must include at least two coordinates.`
		);
	}

	return coordinates.map((coordinate, coordinateIndex) =>
		validateLngLat(coordinate, `coordinates[${coordinateIndex}]`, id, index)
	);
}

export function validateShapeId(
	shapeId: MapShape['id'] | null | undefined,
	index: number
): MapShape['id'] {
	if (shapeId === null || shapeId === undefined) {
		throw new Error(`Map shape at index ${index} must include a non-null id.`);
	}

	return shapeId;
}

export function validateLngLat(
	value: [number, number],
	name: string,
	id: string,
	index: number
): [number, number] {
	if (!Array.isArray(value) || value.length !== 2) {
		throw new Error(
			`Map shape "${id}" at index ${index} has invalid ${name}: expected [lng, lat].`
		);
	}

	return [validateLng(value[0], name, id, index), validateLat(value[1], name, id, index)];
}

export function validatePositiveNumber(
	value: number,
	name: string,
	id: string,
	index: number
): number {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(
			`Map shape "${id}" at index ${index} has invalid ${name}: expected a positive finite number.`
		);
	}

	return value;
}

export function validateOptionalOpacity(
	value: number | undefined,
	id: string,
	index: number
): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (!Number.isFinite(value) || value < 0 || value > 1) {
		throw new Error(`Map shape "${id}" at index ${index} has invalid opacity: expected 0 to 1.`);
	}

	return value;
}

export function validateOptionalString(
	value: string | undefined,
	name: string,
	id: string,
	index: number
): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(
			`Map shape "${id}" at index ${index} has invalid ${name}: expected a non-empty string.`
		);
	}

	return value;
}

export function getMapShapeSourceId(id: string): string {
	return `${MAP_SHAPE_ID_PREFIX}-source-${safeMapShapeId(id)}`;
}

export function safeMapShapeId(id: string): string {
	return encodeURIComponent(id).replace(/%/g, '_');
}

function validateRing(
	ring: [number, number][],
	ringIndex: number,
	id: string,
	index: number
): [number, number][] {
	if (!Array.isArray(ring) || ring.length < 3) {
		throw new Error(
			`Map polygon shape "${id}" ring ${ringIndex} at index ${index} must include at least three coordinates.`
		);
	}

	return ring.map((coordinate, coordinateIndex) =>
		validateLngLat(coordinate, `coordinates[${ringIndex}][${coordinateIndex}]`, id, index)
	);
}

function closeRing(ring: [number, number][]): [number, number][] {
	const first = ring[0];
	const last = ring[ring.length - 1];

	if (first[0] === last[0] && first[1] === last[1]) {
		return ring;
	}

	return [...ring, first];
}

function validateLng(value: number, name: string, id: string, index: number): number {
	return validateCoordinate(value, name, -180, 180, id, index);
}

function validateLat(value: number, name: string, id: string, index: number): number {
	return validateCoordinate(value, name, -90, 90, id, index);
}

function validateCoordinate(
	value: number,
	name: string,
	min: number,
	max: number,
	id: string,
	index: number
): number {
	if (!Number.isFinite(value)) {
		throw new Error(
			`Map shape "${id}" at index ${index} has invalid ${name}: expected a finite number.`
		);
	}

	if (value < min || value > max) {
		throw new Error(
			`Map shape "${id}" at index ${index} has invalid ${name}: expected ${min} to ${max}, received ${value}.`
		);
	}

	return value;
}

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}

function normalizeLng(lng: number): number {
	return ((((lng + 180) % 360) + 360) % 360) - 180;
}
