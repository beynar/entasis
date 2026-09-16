<script lang="ts">
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import { createDocumentSurfaceViewport } from './documentViewer.surfaceViewport.svelte.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Classes = { surface: () => string; legacyPage: () => string };
	let { viewer, classes }: { viewer: DocumentViewerState; classes: Classes } = $props();
	const t = $derived(useI18n());
	const model = $derived(viewer.model?.kind === 'legacy' ? viewer.model : null);
	const isSlide = $derived(model?.format === 'ppt');
	const baseWidth = $derived(isSlide ? 960 : 816);
	const baseHeight = $derived(isSlide ? 540 : 1056);

	const surface = createDocumentSurfaceViewport(() => viewer, {
		getFitSize: () => (model ? { width: baseWidth, height: baseHeight } : null),
		getDocumentKey: () => model
	});
	const isHorizontal = $derived(surface.isHorizontal);

	const getSegments = (text: string) => {
		const query = viewer.query.trim();
		if (!query) return [{ text, match: false }];
		const needle = query.toLowerCase();
		const parts: Array<{ text: string; match: boolean }> = [];
		let offset = 0;
		for (;;) {
			const index = text.toLowerCase().indexOf(needle, offset);
			if (index === -1) break;
			if (index > offset) parts.push({ text: text.slice(offset, index), match: false });
			parts.push({ text: text.slice(index, index + query.length), match: true });
			offset = index + query.length;
		}
		if (offset < text.length) parts.push({ text: text.slice(offset), match: false });
		return parts.length ? parts : [{ text, match: false }];
	};
</script>

{#snippet documentUnit(unit: { title?: string; text: string }, index: number)}
	{@const segments = getSegments(unit.text)}
	<article
		class={classes.legacyPage()}
		style:width="{Math.round(baseWidth * viewer.scale)}px"
		style:min-height="{Math.round(baseHeight * viewer.scale)}px"
		style:font-size="{viewer.scale}em"
		data-document-unit={index + 1}
		aria-label={viewer.unit === 'slide' ? t.slideIndex(index + 1) : t.pageIndex(index + 1)}
	>
		{#if unit.title}
			<h2 class="mb-6 text-2xl font-semibold">{unit.title}</h2>
		{/if}
		{#each segments as segment, segmentIndex (segmentIndex)}
			{#if segment.match}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
		{/each}
	</article>
{/snippet}

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
			<div
				class="flex min-h-full min-w-full justify-center p-4 {isSlide
					? 'items-center'
					: 'items-start'}"
			>
				{#if model.units[viewer.page - 1]}
					{@render documentUnit(model.units[viewer.page - 1], viewer.page - 1)}
				{/if}
			</div>
		{:else}
			<div
				class="flex gap-4 p-4 {isHorizontal
					? 'h-full w-max flex-row items-start'
					: 'min-w-full flex-col items-center'}"
			>
				{#each model.units as unit, index (index)}
					{@render documentUnit(unit, index)}
				{/each}
			</div>
		{/if}
	{/if}
</ScrollArea>
