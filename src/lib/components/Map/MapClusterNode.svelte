<script lang="ts" generics="TData = unknown">
	import type { Snippet } from 'svelte';
	import { fromAction, type Attachment } from 'svelte/attachments';
	import { cx as cn } from '$lib/utils/cva/index.js';
	import { removeMapClusterHull, syncMapClusterHull } from './map-cluster-hull.js';
	import { toMapError } from './map-errors.js';
	import type { MapClusterSnippetArg } from './map-types.js';
	import type { MapLibreMap, MapLibreMarker, MapLibreMarkerConstructor } from './maplibre-types.js';

	type Props<TData = unknown> = {
		map: MapLibreMap;
		Marker: MapLibreMarkerConstructor;
		cluster: MapClusterSnippetArg<TData>;
		content?: Snippet<[MapClusterSnippetArg<TData>]>;
		zoomOnClick: boolean;
		onClusterClick?: (cluster: MapClusterSnippetArg<TData>) => void;
		onError?: (error: Error) => void;
	};

	type ClusterMarkerAttachmentParams = {
		map: MapLibreMap;
		Marker: MapLibreMarkerConstructor;
		lngLat: [number, number];
	};

	let { map, Marker, cluster, content, zoomOnClick, onClusterClick, onError }: Props<TData> =
		$props();

	let lngLat = $derived(cluster.coordinates);
	let defaultClusterClass = $derived(getDefaultClusterClass(cluster.count));

	function getDefaultClusterClass(count: number): string {
		if (count >= 100) {
			return 'size-14 bg-danger text-danger-contrast ring-danger/25';
		}

		if (count >= 25) {
			return 'size-12 bg-primary text-primary-contrast ring-primary/25';
		}

		return 'size-10 bg-surface text-neutral ring-primary/30';
	}

	function handleClusterClick(event: MouseEvent): void {
		event.stopPropagation();
		onClusterClick?.(cluster);

		if (zoomOnClick) {
			cluster.expand();
		}
	}

	function handleClusterMouseEnter(): void {
		try {
			syncMapClusterHull(map, cluster.markers);
		} catch (error) {
			onError?.(toMapError(error, 'Failed to draw map cluster hull.'));
		}
	}

	function handleClusterMouseLeave(): void {
		try {
			removeMapClusterHull(map);
		} catch (error) {
			onError?.(toMapError(error, 'Failed to clear map cluster hull.'));
		}
	}

	function resetMarkerRootAccessibility(markerElement: HTMLElement): void {
		markerElement.removeAttribute('aria-label');
		markerElement.removeAttribute('role');
		markerElement.removeAttribute('tabindex');
	}

	function createClusterMarker(
		node: HTMLDivElement,
		params: ClusterMarkerAttachmentParams
	): MapLibreMarker {
		const markerInstance = new params.Marker({ element: node, anchor: 'center' })
			.setLngLat(params.lngLat)
			.addTo(params.map);
		resetMarkerRootAccessibility(node);
		return markerInstance;
	}

	function attachClusterMarkerAction(node: HTMLDivElement, params: ClusterMarkerAttachmentParams) {
		let currentParams = params;
		let markerInstance = createClusterMarker(node, currentParams);

		node.addEventListener('click', handleClusterClick);
		node.addEventListener('mouseenter', handleClusterMouseEnter);
		node.addEventListener('mouseleave', handleClusterMouseLeave);

		return {
			update(nextParams: ClusterMarkerAttachmentParams) {
				const shouldRecreateMarker =
					nextParams.map !== currentParams.map || nextParams.Marker !== currentParams.Marker;

				if (shouldRecreateMarker) {
					markerInstance.remove();
					markerInstance = createClusterMarker(node, nextParams);
				} else {
					markerInstance.setLngLat(nextParams.lngLat);
				}

				currentParams = nextParams;
			},
			destroy() {
				node.removeEventListener('click', handleClusterClick);
				node.removeEventListener('mouseenter', handleClusterMouseEnter);
				node.removeEventListener('mouseleave', handleClusterMouseLeave);
				handleClusterMouseLeave();
				markerInstance.remove();
			}
		};
	}

	const attachClusterMarker: Attachment<HTMLDivElement> = fromAction(
		attachClusterMarkerAction,
		() => ({
			map,
			Marker,
			lngLat
		})
	);
</script>

<div
	{@attach attachClusterMarker}
	data-slot="map-cluster-marker"
	class="flex items-center justify-center"
>
	{#if content}
		{@render content(cluster)}
	{:else}
		<button
			type="button"
			class={cn(
				'flex items-center justify-center rounded-full border-2 border-surface text-sm font-semibold tabular-nums shadow-md ring-4 outline-none transition-transform hover:scale-105 focus-visible:ring-primary',
				defaultClusterClass
			)}
			aria-label={`Cluster of ${cluster.count} markers`}
		>
			{cluster.count}
		</button>
	{/if}
</div>
