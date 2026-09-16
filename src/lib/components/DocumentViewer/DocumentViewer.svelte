<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { warningIcon } from '../Icons/warning.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import Slot from '../Slot/Slot.svelte';
	import DocumentThumbnail from './DocumentThumbnail.svelte';
	import DocumentToolbar from './DocumentToolbar.svelte';
	import LegacySurface from './LegacySurface.svelte';
	import OoxmlSurface from './OoxmlSurface.svelte';
	import PDFSurface from './PDFSurface.svelte';
	import SheetTabs from './SheetTabs.svelte';
	import SpreadsheetSurface from './SpreadsheetSurface.svelte';
	import type { DocumentViewerProps } from './documentViewer.props.js';
	import { DocumentViewerState } from './documentViewer.state.svelte.js';
	import { documentViewerScrollAreaTheme, useDocumentViewerTheme } from './documentViewer.theme.js';

	let {
		ref = $bindable(null),
		src,
		format,
		fileName,
		page = $bindable(1),
		sheet = $bindable(1),
		scale = $bindable(1),
		rotation = $bindable(0),
		totalPages = $bindable(0),
		minScale = 0.5,
		maxScale = 3,
		fit = $bindable('width'),
		mode = $bindable('scroll'),
		orientation = $bindable('vertical'),
		pageTransition = true,
		password,
		downloadFileName,
		controls = [
			'sidebar',
			'navigation',
			'pageInfo',
			'zoom',
			'fit',
			'mode',
			'orientation',
			'rotate',
			'search',
			'download',
			'print'
		],
		toolbarPosition = 'top',
		sidebar = true,
		sheetTabs = true,
		assets,
		size = 'normal',
		color = 'neutral',
		onLoad,
		onError,
		onWarning,
		onPageChange,
		onSheetChange,
		thumbnail,
		toolbar,
		error,
		class: className,
		theme,
		...attachments
	}: DocumentViewerProps = $props();

	const viewer = new DocumentViewerState({
		get src() {
			return src;
		},
		get requestedFormat() {
			return format;
		},
		get fileName() {
			return fileName;
		},
		get page() {
			return page;
		},
		set page(value) {
			page = value;
		},
		get sheet() {
			return sheet;
		},
		set sheet(value) {
			sheet = value;
		},
		get scale() {
			return scale;
		},
		set scale(value) {
			scale = value;
		},
		get rotation() {
			return rotation;
		},
		set rotation(value) {
			rotation = value;
		},
		get totalPages() {
			return totalPages;
		},
		set totalPages(value) {
			totalPages = value;
		},
		get fit() {
			return fit;
		},
		set fit(value) {
			fit = value;
		},
		get mode() {
			return mode;
		},
		set mode(value) {
			mode = value;
		},
		get orientation() {
			return orientation;
		},
		set orientation(value) {
			orientation = value;
		},
		get password() {
			return password;
		},
		get minScale() {
			return minScale;
		},
		get maxScale() {
			return maxScale;
		},
		get downloadFileName() {
			return downloadFileName;
		},
		get assets() {
			return assets;
		},
		get onLoad() {
			return onLoad;
		},
		get onError() {
			return onError;
		},
		get onWarning() {
			return onWarning;
		},
		get onPageChange() {
			return onPageChange;
		},
		get onSheetChange() {
			return onSheetChange;
		}
	});

	const classes = $derived(useDocumentViewerTheme(theme));
	const t = $derived(useI18n());
	let isSidebarOpen = $derived(sidebar);

	const zoomGestures = (node: HTMLElement) =>
		untrack(() => {
			const pointers = new SvelteMap<number, PointerEvent>();
			let startDistance = 0;
			let startScale = 1;
			const distance = () => {
				const [first, second] = [...pointers.values()];
				return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
			};
			const onWheel = (event: WheelEvent) => {
				if ((!event.ctrlKey && !event.metaKey) || !viewer.capabilities.zoom) return;
				event.preventDefault();
				viewer.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1);
			};
			const onPointerDown = (event: PointerEvent) => {
				pointers.set(event.pointerId, event);
				if (pointers.size === 2) {
					startDistance = distance();
					startScale = viewer.scale;
				}
			};
			const onPointerMove = (event: PointerEvent) => {
				if (!pointers.has(event.pointerId)) return;
				pointers.set(event.pointerId, event);
				if (pointers.size === 2 && startDistance) {
					event.preventDefault();
					viewer.setZoom((startScale * distance()) / startDistance);
				}
			};
			const onPointerUp = (event: PointerEvent) => {
				pointers.delete(event.pointerId);
				if (pointers.size < 2) startDistance = 0;
			};
			node.addEventListener('wheel', onWheel, { passive: false });
			node.addEventListener('pointerdown', onPointerDown);
			node.addEventListener('pointermove', onPointerMove);
			node.addEventListener('pointerup', onPointerUp);
			node.addEventListener('pointercancel', onPointerUp);
			return () => {
				node.removeEventListener('wheel', onWheel);
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('pointermove', onPointerMove);
				node.removeEventListener('pointerup', onPointerUp);
				node.removeEventListener('pointercancel', onPointerUp);
			};
		});

	const friendlyError = (documentError: Error) => {
		if (
			documentError.message.includes('Apple Pages') ||
			documentError.message.includes('could not be detected') ||
			documentError.message.includes('document metadata identifies')
		) {
			return documentError.message;
		}
		if (documentError.name === 'PasswordException' || documentError.message.includes('password')) {
			return t.documentPasswordIncorrect;
		}
		return t.pdfLoadError;
	};
</script>

<div
	bind:this={ref}
	class={classes.root({ size, position: toolbarPosition, className })}
	{...attachments}
>
	<div class={classes.viewer({ position: toolbarPosition })} aria-busy={viewer.loading}>
		<DocumentToolbar
			{viewer}
			{controls}
			{toolbarPosition}
			{sidebar}
			bind:isSidebarOpen
			{size}
			{color}
			{classes}
			{toolbar}
		/>

		<div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
			{#if viewer.warning}
				<div class={classes.warning()} role="status">
					{@render warningIcon({ size: '1.2em' })}
					<span>{viewer.warning}</span>
				</div>
			{/if}
			<div class={classes.workspace()}>
				{#if sidebar && isSidebarOpen && viewer.capabilities.sidebar && viewer.totalPages}
					<aside class={classes.sidebar()} aria-label={t.documentThumbnails}>
						<ScrollArea
							class="min-h-0 flex-1"
							type="hover"
							label={t.documentThumbnailPages}
							theme={documentViewerScrollAreaTheme}
						>
							<div class={classes.thumbnails()}>
								{#each Array(viewer.totalPages), index (index)}
									<DocumentThumbnail {viewer} index={index + 1} {classes} {thumbnail} />
								{/each}
							</div>
						</ScrollArea>
					</aside>
				{/if}
				<div class={classes.content()} {@attach zoomGestures}>
					{#if viewer.error}
						<Slot
							render={error}
							payload={viewer}
							class={classes.error()}
							attrs={{ role: 'alert', 'aria-live': 'assertive' }}
						>
							{friendlyError(viewer.error)}
						</Slot>
					{:else if viewer.model?.kind === 'pdf'}
						{#key viewer.model.id}
							<PDFSurface {viewer} model={viewer.model} {classes} {pageTransition} />
						{/key}
					{:else if viewer.model?.kind === 'ooxml'}
						<OoxmlSurface {viewer} {classes} />
					{:else if viewer.model?.kind === 'spreadsheet'}
						<SpreadsheetSurface {viewer} {classes} />
						{#if sheetTabs && viewer.capabilities.sheetTabs}
							<SheetTabs {viewer} {classes} />
						{/if}
					{:else if viewer.model?.kind === 'legacy'}
						<LegacySurface {viewer} {classes} />
					{/if}
				</div>
			</div>
		</div>
		{#if viewer.loading}
			<Skeleton class={classes.skeleton()} />
		{/if}
	</div>
</div>
