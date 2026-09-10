<script lang="ts">
	import { untrack } from 'svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import OoxmlUnit from './OoxmlUnit.svelte';
	import { getDocumentUnitAtReadingPosition } from './documentPageTracking.js';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import { getOoxmlNaturalSize, type DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		surface: () => string;
		ooxmlPage: () => string;
		ooxmlCanvas: () => string;
		ooxmlTextLayer: () => string;
	};

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
	let previousUnitSizes: typeof unitSizes | undefined;

	const model = $derived(viewer.model?.kind === 'ooxml' ? viewer.model : null);
	const isPresentation = $derived(model?.format === 'pptx');
	const isHorizontal = $derived(
		viewer.mode === 'scroll' && viewer.unit === 'page' && viewer.orientation === 'horizontal'
	);
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
	const applyFit = () => {
		if (!container || !fitSize || !viewer.fit) return;
		const availableWidth = Math.max(1, container.clientWidth - 32);
		const widthScale = availableWidth / fitSize.width;
		if (viewer.fit === 'width') {
			viewer.setScaleFromSurface(widthScale);
		} else {
			const availableHeight = Math.max(1, container.clientHeight - 32);
			viewer.setScaleFromSurface(Math.min(widthScale, availableHeight / fitSize.height));
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
			const hasWidthChange = Math.abs(width - observedWidth) >= 0.5;
			const observesHeight = viewer.fit === 'page';
			const hasHeightChange = observesHeight && Math.abs(height - observedHeight) >= 0.5;
			if (!hasWidthChange && !hasHeightChange) return;
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
		viewer.fit;
		viewer.page;
		viewer.mode;
		viewer.orientation;
		model;
		untrack(applyFit);
	});

	$effect(() => {
		const mode = viewer.mode;
		const page = viewer.page;
		const orientation = viewer.orientation;
		const currentUnitSizes = unitSizes;
		const hasModeChanged = mode !== previousMode;
		const hasOrientationChanged = orientation !== previousOrientation;
		const hasDocumentChanged = currentUnitSizes !== previousUnitSizes;
		previousMode = mode;
		previousOrientation = orientation;
		previousUnitSizes = currentUnitSizes;
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
</script>

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
						root={container}
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
						root={container}
						virtualized
						horizontal={isHorizontal}
						{classes}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</ScrollArea>
