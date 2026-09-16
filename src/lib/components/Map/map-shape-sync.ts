import { MAP_SHAPE_ID_PREFIX, getMapShapeSourceId, safeMapShapeId } from './map-shape-geometry.js';
import type { NormalizedMapShape } from './map-shapes.js';
import type { MapLibreMap } from './maplibre-types.js';

export function syncMapShapeSourcesAndLayers(
	map: MapLibreMap,
	shapes: readonly NormalizedMapShape[],
	appliedSignatures: Map<string, string>
): void {
	const nextShapes = new Map(shapes.map((shape) => [shape.id, shape]));
	const nextShapeIds = new Set(nextShapes.keys());

	for (const shapeId of appliedSignatures.keys()) {
		if (!nextShapeIds.has(shapeId)) {
			removeMapShape(map, shapeId);
			appliedSignatures.delete(shapeId);
		}
	}

	for (const shape of nextShapes.values()) {
		const existingSignature = appliedSignatures.get(shape.id);
		const isApplied =
			map.getSource(shape.sourceId) && shape.layerIds.every((layerId) => map.getLayer(layerId));

		if (existingSignature === shape.signature && isApplied) {
			continue;
		}

		removeMapShape(map, shape.id);
		addMapShape(map, shape);
		appliedSignatures.set(shape.id, shape.signature);
	}
}

export function removeAllMapShapes(map: MapLibreMap, appliedSignatures: Map<string, string>): void {
	if (!map.isStyleLoaded()) {
		appliedSignatures.clear();
		return;
	}

	for (const shapeId of appliedSignatures.keys()) {
		removeMapShape(map, shapeId);
	}

	appliedSignatures.clear();
}

function addMapShape(map: MapLibreMap, shape: NormalizedMapShape): void {
	map.addSource(shape.sourceId, {
		type: 'geojson',
		data: shape.featureCollection
	});

	for (const layer of shape.layers) {
		map.addLayer(layer);
	}
}

function removeMapShape(map: MapLibreMap, shapeId: string): void {
	const safeId = safeMapShapeId(shapeId);
	const layerIds = [
		`${MAP_SHAPE_ID_PREFIX}-fill-${safeId}`,
		`${MAP_SHAPE_ID_PREFIX}-stroke-${safeId}`,
		`${MAP_SHAPE_ID_PREFIX}-line-${safeId}`
	];
	const sourceId = getMapShapeSourceId(shapeId);

	for (const layerId of layerIds) {
		if (map.getLayer(layerId)) {
			map.removeLayer(layerId);
		}
	}

	if (map.getSource(sourceId)) {
		map.removeSource(sourceId);
	}
}
