<script lang="ts">
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import OoxmlUnit from './OoxmlUnit.svelte';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import { createDocumentSurfaceViewport } from './documentViewer.surfaceViewport.svelte.js';
	import { getOoxmlNaturalSize, type DocumentViewerState } from './documentViewer.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Classes = {
		surface: () => string;
		ooxmlPage: () => string;
		ooxmlCanvas: () => string;
		ooxmlTextLayer: () => string;
	};

	let { viewer, classes }: { viewer: DocumentViewerState; classes: Classes } = $props();
	const t = $derived(useI18n());

	const model = $derived(viewer.model?.kind === 'ooxml' ? viewer.model : null);
	const isPresentation = $derived(model?.format === 'pptx');
	const unitSizes = $derived.by(() =>
		model
			? Array.from({ length: viewer.totalPages }, (_, index) => ({
					index,
					...getOoxmlNaturalSize(model, index)
				}))
			: []
	);
	const activeSize = $derived(unitSizes[viewer.page - 1] ?? unitSizes[0]);
	const fitSize = $derived.by(() => {
		if (viewer.mode !== 'scroll') return activeSize;
		return unitSizes.reduce(
			(largest, unitSize) => ({
				width: Math.max(largest.width, unitSize.width),
				height: Math.max(largest.height, unitSize.height)
			}),
			{ width: 0, height: 0 }
		);
	});

	const surface = createDocumentSurfaceViewport(() => viewer, {
		getFitSize: () => fitSize,
		getDocumentKey: () => unitSizes,
		observesHeight: () => viewer.fit === 'page'
	});
	const isHorizontal = $derived(surface.isHorizontal);
</script>

<ScrollArea
	bind:viewportRef={surface.container}
	class={classes.surface()}
	type="hover"
	label={viewer.unit === 'slide' ? t.documentSlides : t.documentPages}
	onscroll={surface.schedulePageSync}
	theme={documentViewerScrollAreaTheme}
>
	{#if model}
		{#if viewer.mode === 'single'}
			{@const unitSize = unitSizes[viewer.page - 1] ?? unitSizes[0]}
			{#if unitSize}
				<div
					class="flex min-h-full min-w-full justify-center p-4 {isPresentation
						? 'items-center'
						: 'items-start'}"
				>
					<OoxmlUnit
						{viewer}
						{model}
						index={unitSize.index}
						width={Math.max(1, Math.round(unitSize.width * viewer.scale))}
						height={Math.max(1, Math.round(unitSize.height * viewer.scale))}
						root={surface.container}
						{classes}
					/>
				</div>
			{/if}
		{:else}
			<div
				class="flex gap-4 p-4 {isHorizontal
					? 'h-full w-max flex-row items-start'
					: 'min-w-full flex-col items-center'}"
			>
				{#each unitSizes as unitSize (unitSize.index)}
					<OoxmlUnit
						{viewer}
						{model}
						index={unitSize.index}
						width={Math.max(1, Math.round(unitSize.width * viewer.scale))}
						height={Math.max(1, Math.round(unitSize.height * viewer.scale))}
						root={surface.container}
						virtualized
						horizontal={isHorizontal}
						{classes}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</ScrollArea>
