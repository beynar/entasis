<script lang="ts" generics="TData = unknown">
	import type { Snippet } from 'svelte';
	import MapClusterLayer from './MapClusterLayer.svelte';
	import MapControl from './MapControl.svelte';
	import MapMarkerNode from './MapMarkerNode.svelte';
	import MapUserLocationMarker from './MapUserLocationMarker.svelte';
	import type { ResolvedMapClusterConfig } from './map-cluster.js';
	import type { MapMarker, NormalizedMapMarkers } from './map-data.js';
	import {
		getCurrentMapUserLocation,
		getMapGeolocationZoom,
		resolveMapGeolocationConfig,
		watchMapUserLocation
	} from './map-geolocation.js';
	import { reportMapError } from './map-errors.js';
	import type {
		MapClusterSnippetArg,
		MapControlAction,
		MapControlButtonSnippetArg,
		MapControlPosition,
		MapGeolocationConfig,
		MapMarkerPopupContentArg,
		MapMarkerSnippetArg,
		MapMarkerTooltipContentArg,
		MapUserLocation,
		MapUserLocationSnippetArg
	} from './map-types.js';
	import type { MapLibreBounds, MapLibreMap, MapLibreMarkerConstructor } from './maplibre-types.js';

	type Props<TData = unknown> = {
		map: MapLibreMap;
		Marker: MapLibreMarkerConstructor;
		normalizedMarkers: NormalizedMapMarkers<TData>;
		markers: MapMarker<TData>[];
		clusterConfig: ResolvedMapClusterConfig;
		controls?: boolean | MapControlAction[];
		controlPosition?: MapControlPosition;
		geolocation?: boolean | MapGeolocationConfig;
		center: [number, number];
		zoom: number;
		bounds: MapLibreBounds | null;
		fitMarkersPadding?: number;
		marker?: Snippet<[MapMarkerSnippetArg<TData>]>;
		popup?: boolean | Snippet<[MapMarkerPopupContentArg<TData>]>;
		tooltip?: boolean | Snippet<[MapMarkerTooltipContentArg<TData>]>;
		clusterMarker?: Snippet<[MapClusterSnippetArg<TData>]>;
		userLocationMarker?: Snippet<[MapUserLocationSnippetArg]>;
		controlButton?: Snippet<[MapControlButtonSnippetArg]>;
		onMarkerClick?: (marker: MapMarker<TData>) => void;
		onClusterClick?: (cluster: MapClusterSnippetArg<TData>) => void;
		onError?: (error: Error) => void;
	};

	let {
		map,
		Marker,
		normalizedMarkers,
		markers,
		clusterConfig,
		controls,
		controlPosition,
		geolocation,
		center,
		zoom,
		bounds,
		fitMarkersPadding,
		marker,
		popup,
		tooltip,
		clusterMarker,
		userLocationMarker,
		controlButton,
		onMarkerClick,
		onClusterClick,
		onError
	}: Props<TData> = $props();

	let userLocation = $state<MapUserLocation | null>(null);
	let geolocationRunId = 0;
	let resolvedControls = $derived<true | MapControlAction[] | null>(
		controls === true || (Array.isArray(controls) && controls.length > 0) ? controls : null
	);
	let geolocationConfig = $derived(resolveMapGeolocationConfig(geolocation));

	function reportGeolocationError(error: Error): void {
		reportMapError(error, onError);
	}

	function handleUserLocationChange(location: MapUserLocation): void {
		userLocation = location;
	}

	function applyUserLocation(location: MapUserLocation): void {
		handleUserLocationChange(location);
		map.easeTo({
			center: location.lngLat,
			zoom: getMapGeolocationZoom(map, geolocationConfig.zoom)
		});
	}

	async function locateAutomatically(runId: number): Promise<void> {
		try {
			const location = await getCurrentMapUserLocation();

			if (runId !== geolocationRunId) {
				return;
			}

			applyUserLocation(location);
		} catch (error) {
			reportGeolocationError(
				error instanceof Error ? error : new Error('Browser geolocation failed.')
			);
		}
	}

	$effect(() => {
		const config = geolocationConfig;
		const runId = ++geolocationRunId;

		if (!config.enabled) {
			return;
		}

		if (!config.watch) {
			void locateAutomatically(runId);
			return;
		}

		return watchMapUserLocation({
			onlocation: applyUserLocation,
			onError: reportGeolocationError
		});
	});
</script>

{#if resolvedControls}
	{#key controlPosition}
		<MapControl
			{map}
			controls={resolvedControls}
			{markers}
			{center}
			{zoom}
			{bounds}
			{fitMarkersPadding}
			{controlPosition}
			{geolocationConfig}
			{controlButton}
			onuserlocationchange={handleUserLocationChange}
			{onError}
		/>
	{/key}
{/if}

{#if userLocation && geolocationConfig.showMarker}
	<MapUserLocationMarker {map} {Marker} location={userLocation} content={userLocationMarker} />
{/if}

{#if !clusterConfig.enabled}
	{#each markers as mapMarker (String(mapMarker.id))}
		<MapMarkerNode
			{map}
			{Marker}
			marker={mapMarker}
			content={marker}
			{popup}
			{tooltip}
			{onMarkerClick}
		/>
	{/each}
{:else}
	<MapClusterLayer
		{map}
		{Marker}
		{normalizedMarkers}
		{clusterConfig}
		markerContent={marker}
		{popup}
		{tooltip}
		clusterContent={clusterMarker}
		{onMarkerClick}
		{onClusterClick}
		{onError}
	/>
{/if}
