import type { MapMarker } from './map-data.js';
import { toMapLibreColor } from './map-css-color.js';
import type {
	MapLibreFeatureCollection,
	MapLibreMap,
	MapLibrePlainGeoJSONSource
} from './maplibre-types.js';

type MapClusterHullPoint = [number, number];

type MapClusterHullFeature = {
	type: 'Feature';
	geometry: {
		type: 'Polygon';
		coordinates: MapClusterHullPoint[][];
	};
	properties: Record<string, never>;
};

type MapClusterHullFeatureCollection = MapLibreFeatureCollection & {
	features: MapClusterHullFeature[];
};

const MAP_CLUSTER_HULL_SOURCE_ID = 'svelte-pro-map-cluster-hull';
const MAP_CLUSTER_HULL_FILL_LAYER_ID = 'svelte-pro-map-cluster-hull-fill';
const MAP_CLUSTER_HULL_STROKE_LAYER_ID = 'svelte-pro-map-cluster-hull-stroke';

export function syncMapClusterHull<TData>(map: MapLibreMap, markers: MapMarker<TData>[]): void {
	if (!map.isStyleLoaded()) return;

	const featureCollection = createMapClusterHullFeatureCollection(markers);

	if (!featureCollection) {
		removeMapClusterHull(map);
		return;
	}

	const source = getMapClusterHullSource(map);

	if (source) {
		source.setData(featureCollection);
		ensureMapClusterHullLayers(map);
		return;
	}

	map.addSource(MAP_CLUSTER_HULL_SOURCE_ID, {
		type: 'geojson',
		data: featureCollection
	});
	ensureMapClusterHullLayers(map);
}

export function removeMapClusterHull(map: MapLibreMap): void {
	if (!map.isStyleLoaded()) return;

	if (map.getLayer(MAP_CLUSTER_HULL_STROKE_LAYER_ID)) {
		map.removeLayer(MAP_CLUSTER_HULL_STROKE_LAYER_ID);
	}

	if (map.getLayer(MAP_CLUSTER_HULL_FILL_LAYER_ID)) {
		map.removeLayer(MAP_CLUSTER_HULL_FILL_LAYER_ID);
	}

	if (map.getSource(MAP_CLUSTER_HULL_SOURCE_ID)) {
		map.removeSource(MAP_CLUSTER_HULL_SOURCE_ID);
	}
}

function ensureMapClusterHullLayers(map: MapLibreMap): void {
	const color = readClusterHullColor();

	if (!map.getLayer(MAP_CLUSTER_HULL_FILL_LAYER_ID)) {
		map.addLayer({
			id: MAP_CLUSTER_HULL_FILL_LAYER_ID,
			type: 'fill',
			source: MAP_CLUSTER_HULL_SOURCE_ID,
			paint: {
				'fill-color': color,
				'fill-opacity': 0.14
			}
		});
	}

	if (!map.getLayer(MAP_CLUSTER_HULL_STROKE_LAYER_ID)) {
		map.addLayer({
			id: MAP_CLUSTER_HULL_STROKE_LAYER_ID,
			type: 'line',
			source: MAP_CLUSTER_HULL_SOURCE_ID,
			paint: {
				'line-color': color,
				'line-opacity': 0.85,
				'line-width': 2
			}
		});
	}
}

function getMapClusterHullSource(map: MapLibreMap): MapLibrePlainGeoJSONSource | null {
	const source = map.getSource(MAP_CLUSTER_HULL_SOURCE_ID);

	if (!source) {
		return null;
	}

	if (source.type !== 'geojson' || !('setData' in source)) {
		throw new Error(
			`Map cluster hull source "${MAP_CLUSTER_HULL_SOURCE_ID}" is not a GeoJSON source.`
		);
	}

	return source as MapLibrePlainGeoJSONSource;
}

function createMapClusterHullFeatureCollection<TData>(
	markers: MapMarker<TData>[]
): MapClusterHullFeatureCollection | null {
	const points = getDistinctMarkerPoints(markers);

	if (points.length < 3) {
		return null;
	}

	const ring = createMapClusterHullRing(points);

	if (!ring) {
		return null;
	}

	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [ring]
				},
				properties: {}
			}
		]
	};
}

function getDistinctMarkerPoints<TData>(markers: MapMarker<TData>[]): MapClusterHullPoint[] {
	const points = new Map<string, MapClusterHullPoint>();

	for (const marker of markers) {
		if (!Number.isFinite(marker.lng) || !Number.isFinite(marker.lat)) {
			throw new Error(`Map cluster marker "${String(marker.id)}" has invalid coordinates.`);
		}

		points.set(`${marker.lng}:${marker.lat}`, [marker.lng, marker.lat]);
	}

	return Array.from(points.values());
}

function createConvexHull(points: MapClusterHullPoint[]): MapClusterHullPoint[] {
	const sortedPoints = [...points].sort(comparePoints);
	const lowerHull: MapClusterHullPoint[] = [];
	const upperHull: MapClusterHullPoint[] = [];

	for (const point of sortedPoints) {
		while (
			lowerHull.length >= 2 &&
			cross(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], point) <= 0
		) {
			lowerHull.pop();
		}

		lowerHull.push(point);
	}

	for (const point of [...sortedPoints].reverse()) {
		while (
			upperHull.length >= 2 &&
			cross(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], point) <= 0
		) {
			upperHull.pop();
		}

		upperHull.push(point);
	}

	return lowerHull.slice(0, -1).concat(upperHull.slice(0, -1));
}

function createMapClusterHullRing(points: MapClusterHullPoint[]): MapClusterHullPoint[] | null {
	const hull = createConvexHull(points);
	return hull.length >= 3 ? closeRing(hull) : null;
}

function closeRing(points: MapClusterHullPoint[]): MapClusterHullPoint[] {
	const first = points[0];
	const last = points[points.length - 1];

	if (last && first[0] === last[0] && first[1] === last[1]) {
		return points;
	}

	return [...points, first];
}

function comparePoints(first: MapClusterHullPoint, second: MapClusterHullPoint): number {
	return first[0] === second[0] ? first[1] - second[1] : first[0] - second[0];
}

function cross(
	origin: MapClusterHullPoint | undefined,
	first: MapClusterHullPoint | undefined,
	second: MapClusterHullPoint
): number {
	if (!origin || !first) return 0;
	return (
		(first[0] - origin[0]) * (second[1] - origin[1]) -
		(first[1] - origin[1]) * (second[0] - origin[0])
	);
}

function readClusterHullColor(): string {
	const probe = document.createElement('span');
	probe.style.color = 'color-mix(in srgb, var(--primary) 100%, transparent)';
	probe.style.opacity = '0';
	(document.body ?? document.documentElement).append(probe);

	try {
		return toMapLibreColor(getComputedStyle(probe).color) ?? 'rgb(15, 23, 42)';
	} finally {
		probe.remove();
	}
}
