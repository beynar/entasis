<script lang="ts">
	import { untrack } from 'svelte';
	import {
		createDocumentSurfaceViewport,
		type DocumentSurfaceFitSize,
		type DocumentSurfaceViewportHost
	} from './documentViewer.surfaceViewport.svelte.js';
	import type {
		DocumentFitMode,
		DocumentOrientation,
		DocumentUnit,
		DocumentViewMode
	} from './documentViewer.props.js';

	let {
		unit = 'page',
		fit = 'width',
		mode = 'scroll',
		orientation = 'vertical',
		page = 1,
		pages = 3,
		fitSize = { width: 800, height: 1000 },
		documentKey = 'document',
		observesHeight,
		goTo = () => {},
		setScaleFromSurface = () => {},
		onsurface
	}: {
		unit?: DocumentUnit | null;
		fit?: DocumentFitMode;
		mode?: DocumentViewMode;
		orientation?: DocumentOrientation;
		page?: number;
		pages?: number;
		fitSize?: DocumentSurfaceFitSize | null;
		documentKey?: unknown;
		observesHeight?: () => boolean;
		goTo?: (page: number) => void;
		setScaleFromSurface?: (scale: number) => void;
		onsurface: (surface: ReturnType<typeof createDocumentSurfaceViewport>) => void;
	} = $props();

	const host: DocumentSurfaceViewportHost = {
		get unit() {
			return unit;
		},
		get fit() {
			return fit;
		},
		get mode() {
			return mode;
		},
		get orientation() {
			return orientation;
		},
		get page() {
			return page;
		},
		goTo: (value) => goTo(value),
		setScaleFromSurface: (value) => setScaleFromSurface(value)
	};

	const surface = createDocumentSurfaceViewport(() => host, {
		getFitSize: () => fitSize,
		getDocumentKey: () => documentKey,
		get observesHeight() {
			return observesHeight;
		}
	});
	untrack(() => onsurface(surface));
	const units = $derived(Array.from({ length: pages }, (_, index) => index + 1));
</script>

<div bind:this={surface.container} data-testid="viewport">
	{#each units as unit (unit)}
		<div data-document-unit={unit}></div>
	{/each}
</div>
