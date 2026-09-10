<script lang="ts" module>
	export type { MapMarker } from './map-data.js';
	export type * from './map-types.js';
</script>

<script lang="ts" generics="TData = unknown">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { useMapTheme } from './map.theme.js';
	import MapContent from './MapContent.svelte';
	import MapShapeLayer from './MapShapeLayer.svelte';
	import MapSkeleton from './MapSkeleton.svelte';
	import MapViewport from './MapViewport.svelte';
	import { resolveMapClusterConfig } from './map-cluster.js';
	import { normalizeMapMarkers } from './map-data.js';
	import { reportMapError, toMapError } from './map-errors.js';
	import { applyMapInteractivity, getMapInteractionOptions } from './map-interactivity.js';
	import {
		DEFAULT_MAP_CENTER,
		DEFAULT_MAP_ZOOM,
		resolveDefaultMapTheme,
		resolveMapStyle
	} from './map-theme.js';
	import { bindMapStyleTokenChanges } from './map-token-style.js';
	import { bindMapViewEvents } from './map-view-events.js';
	import { getMapMarkerBounds, normalizeMapBounds } from './map-viewport.js';
	import { loadMapLibreFromCdn } from './maplibre-cdn.js';
	import type { NormalizedMapMarkers } from './map-data.js';
	import type { MapProps } from './map.props.js';
	import type {
		MapLibreErrorEvent,
		MapLibreMap,
		MapLibreMapOptions,
		MapLibreMarkerConstructor
	} from './maplibre-types.js';

	let {
		markers,
		styleUrl,
		styles,
		center = DEFAULT_MAP_CENTER,
		zoom = DEFAULT_MAP_ZOOM,
		bounds,
		minZoom,
		maxZoom,
		fitMarkersOnMount,
		fitMarkersPadding,
		interactive,
		showAttribution = true,
		cluster,
		controls = true,
		controlPosition,
		geolocation,
		userLocationMarker,
		marker,
		clusterMarker,
		controlButton,
		popup,
		tooltip,
		shapes,
		onMarkerClick,
		onClusterClick,
		onReady,
		onViewChange,
		onMoveEnd,
		onZoomEnd,
		onError,
		size = 'normal',
		theme: mapTheme,
		class: className,
		...rest
	}: MapProps<TData> = $props();

	const theme = useTheme();
	const classes = $derived(useMapTheme(mapTheme));

	let container: HTMLDivElement | null = null;
	let map = $state.raw<MapLibreMap | null>(null);
	let MarkerConstructor = $state.raw<MapLibreMarkerConstructor | null>(null);
	let isMapLoaded = $state(false);
	// Surfaced when the map fails to create (e.g. MapLibre CDN unreachable) so the
	// skeleton doesn't hang forever with no indication of what went wrong.
	let loadError = $state<Error | null>(null);
	let attachmentId = 0;
	let appliedStyleSignature: string | undefined;
	let styleRequestId = 0;
	let normalizedMarkers: NormalizedMapMarkers<TData> = $derived(normalizeMapMarkers(markers));
	let markerNodes = $derived(Array.from(normalizedMarkers.markerLookup.values()));
	let markerBounds = $derived(getMapMarkerBounds(markerNodes));
	let normalizedBounds = $derived(bounds ? normalizeMapBounds(bounds) : null);
	let resolvedMapTheme = $derived(resolveDefaultMapTheme(theme.resolvedTheme === 'dark'));
	let clusterConfig = $derived(resolveMapClusterConfig(cluster));

	function reportError(error: Error): void {
		reportMapError(error, onError);
	}

	function handleMapError(event: MapLibreErrorEvent | { error?: unknown }): void {
		const payload = event && typeof event === 'object' && 'error' in event ? event.error : event;
		reportError(toMapError(payload, 'MapLibre emitted a non-Error error payload.'));
	}

	async function createMap(node: HTMLDivElement, currentAttachmentId: number): Promise<void> {
		if (container !== node || currentAttachmentId !== attachmentId || map) {
			return;
		}
		loadError = null;

		try {
			const [maplibre, initialStyle] = await Promise.all([
				loadMapLibreFromCdn(),
				resolveMapStyle(resolvedMapTheme, node, styleUrl, styles)
			]);
			if (container !== node || currentAttachmentId !== attachmentId || map) {
				return;
			}

			MarkerConstructor = maplibre.Marker;
			const mapOptions: MapLibreMapOptions = {
				container: node,
				style: initialStyle.style,
				center,
				zoom,
				minZoom,
				maxZoom,
				attributionControl: showAttribution ? {} : false,
				...getMapInteractionOptions(interactive)
			};
			const mapInstance = new maplibre.Map(mapOptions);

			mapInstance.on('error', handleMapError);
			mapInstance.on('load', () => {
				if (container !== node || currentAttachmentId !== attachmentId || map !== mapInstance) {
					return;
				}

				isMapLoaded = true;
				onReady?.(mapInstance);
			});

			appliedStyleSignature = initialStyle.signature;
			map = mapInstance;
		} catch (error) {
			if (container !== node || currentAttachmentId !== attachmentId) {
				return;
			}

			const mapError = toMapError(error, 'Failed to create MapLibre map.');
			loadError = mapError;
			reportError(mapError);
		}
	}

	async function applyResolvedStyle(): Promise<void> {
		if (!map || !container) return;
		const requestId = ++styleRequestId;
		const mapInstance = map;
		const node = container;

		try {
			const nextStyle = await resolveMapStyle(resolvedMapTheme, node, styleUrl, styles);
			if (
				map !== mapInstance ||
				container !== node ||
				requestId !== styleRequestId ||
				appliedStyleSignature === nextStyle.signature
			) {
				return;
			}
			mapInstance.setStyle(nextStyle.style);
			appliedStyleSignature = nextStyle.signature;
		} catch (error) {
			if (map !== mapInstance || container !== node || requestId !== styleRequestId) {
				return;
			}

			reportError(toMapError(error, 'Failed to apply MapLibre map style.'));
		}
	}

	function removeMap(): void {
		map?.remove();
		map = null;
		MarkerConstructor = null;
		isMapLoaded = false;
	}

	const attachMap: Attachment<HTMLDivElement> = (node) => {
		return untrack(() => {
			const currentAttachmentId = ++attachmentId;
			const removeStyleTokenBinding = bindMapStyleTokenChanges(
				node,
				() => void applyResolvedStyle()
			);
			container = node;
			void createMap(node, currentAttachmentId);

			return () => {
				if (currentAttachmentId !== attachmentId) {
					return;
				}

				attachmentId += 1;
				styleRequestId += 1;
				removeStyleTokenBinding();
				container = null;
				removeMap();
			};
		});
	};

	$effect(() => {
		void resolvedMapTheme;
		void styleUrl;
		void styles;
		void applyResolvedStyle();
	});

	$effect(() => {
		if (!map || (!onViewChange && !onMoveEnd && !onZoomEnd)) {
			return;
		}

		return bindMapViewEvents(map, {
			onViewChange,
			onMoveEnd,
			onZoomEnd
		});
	});

	$effect(() => {
		if (!map) {
			return;
		}

		applyMapInteractivity(map, interactive);
	});
</script>

<div
	{@attach attachMap}
	data-slot="map"
	class={classes.root({ size, interactive: interactive !== false, className })}
	{...rest}
>
	{#if loadError}
		<div
			role="alert"
			class="text-danger bg-surface absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm"
		>
			{loadError.message}
		</div>
	{:else if !isMapLoaded}
		<MapSkeleton />
	{/if}

	{#if map}
		<MapShapeLayer {map} {shapes} {onError} />
		<MapViewport
			{map}
			{isMapLoaded}
			{center}
			{zoom}
			{minZoom}
			{maxZoom}
			bounds={normalizedBounds}
			{markerBounds}
			{fitMarkersOnMount}
			{fitMarkersPadding}
		/>
	{/if}

	{#if map && MarkerConstructor}
		<MapContent
			{map}
			Marker={MarkerConstructor}
			{normalizedMarkers}
			markers={markerNodes}
			{clusterConfig}
			{controls}
			{controlPosition}
			{geolocation}
			{center}
			{zoom}
			bounds={normalizedBounds}
			{fitMarkersPadding}
			{marker}
			{popup}
			{tooltip}
			{clusterMarker}
			{userLocationMarker}
			{controlButton}
			{onMarkerClick}
			{onClusterClick}
			{onError}
		/>
	{/if}
</div>
