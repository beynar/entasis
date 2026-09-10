<script lang="ts">
	import { untrack } from 'svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import { getDocumentUnitAtReadingPosition } from './documentPageTracking.js';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = { surface: () => string; legacyPage: () => string };
	let { viewer, classes }: { viewer: DocumentViewerState; classes: Classes } = $props();
	let container = $state<HTMLDivElement | null>(null);
	let fitFrame = 0;
	let pageSyncFrame = 0;
	let pageScrollFrame = 0;
	let observedWidth = 0;
	let observedHeight = 0;
	let visiblePage = 0;
	let navigationTarget = 0;
	let previousMode: 'scroll' | 'single' | null = null;
	let previousOrientation: 'horizontal' | 'vertical' | null = null;
	let previousModel: typeof model | undefined;
	const model = $derived(viewer.model?.kind === 'legacy' ? viewer.model : null);
	const isSlide = $derived(model?.format === 'ppt');
	const isHorizontal = $derived(
		viewer.mode === 'scroll' && viewer.unit === 'page' && viewer.orientation === 'horizontal'
	);
	const baseWidth = $derived(isSlide ? 960 : 816);
	const baseHeight = $derived(isSlide ? 540 : 1056);

	const applyFit = () => {
		if (!container || !model || !viewer.fit) return;
		const widthScale = Math.max(1, container.clientWidth - 32) / baseWidth;
		if (viewer.fit === 'width') {
			viewer.setScaleFromSurface(widthScale);
		} else {
			const heightScale = Math.max(1, container.clientHeight - 32) / baseHeight;
			viewer.setScaleFromSurface(Math.min(widthScale, heightScale));
		}
	};

	const scheduleFit = () => {
		if (fitFrame) return;
		fitFrame = requestAnimationFrame(() => {
			fitFrame = 0;
			applyFit();
		});
	};

	const syncPageFromScroll = () => {
		pageSyncFrame = 0;
		if (!container || viewer.mode !== 'scroll') return;
		const viewport = container.getBoundingClientRect();
		const closestPage = getDocumentUnitAtReadingPosition(
			visiblePage,
			isHorizontal ? viewport.left : viewport.top,
			isHorizontal ? viewport.width : viewport.height,
			Array.from(container.querySelectorAll<HTMLElement>('[data-document-unit]'), (unit) => {
				const bounds = unit.getBoundingClientRect();
				return {
					unit: Number(unit.dataset.documentUnit),
					start: isHorizontal ? bounds.left : bounds.top,
					end: isHorizontal ? bounds.right : bounds.bottom
				};
			})
		);
		if (!closestPage) return;
		if (navigationTarget) {
			if (closestPage !== navigationTarget) return;
			navigationTarget = 0;
		}
		if (closestPage === visiblePage) return;
		visiblePage = closestPage;
		viewer.goTo(closestPage);
	};

	const schedulePageSync = () => {
		if (pageSyncFrame) return;
		pageSyncFrame = requestAnimationFrame(syncPageFromScroll);
	};

	const scrollToPage = (page: number, behavior: ScrollBehavior) => {
		if (!container) return;
		const target = container.querySelector<HTMLElement>(`[data-document-unit="${page}"]`);
		if (!target) return;
		const viewport = container.getBoundingClientRect();
		const bounds = target.getBoundingClientRect();
		if (isHorizontal) {
			const left = bounds.left - viewport.left + container.scrollLeft;
			const targetLeft = Math.max(0, left - (container.clientWidth - bounds.width) / 2);
			if (Math.abs(container.scrollLeft - targetLeft) < 0.5) return;
			navigationTarget = page;
			container.scrollTo({
				left: targetLeft,
				behavior
			});
			return;
		}
		const top = bounds.top - viewport.top + container.scrollTop;
		const targetTop = Math.max(0, top - (container.clientHeight - bounds.height) / 2);
		if (Math.abs(container.scrollTop - targetTop) < 0.5) return;
		navigationTarget = page;
		container.scrollTo({
			top: targetTop,
			behavior
		});
	};

	$effect(() => {
		const node = container;
		if (!node) return;
		const observer = new ResizeObserver(([entry]) => {
			const width = entry?.contentRect.width ?? 0;
			const height = entry?.contentRect.height ?? 0;
			if (Math.abs(width - observedWidth) < 0.5 && Math.abs(height - observedHeight) < 0.5) {
				return;
			}
			observedWidth = width;
			observedHeight = height;
			scheduleFit();
		});
		observer.observe(node);
		const cancelNavigation = () => {
			navigationTarget = 0;
		};
		node.addEventListener('wheel', cancelNavigation, { passive: true });
		node.addEventListener('pointerdown', cancelNavigation);
		node.addEventListener('keydown', cancelNavigation);
		scheduleFit();
		return () => {
			cancelAnimationFrame(fitFrame);
			cancelAnimationFrame(pageSyncFrame);
			cancelAnimationFrame(pageScrollFrame);
			fitFrame = 0;
			pageSyncFrame = 0;
			pageScrollFrame = 0;
			observedWidth = 0;
			observedHeight = 0;
			navigationTarget = 0;
			node.removeEventListener('wheel', cancelNavigation);
			node.removeEventListener('pointerdown', cancelNavigation);
			node.removeEventListener('keydown', cancelNavigation);
			observer.disconnect();
		};
	});

	$effect(() => {
		model;
		viewer.fit;
		viewer.orientation;
		untrack(applyFit);
	});

	$effect(() => {
		const mode = viewer.mode;
		const page = viewer.page;
		const orientation = viewer.orientation;
		const currentModel = model;
		const hasModeChanged = mode !== previousMode;
		const hasOrientationChanged = orientation !== previousOrientation;
		const hasDocumentChanged = currentModel !== previousModel;
		previousMode = mode;
		previousOrientation = orientation;
		previousModel = currentModel;
		if (mode !== 'scroll') {
			navigationTarget = 0;
			visiblePage = page;
			return;
		}
		if (!hasModeChanged && !hasOrientationChanged && !hasDocumentChanged && page === visiblePage) {
			return;
		}
		visiblePage = page;
		cancelAnimationFrame(pageScrollFrame);
		pageScrollFrame = requestAnimationFrame(() => {
			pageScrollFrame = 0;
			scrollToPage(
				page,
				hasModeChanged || hasOrientationChanged || hasDocumentChanged ? 'auto' : 'smooth'
			);
		});
	});

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
		aria-label="{viewer.unit === 'slide' ? 'Slide' : 'Page'} {index + 1}"
	>
		{#if unit.title}
			<h2 class="mb-6 text-2xl font-semibold">{unit.title}</h2>
		{/if}
		{#each segments as segment}
			{#if segment.match}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
		{/each}
	</article>
{/snippet}

<ScrollArea
	bind:viewportRef={container}
	class={classes.surface()}
	type="hover"
	ariaLabel={viewer.unit === 'slide' ? 'Document slides' : 'Document pages'}
	onscroll={schedulePageSync}
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
				{#each model.units as unit, index}
					{@render documentUnit(unit, index)}
				{/each}
			</div>
		{/if}
	{/if}
</ScrollArea>
