<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { toMapLibreColor } from './map-css-color.js';
	import { reportMapError, toMapError } from './map-errors.js';
	import { removeAllMapShapes, syncMapShapeSourcesAndLayers } from './map-shape-sync.js';
	import { normalizeMapShapes } from './map-shapes.js';
	import type { MapShape } from './map-types.js';
	import type { MapLibreMap } from './maplibre-types.js';

	type Props = {
		map: MapLibreMap;
		shapes?: MapShape[];
		onError?: (error: Error) => void;
	};

	let { map, shapes, onError }: Props = $props();

	let mounted = false;
	const appliedSignatures = new Map<string, string>();

	function getDefaultColor(): string {
		const element = document.createElement('span');
		element.style.color = 'color-mix(in srgb, var(--primary) 100%, transparent)';
		document.body.append(element);

		const color = toMapLibreColor(getComputedStyle(element).color);
		element.remove();

		return color ?? '#0f172a';
	}

	function reportError(error: Error): void {
		reportMapError(error, onError);
	}

	function syncShapes(): void {
		if (!map.isStyleLoaded()) {
			return;
		}

		try {
			const normalizedShapes = normalizeMapShapes(shapes, {
				defaultColor: getDefaultColor(),
				reportError
			});
			syncMapShapeSourcesAndLayers(map, normalizedShapes, appliedSignatures);
		} catch (error) {
			reportError(toMapError(error, 'Failed to synchronize MapLibre shapes.'));
			removeAllMapShapes(map, appliedSignatures);
		}
	}

	function handleStyleData(): void {
		if (mounted) {
			syncShapes();
		}
	}

	onMount(() => {
		mounted = true;
		map.on('load', handleStyleData);
		map.on('styledata', handleStyleData);
		map.on('idle', handleStyleData);
		syncShapes();

		return () => {
			mounted = false;
			map.off('load', handleStyleData);
			map.off('styledata', handleStyleData);
			map.off('idle', handleStyleData);
			removeAllMapShapes(map, appliedSignatures);
		};
	});

	$effect(() => {
		void shapes;
		untrack(syncShapes);
	});
</script>
