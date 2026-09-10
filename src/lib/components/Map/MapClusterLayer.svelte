<script lang="ts" generics="TData = unknown">
	import type { Snippet } from 'svelte';
	import { onMount, untrack } from 'svelte';
	import MapClusterNode from './MapClusterNode.svelte';
	import MapMarkerNode from './MapMarkerNode.svelte';
	import { reportMapError, toMapError } from './map-errors.js';
	import { bindLiveMapRefreshEvents, createLiveMapRefresh } from './map-refresh.js';
	import {
		MAP_CLUSTER_LAYER_ID,
		MAP_CLUSTER_SOURCE_ID,
		createMapClusterExpand,
		getMapClusterSource,
		groupVisibleMapFeatures,
		removeMapClusterSourceAndLayer,
		resolveMapClusterRenderArgs,
		syncMapClusterSourceAndLayer,
		type ResolvedMapClusterConfig
	} from './map-cluster.js';
	import type { MapMarker, NormalizedMapMarkers } from './map-data.js';
	import type {
		MapClusterSnippetArg,
		MapMarkerPopupContentArg,
		MapMarkerSnippetArg,
		MapMarkerTooltipContentArg
	} from './map-types.js';
	import type {
		MapLibreGeoJSONSource,
		MapLibreMap,
		MapLibreMapGeoJSONFeature,
		MapLibreMapSourceDataEvent,
		MapLibreMarkerConstructor
	} from './maplibre-types.js';

	type Props<TData = unknown> = {
		map: MapLibreMap;
		Marker: MapLibreMarkerConstructor;
		normalizedMarkers: NormalizedMapMarkers<TData>;
		clusterConfig: ResolvedMapClusterConfig;
		markerContent?: Snippet<[MapMarkerSnippetArg<TData>]>;
		popup?: boolean | Snippet<[MapMarkerPopupContentArg<TData>]>;
		tooltip?: boolean | Snippet<[MapMarkerTooltipContentArg<TData>]>;
		clusterContent?: Snippet<[MapClusterSnippetArg<TData>]>;
		onMarkerClick?: (marker: MapMarker<TData>) => void;
		onClusterClick?: (cluster: MapClusterSnippetArg<TData>) => void;
		onError?: (error: Error) => void;
	};

	let {
		map,
		Marker,
		normalizedMarkers,
		clusterConfig,
		markerContent,
		popup,
		tooltip,
		clusterContent,
		onMarkerClick,
		onClusterClick,
		onError
	}: Props<TData> = $props();

	let visibleClusterMarkers = $state<MapClusterSnippetArg<TData>[]>([]);
	let visiblePointMarkers = $state<MapMarker<TData>[]>([]);
	let appliedClusterRadius: number | undefined;
	let appliedClusterMaxZoom: number | undefined;
	let appliedSourceSignature: string | undefined;
	let appliedMarkerLookup: Map<string, MapMarker<TData>> | undefined;
	let refreshVersion = 0;
	let mounted = false;
	let hasQueuedIdleRefresh = false;
	const liveRefresh = createLiveMapRefresh(refreshVisibleFeatures);

	function reportError(error: Error): void {
		reportMapError(error, onError);
	}

	function clearVisibleState(): void {
		refreshVersion += 1;
		visibleClusterMarkers = [];
		visiblePointMarkers = [];
	}

	function syncSourceAndLayer(): void {
		if (!map.isStyleLoaded()) {
			refreshVersion += 1;
			return;
		}

		try {
			const markerLookupChanged = appliedMarkerLookup !== normalizedMarkers.markerLookup;
			const syncResult = syncMapClusterSourceAndLayer(
				map,
				normalizedMarkers.featureCollection,
				normalizedMarkers.sourceSignature,
				clusterConfig,
				{
					radius: appliedClusterRadius,
					maxZoom: appliedClusterMaxZoom,
					sourceSignature: appliedSourceSignature
				}
			);
			appliedClusterRadius = syncResult.radius;
			appliedClusterMaxZoom = syncResult.maxZoom;
			appliedSourceSignature = syncResult.sourceSignature;
			appliedMarkerLookup = normalizedMarkers.markerLookup;

			if (syncResult.shouldRefreshVisibleFeatures || markerLookupChanged) {
				refreshVersion += 1;
				queueVisibleFeatureRefresh();
			}
		} catch (error) {
			reportError(toMapError(error, 'Failed to synchronize MapLibre cluster source or layer.'));
		}
	}

	function queueVisibleFeatureRefresh(): void {
		if (hasQueuedIdleRefresh) return;
		hasQueuedIdleRefresh = true;
		map.once('idle', () => {
			hasQueuedIdleRefresh = false;
			if (mounted) refreshVisibleFeatures();
		});
	}

	function refreshVisibleFeatures(): void {
		if (!map.isStyleLoaded()) return;
		if (!map.getSource(MAP_CLUSTER_SOURCE_ID) || !map.getLayer(MAP_CLUSTER_LAYER_ID)) {
			return;
		}

		if (!map.isSourceLoaded(MAP_CLUSTER_SOURCE_ID)) {
			return;
		}

		let source: MapLibreGeoJSONSource | null;

		try {
			source = getMapClusterSource(map);
		} catch (error) {
			reportError(toMapError(error, 'Failed to read MapLibre cluster source.'));
			clearVisibleState();
			return;
		}

		if (!source) {
			clearVisibleState();
			return;
		}

		let queriedFeatures: MapLibreMapGeoJSONFeature[];

		try {
			queriedFeatures = map.queryRenderedFeatures({ layers: [MAP_CLUSTER_LAYER_ID] });
		} catch (error) {
			reportError(toMapError(error, 'Failed to query visible MapLibre cluster features.'));
			return;
		}

		const nextRefreshVersion = refreshVersion + 1;
		refreshVersion = nextRefreshVersion;
		const visibleFeatures = groupVisibleMapFeatures(
			queriedFeatures,
			normalizedMarkers.markerLookup
		);

		void resolveVisibleClusterMarkers(
			source,
			visibleFeatures.clusterFeatures,
			visibleFeatures.pointMarkers,
			normalizedMarkers.markerLookup,
			nextRefreshVersion
		).catch((error) => {
			reportError(toMapError(error, 'Failed to resolve visible map clusters.'));
		});
	}

	async function resolveVisibleClusterMarkers(
		source: MapLibreGeoJSONSource,
		clusterFeatures: MapLibreMapGeoJSONFeature[],
		pointMarkers: MapMarker<TData>[],
		markerLookup: Map<string, MapMarker<TData>>,
		nextRefreshVersion: number
	): Promise<void> {
		const clusterMarkers = await resolveMapClusterRenderArgs({
			map,
			source,
			clusterFeatures,
			markerLookup,
			isCurrent: () => mounted && nextRefreshVersion === refreshVersion,
			createExpand: (clusterId: number, coordinates: [number, number]) =>
				createMapClusterExpand({
					map,
					clusterId,
					coordinates,
					isCurrent: () => mounted,
					reportError,
					toError: toMapError
				}),
			reportError,
			toError: toMapError
		});

		if (!mounted || nextRefreshVersion !== refreshVersion) {
			return;
		}

		visiblePointMarkers = pointMarkers;
		visibleClusterMarkers = clusterMarkers;
	}

	function handleStyleData(): void {
		if (mounted) syncSourceAndLayer();
	}

	function handleSourceData(event: MapLibreMapSourceDataEvent): void {
		if (event.sourceId === MAP_CLUSTER_SOURCE_ID && event.isSourceLoaded) refreshVisibleFeatures();
	}

	onMount(() => {
		mounted = true;
		map.on('load', handleStyleData);
		map.on('styledata', handleStyleData);
		map.on('idle', handleStyleData);
		map.on('sourcedata', handleSourceData);
		const unbindLiveRefreshEvents = bindLiveMapRefreshEvents(map, liveRefresh);
		syncSourceAndLayer();

		return () => {
			mounted = false;
			map.off('load', handleStyleData);
			map.off('styledata', handleStyleData);
			map.off('idle', handleStyleData);
			map.off('sourcedata', handleSourceData);
			unbindLiveRefreshEvents();
			clearVisibleState();
			removeMapClusterSourceAndLayer(map);
		};
	});

	$effect(() => {
		void normalizedMarkers;
		void clusterConfig;
		untrack(syncSourceAndLayer);
	});
</script>

{#each visibleClusterMarkers as clusterArg (clusterArg.id)}
	<MapClusterNode
		{map}
		{Marker}
		cluster={clusterArg}
		content={clusterContent}
		zoomOnClick={clusterConfig.zoomOnClick}
		{onClusterClick}
		{onError}
	/>
{/each}
{#each visiblePointMarkers as mapMarker (String(mapMarker.id))}
	<MapMarkerNode
		{map}
		{Marker}
		marker={mapMarker}
		content={markerContent}
		{popup}
		{tooltip}
		{onMarkerClick}
	/>
{/each}
