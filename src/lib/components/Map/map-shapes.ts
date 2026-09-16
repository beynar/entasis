import {
	DEFAULT_FILL_OPACITY,
	DEFAULT_LINE_WIDTH,
	DEFAULT_STROKE_OPACITY,
	MAP_SHAPE_ID_PREFIX,
	createCircleCoordinates,
	createFillLayer,
	createLineLayer,
	createRectangleCoordinates,
	getMapShapeSourceId,
	normalizeShapeBounds,
	safeMapShapeId,
	validateLineCoordinates,
	validateLngLat,
	validateOptionalOpacity,
	validateOptionalString,
	validatePolygonCoordinates,
	validatePositiveNumber,
	validateShapeId,
	type MapShapeGeometry
} from './map-shape-geometry.js';
import type { MapShape } from './map-types.js';
import type { MapLibreLayerSpecification } from './maplibre-types.js';

export type MapShapeFeature = {
	type: 'Feature';
	id: MapShape['id'];
	geometry: MapShapeGeometry;
	properties: {
		shapeId: string;
		label?: string;
	};
};

export type MapShapeFeatureCollection = {
	type: 'FeatureCollection';
	features: MapShapeFeature[];
};

export type NormalizedMapShape = {
	id: string;
	sourceId: string;
	layerIds: string[];
	featureCollection: MapShapeFeatureCollection;
	layers: MapLibreLayerSpecification[];
	signature: string;
};

type NormalizeMapShapesOptions = {
	defaultColor?: string;
	reportError?: (error: Error) => void;
};

const DEFAULT_COLOR = 'var(--primary)';

export function normalizeMapShapes(
	shapes: readonly MapShape[] | undefined,
	options: NormalizeMapShapesOptions = {}
): NormalizedMapShape[] {
	if (shapes === undefined) {
		return [];
	}

	if (!Array.isArray(shapes)) {
		throw new Error('Map shapes must be an array.');
	}

	const normalizedShapes = new Map<string, NormalizedMapShape>();

	for (const [index, shape] of shapes.entries()) {
		try {
			const shapeId = validateShapeId(shape.id, index);
			const id = String(shapeId);

			if (normalizedShapes.has(id)) {
				throw new Error(`Duplicate map shape id "${id}" at index ${index}.`);
			}

			if (shape.visible === false) {
				continue;
			}

			normalizedShapes.set(
				id,
				normalizeMapShape(shape, id, index, options.defaultColor ?? DEFAULT_COLOR)
			);
		} catch (error) {
			if (!options.reportError) {
				throw error;
			}

			options.reportError(error instanceof Error ? error : new Error('Invalid map shape data.'));
		}
	}

	return Array.from(normalizedShapes.values());
}

function normalizeMapShape(
	shape: MapShape,
	id: string,
	index: number,
	defaultColor: string
): NormalizedMapShape {
	const sourceId = getMapShapeSourceId(id);
	const color = validateOptionalString(shape.color, 'color', id, index) ?? defaultColor;

	if (shape.type === 'polyline') {
		return createNormalizedShape({
			shape,
			id,
			sourceId,
			label: validateOptionalString(shape.label, 'label', id, index),
			geometry: {
				type: 'LineString',
				coordinates: validateLineCoordinates(shape.coordinates, id, index)
			},
			layers: [
				createLineLayer(`${MAP_SHAPE_ID_PREFIX}-line-${safeMapShapeId(id)}`, sourceId, {
					color,
					opacity: validateOptionalOpacity(shape.opacity, id, index) ?? DEFAULT_STROKE_OPACITY,
					width: shape.width ?? DEFAULT_LINE_WIDTH
				})
			]
		});
	}

	const polygonCoordinates =
		shape.type === 'circle'
			? createCircleCoordinates(
					validateLngLat(shape.center, 'center', id, index),
					validatePositiveNumber(shape.radiusMeters, 'radiusMeters', id, index)
				)
			: shape.type === 'rectangle'
				? createRectangleCoordinates(normalizeShapeBounds(shape.bounds, id, index))
				: validatePolygonCoordinates(shape.coordinates, id, index);
	const opacity = validateOptionalOpacity(shape.opacity, id, index);
	const fill = getPolygonFill(shape, color, id, index);
	const stroke = getPolygonStroke(shape, color, id, index);

	return createNormalizedShape({
		shape,
		id,
		sourceId,
		label: validateOptionalString(shape.label, 'label', id, index),
		geometry: {
			type: 'Polygon',
			coordinates: polygonCoordinates
		},
		layers: [
			createFillLayer(
				`${MAP_SHAPE_ID_PREFIX}-fill-${safeMapShapeId(id)}`,
				sourceId,
				fill,
				opacity ?? DEFAULT_FILL_OPACITY
			),
			createLineLayer(`${MAP_SHAPE_ID_PREFIX}-stroke-${safeMapShapeId(id)}`, sourceId, {
				color: stroke,
				opacity: DEFAULT_STROKE_OPACITY,
				width: DEFAULT_LINE_WIDTH
			})
		]
	});
}

function getPolygonFill(
	shape: Exclude<MapShape, { type: 'polyline' }>,
	color: string,
	id: string,
	index: number
): string {
	if (shape.type !== 'polygon' && shape.type !== 'rectangle') {
		return color;
	}

	return validateOptionalString(shape.fill, 'fill', id, index) ?? color;
}

function getPolygonStroke(
	shape: Exclude<MapShape, { type: 'polyline' }>,
	color: string,
	id: string,
	index: number
): string {
	if (shape.type !== 'polygon' && shape.type !== 'rectangle') {
		return color;
	}

	return validateOptionalString(shape.stroke, 'stroke', id, index) ?? color;
}

function createNormalizedShape({
	shape,
	id,
	sourceId,
	label,
	geometry,
	layers
}: {
	shape: MapShape;
	id: string;
	sourceId: string;
	label?: string;
	geometry: MapShapeGeometry;
	layers: MapLibreLayerSpecification[];
}): NormalizedMapShape {
	const featureCollection: MapShapeFeatureCollection = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				id: shape.id,
				geometry,
				properties: {
					shapeId: id,
					...(label ? { label } : {})
				}
			}
		]
	};

	return {
		id,
		sourceId,
		layerIds: layers.map((layer) => layer.id),
		featureCollection,
		layers,
		signature: JSON.stringify({ featureCollection, layers })
	};
}
