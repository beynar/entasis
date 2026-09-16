import type { MapMarker, MapMarkerFeatureCollection } from './map-data.js';
import type {
	MapLibreClusterLeafFeature,
	MapLibreGeoJSONSource,
	MapLibreMap,
	MapLibreMapGeoJSONFeature
} from './maplibre-types.js';

export type MapClusterOptions = {
	enabled?: boolean;
	radius?: number;
	maxZoom?: number;
	zoomOnClick?: boolean;
};

export type ResolvedMapClusterConfig = Required<MapClusterOptions>;
export type MapClusterLeafFeature = MapLibreClusterLeafFeature;

export type AppliedMapClusterSourceState = {
	radius?: number;
	maxZoom?: number;
	sourceSignature?: string;
};

export type MapClusterSourceSyncResult = AppliedMapClusterSourceState & {
	shouldRefreshVisibleFeatures: boolean;
};

export type VisibleMapFeatureGroups<TData = unknown> = {
	clusterFeatures: MapLibreMapGeoJSONFeature[];
	pointMarkers: MapMarker<TData>[];
};

export type MapClusterRenderArg<TData = unknown> = {
	id: string;
	count: number;
	coordinates: [number, number];
	map: MapLibreMap;
	expand: () => void;
	markers: MapMarker<TData>[];
	data: TData[];
	feature: MapLibreMapGeoJSONFeature;
};

type ResolveMapClusterRenderArgsOptions<TData> = {
	map: MapLibreMap;
	source: MapLibreGeoJSONSource;
	clusterFeatures: MapLibreMapGeoJSONFeature[];
	markerLookup: Map<string, MapMarker<TData>>;
	isCurrent: () => boolean;
	createExpand: (clusterId: number, coordinates: [number, number]) => () => void;
	reportError: (error: Error) => void;
	toError: (value: unknown, fallback: string) => Error;
};

type CreateMapClusterExpandOptions = {
	map: MapLibreMap;
	clusterId: number;
	coordinates: [number, number];
	isCurrent: () => boolean;
	reportError: (error: Error) => void;
	toError: (value: unknown, fallback: string) => Error;
};

type ResolveMapClusterRenderArgOptions<TData> = Omit<
	ResolveMapClusterRenderArgsOptions<TData>,
	'clusterFeatures'
> & {
	feature: MapLibreMapGeoJSONFeature;
};

type MapFeatureProperties = Record<string, unknown> | null | undefined;

export const MAP_CLUSTER_SOURCE_ID = 'svelte-pro-map-clusters';
export const MAP_CLUSTER_LAYER_ID = 'svelte-pro-map-cluster-query';

const DEFAULT_CLUSTER_RADIUS = 50;
const DEFAULT_CLUSTER_MAX_ZOOM = 14;
const CLUSTER_EXPANSION_ZOOM_OFFSET = 0.5;

export function resolveMapClusterConfig(
	value: boolean | MapClusterOptions | null | undefined
): ResolvedMapClusterConfig {
	if (value === true) {
		return {
			enabled: true,
			radius: DEFAULT_CLUSTER_RADIUS,
			maxZoom: DEFAULT_CLUSTER_MAX_ZOOM,
			zoomOnClick: true
		};
	}

	if (value === false || value == null) {
		return {
			enabled: false,
			radius: DEFAULT_CLUSTER_RADIUS,
			maxZoom: DEFAULT_CLUSTER_MAX_ZOOM,
			zoomOnClick: true
		};
	}

	return {
		enabled: value.enabled ?? true,
		radius: value.radius ?? DEFAULT_CLUSTER_RADIUS,
		maxZoom: value.maxZoom ?? DEFAULT_CLUSTER_MAX_ZOOM,
		zoomOnClick: value.zoomOnClick ?? true
	};
}

export function readMapMarkerId(properties: MapFeatureProperties): string | null {
	const markerId = properties?.markerId;

	if (typeof markerId === 'string' || typeof markerId === 'number') {
		return String(markerId);
	}

	return null;
}

export function readMapClusterId(feature: MapLibreMapGeoJSONFeature): number | null {
	const clusterId = feature.properties.cluster_id;

	if (typeof clusterId === 'number' && Number.isFinite(clusterId)) {
		return clusterId;
	}

	return null;
}

export function readMapClusterCount(feature: MapLibreMapGeoJSONFeature): number | null {
	const count = feature.properties.point_count;

	if (typeof count === 'number' && Number.isFinite(count)) {
		return count;
	}

	return null;
}

export function readMapFeatureCoordinates(
	feature: MapLibreMapGeoJSONFeature
): [number, number] | null {
	const geometry = feature.geometry;

	if (geometry.type !== 'Point') {
		return null;
	}

	const coordinates = geometry.coordinates;

	if (!Array.isArray(coordinates)) {
		return null;
	}

	const [lng, lat] = coordinates;

	if (
		typeof lng !== 'number' ||
		typeof lat !== 'number' ||
		!Number.isFinite(lng) ||
		!Number.isFinite(lat)
	) {
		return null;
	}

	return [lng, lat];
}

export function resolveMapClusterLeafMarkers<TData>(
	leaves: MapClusterLeafFeature[],
	markerLookup: Map<string, MapMarker<TData>>,
	clusterId: number
): MapMarker<TData>[] {
	const clusterLeafMarkers: MapMarker<TData>[] = [];

	for (const leaf of leaves) {
		const markerId = readMapMarkerId(leaf.properties);

		if (markerId === null) {
			throw new Error(`Map cluster "${clusterId}" leaf is missing markerId.`);
		}

		const mapMarker = markerLookup.get(markerId);

		if (!mapMarker) {
			throw new Error(`Map cluster "${clusterId}" references unknown marker "${markerId}".`);
		}

		clusterLeafMarkers.push(mapMarker);
	}

	return clusterLeafMarkers;
}

export function getDefinedMapClusterData<TData>(clusterLeafMarkers: MapMarker<TData>[]): TData[] {
	const clusterData: TData[] = [];

	for (const mapMarker of clusterLeafMarkers) {
		if (mapMarker.data !== undefined) {
			clusterData.push(mapMarker.data);
		}
	}

	return clusterData;
}

export function groupVisibleMapFeatures<TData>(
	features: MapLibreMapGeoJSONFeature[],
	markerLookup: Map<string, MapMarker<TData>>
): VisibleMapFeatureGroups<TData> {
	const clusterFeatures = new Map<string, MapLibreMapGeoJSONFeature>();
	const pointMarkers = new Map<string, MapMarker<TData>>();

	for (const feature of features) {
		if (feature.properties.cluster === true) {
			const clusterId = readMapClusterId(feature);

			if (clusterId !== null) {
				clusterFeatures.set(`cluster:${clusterId}`, feature);
			}

			continue;
		}

		const markerId = readMapMarkerId(feature.properties);

		if (markerId === null) {
			continue;
		}

		const mapMarker = markerLookup.get(markerId);

		if (mapMarker) {
			pointMarkers.set(`marker:${markerId}`, mapMarker);
		}
	}

	return {
		clusterFeatures: Array.from(clusterFeatures.values()),
		pointMarkers: Array.from(pointMarkers.values())
	};
}

export async function resolveMapClusterRenderArgs<TData>({
	map,
	source,
	clusterFeatures,
	markerLookup,
	isCurrent,
	createExpand,
	reportError,
	toError
}: ResolveMapClusterRenderArgsOptions<TData>): Promise<MapClusterRenderArg<TData>[]> {
	const clusterMarkers = await Promise.all(
		clusterFeatures.map((feature) =>
			resolveMapClusterRenderArg({
				map,
				source,
				feature,
				markerLookup,
				isCurrent,
				createExpand,
				reportError,
				toError
			})
		)
	);

	if (!isCurrent()) {
		return [];
	}

	return clusterMarkers.filter(
		(clusterMarker): clusterMarker is MapClusterRenderArg<TData> => clusterMarker !== null
	);
}

export function createMapClusterExpand({
	map,
	clusterId,
	coordinates,
	isCurrent,
	reportError,
	toError
}: CreateMapClusterExpandOptions): () => void {
	return () => {
		let source: MapLibreGeoJSONSource | null;

		try {
			source = getMapClusterSource(map);
		} catch (error) {
			reportError(toError(error, `Cannot expand map cluster "${clusterId}".`));
			return;
		}

		if (!source) {
			reportError(new Error(`Cannot expand map cluster "${clusterId}" without a cluster source.`));
			return;
		}

		void source
			.getClusterExpansionZoom(clusterId)
			.then((expansionZoom) => {
				if (isCurrent()) {
					map.easeTo({
						center: coordinates,
						zoom: Math.min(map.getMaxZoom(), expansionZoom + CLUSTER_EXPANSION_ZOOM_OFFSET)
					});
				}
			})
			.catch((error) => {
				reportError(toError(error, `Failed to expand map cluster "${clusterId}".`));
			});
	};
}

async function resolveMapClusterRenderArg<TData>({
	map,
	source,
	feature,
	markerLookup,
	isCurrent,
	createExpand,
	reportError,
	toError
}: ResolveMapClusterRenderArgOptions<TData>): Promise<MapClusterRenderArg<TData> | null> {
	const clusterId = readMapClusterId(feature);
	const count = readMapClusterCount(feature);
	const coordinates = readMapFeatureCoordinates(feature);

	if (clusterId === null || count === null || coordinates === null) {
		reportError(
			new Error('MapLibre returned a cluster feature without id, count, or coordinates.')
		);
		return null;
	}

	let leaves;

	try {
		leaves = await source.getClusterLeaves(clusterId, Infinity, 0);
	} catch (error) {
		if (isCurrent()) {
			reportError(toError(error, `Failed to resolve leaves for map cluster "${clusterId}".`));
		}

		return null;
	}

	if (!isCurrent()) {
		return null;
	}

	let clusterLeafMarkers: MapMarker<TData>[];

	try {
		clusterLeafMarkers = resolveMapClusterLeafMarkers(leaves, markerLookup, clusterId);
	} catch (error) {
		reportError(toError(error, `Failed to resolve markers for map cluster "${clusterId}".`));
		return null;
	}

	return {
		id: `cluster:${clusterId}`,
		count,
		coordinates,
		map,
		expand: createExpand(clusterId, coordinates),
		markers: clusterLeafMarkers,
		data: getDefinedMapClusterData(clusterLeafMarkers),
		feature
	};
}

export function getMapClusterSource(map: MapLibreMap): MapLibreGeoJSONSource | null {
	const source = map.getSource(MAP_CLUSTER_SOURCE_ID);

	if (!source) {
		return null;
	}

	if (
		source.type !== 'geojson' ||
		!('setData' in source) ||
		!('getClusterLeaves' in source) ||
		!('getClusterExpansionZoom' in source)
	) {
		throw new Error(`Map cluster source "${MAP_CLUSTER_SOURCE_ID}" is not a GeoJSON source.`);
	}

	return source as MapLibreGeoJSONSource;
}

export function removeMapClusterSourceAndLayer(map: MapLibreMap): void {
	if (!map.isStyleLoaded()) {
		return;
	}

	if (map.getLayer(MAP_CLUSTER_LAYER_ID)) {
		map.removeLayer(MAP_CLUSTER_LAYER_ID);
	}

	if (map.getSource(MAP_CLUSTER_SOURCE_ID)) {
		map.removeSource(MAP_CLUSTER_SOURCE_ID);
	}
}

export function ensureMapClusterSource(
	map: MapLibreMap,
	featureCollection: MapMarkerFeatureCollection,
	config: ResolvedMapClusterConfig
): MapLibreGeoJSONSource | null {
	const source = getMapClusterSource(map);

	if (source) {
		return source;
	}

	map.addSource(MAP_CLUSTER_SOURCE_ID, {
		type: 'geojson',
		data: featureCollection,
		cluster: true,
		clusterRadius: config.radius,
		clusterMaxZoom: config.maxZoom
	});

	return getMapClusterSource(map);
}

export function ensureMapClusterLayer(map: MapLibreMap): void {
	if (map.getLayer(MAP_CLUSTER_LAYER_ID)) {
		return;
	}

	map.addLayer({
		id: MAP_CLUSTER_LAYER_ID,
		type: 'circle',
		source: MAP_CLUSTER_SOURCE_ID,
		paint: {
			'circle-radius': 1,
			'circle-color': 'rgba(0, 0, 0, 0)',
			'circle-stroke-color': 'rgba(0, 0, 0, 0)',
			'circle-stroke-width': 0
		}
	});
}

export function syncMapClusterSourceAndLayer(
	map: MapLibreMap,
	featureCollection: MapMarkerFeatureCollection,
	sourceSignature: string,
	config: ResolvedMapClusterConfig,
	appliedState: AppliedMapClusterSourceState
): MapClusterSourceSyncResult {
	const hadSource = Boolean(map.getSource(MAP_CLUSTER_SOURCE_ID));
	const hadLayer = Boolean(map.getLayer(MAP_CLUSTER_LAYER_ID));
	const source = ensureMapClusterSource(map, featureCollection, config);

	if (!source) {
		return { ...appliedState, shouldRefreshVisibleFeatures: false };
	}

	ensureMapClusterLayer(map);

	const sourceChanged = appliedState.sourceSignature !== sourceSignature;
	const configChanged =
		appliedState.radius !== config.radius || appliedState.maxZoom !== config.maxZoom;

	updateMapClusterSource(source, featureCollection, config, {
		shouldUpdateData: hadSource && sourceChanged,
		shouldUpdateOptions: hadSource && configChanged
	});

	return {
		radius: config.radius,
		maxZoom: config.maxZoom,
		sourceSignature,
		shouldRefreshVisibleFeatures: !hadSource || !hadLayer || sourceChanged || configChanged
	};
}

export function updateMapClusterSource(
	source: MapLibreGeoJSONSource,
	featureCollection: MapMarkerFeatureCollection,
	config: ResolvedMapClusterConfig,
	options: {
		shouldUpdateData: boolean;
		shouldUpdateOptions: boolean;
	}
): void {
	if (options.shouldUpdateOptions) {
		source.setClusterOptions({
			cluster: true,
			clusterRadius: config.radius,
			clusterMaxZoom: config.maxZoom
		});
	}

	if (options.shouldUpdateData) {
		source.setData(featureCollection);
	}
}
