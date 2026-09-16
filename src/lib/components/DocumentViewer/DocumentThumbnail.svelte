<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotValue } from '../Slot/slot.js';
	import type { DocumentThumbnailPayload } from './documentViewer.props.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		thumbnail: (options?: { className?: string }) => string;
		thumbnailActive: () => string;
		thumbnailPreview: () => string;
		thumbnailCanvas: () => string;
	};

	let {
		viewer,
		index,
		classes,
		thumbnail
	}: {
		viewer: DocumentViewerState;
		index: number;
		classes: Classes;
		thumbnail?: SlotValue<DocumentThumbnailPayload>;
	} = $props();

	let button = $state<HTMLButtonElement | null>(null);
	const t = $derived(useI18n());
	let canvas = $state<HTMLCanvasElement | null>(null);
	let isVisible = $state(false);
	let renderError = $state(false);
	let renderedAspectRatio = $state<number | null>(null);
	const isActive = $derived(viewer.page === index);
	const legacyUnit = $derived(
		viewer.model?.kind === 'legacy' ? viewer.model.units[index - 1] : undefined
	);
	const previewAspectRatio = $derived(
		renderedAspectRatio ?? (viewer.unit === 'slide' ? 16 / 9 : 3 / 4)
	);

	const observe: Attachment<HTMLButtonElement> = (node) => {
		button = node;
		if (typeof IntersectionObserver === 'undefined') {
			isVisible = true;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) isVisible = true;
			},
			{ rootMargin: '160px 0px' }
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			button = null;
		};
	};

	$effect(() => {
		void viewer.model;
		const revision = viewer.surfaceRevision;
		const shouldRender = isVisible;
		const target = canvas;
		untrack(() => {
			renderedAspectRatio = null;
			if (!shouldRender || !target || legacyUnit) return;
			renderError = false;
			void viewer
				.renderThumbnail(target, index, 128)
				.then(() => {
					if (revision !== viewer.surfaceRevision || !target.width || !target.height) return;
					renderedAspectRatio = target.width / target.height;
				})
				.catch(() => {
					renderError = true;
				});
		});
	});

	$effect(() => {
		if (!isActive) return;
		untrack(() => {
			if (typeof button?.scrollIntoView === 'function') {
				button.scrollIntoView({ block: 'nearest' });
			}
		});
	});
</script>

<button
	bind:this={button}
	type="button"
	class={classes.thumbnail({ className: isActive ? classes.thumbnailActive() : undefined })}
	aria-label={`${t.goTo} ${viewer.unit === 'slide' ? t.slide : t.page} ${index}`}
	aria-current={isActive ? 'page' : undefined}
	onclick={() => viewer.goTo(index)}
	{@attach observe}
>
	<Slot render={thumbnail} payload={{ viewer, index }}>
		<div class={classes.thumbnailPreview()} style:aspect-ratio={previewAspectRatio}>
			{#if legacyUnit}
				<div class="line-clamp-[14] w-full overflow-hidden">
					{#if legacyUnit.title}<strong>{legacyUnit.title}</strong><br />{/if}
					{legacyUnit.text}
				</div>
			{:else if renderError}
				<span class="text-danger-readable m-auto text-center">Preview unavailable</span>
			{:else}
				<canvas bind:this={canvas} class={classes.thumbnailCanvas()} aria-hidden="true"></canvas>
			{/if}
		</div>
	</Slot>
	<span>{index}</span>
</button>
