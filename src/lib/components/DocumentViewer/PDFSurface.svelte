<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import PDFPage from '../PDFViewer/PDFPage.svelte';
	import { PDFViewerState } from '../PDFViewer/pdfViewer.state.svelte.js';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import type { PdfDocumentModel, DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		surface: () => string;
		single: () => string;
		singlePage: () => string;
		scroller: () => string;
		pages: (options: { orientation: 'vertical' | 'horizontal' }) => string;
		page: () => string;
		canvas: () => string;
		pageError: () => string;
	};

	let {
		viewer,
		model,
		classes,
		pageTransition
	}: {
		viewer: DocumentViewerState;
		model: PdfDocumentModel;
		classes: Classes;
		pageTransition: boolean;
	} = $props();

	const pdf = new PDFViewerState({
		get src() {
			return model.bytes;
		},
		get page() {
			return viewer.page;
		},
		set page(value) {
			viewer.page = value;
		},
		get scale() {
			return viewer.scale;
		},
		set scale(value) {
			viewer.scale = value;
		},
		get rotation() {
			return viewer.rotation;
		},
		set rotation(value) {
			viewer.rotation = value;
		},
		get totalPages() {
			return viewer.totalPages;
		},
		set totalPages(value) {
			viewer.totalPages = value;
		},
		get fit() {
			return viewer.fit;
		},
		set fit(value) {
			viewer.fit = value;
		},
		get mode() {
			return viewer.mode;
		},
		set mode(value) {
			viewer.mode = value;
		},
		get orientation() {
			return viewer.orientation;
		},
		set orientation(value) {
			viewer.orientation = value;
		},
		get password() {
			return viewer.password;
		},
		get minScale() {
			return viewer.minScale;
		},
		get maxScale() {
			return viewer.maxScale;
		},
		get downloadFileName() {
			return viewer.downloadFileName;
		},
		get runtimeAssets() {
			return viewer.resolvedAssets.pdf;
		},
		onLoad: () => viewer.completePdfLoad(pdf.totalPages),
		onError: (error) => viewer.reportSurfaceError(error)
	});

	const searchState = () => ({
		matches: pdf.matches.map((match) => ({ unit: match.page, text: pdf.query })),
		activeMatch: pdf.activeMatch
	});
	const controller = {
		search: async (query: string) => {
			await pdf.search(query);
			return searchState();
		},
		nextMatch: () => {
			pdf.nextMatch();
			return searchState();
		},
		previousMatch: () => {
			pdf.previousMatch();
			return searchState();
		},
		clearSearch: pdf.clearSearch,
		print: pdf.print,
		renderThumbnail: pdf.renderThumbnail
	};
	$effect(() => {
		const currentViewer = viewer;
		untrack(() => currentViewer.setSurfaceController(controller));
		return () => currentViewer.setSurfaceController(null);
	});

	const pageClasses = $derived({
		page: classes.page,
		canvas: classes.canvas,
		pageError: classes.pageError
	});

	const slidePage = (
		node: HTMLElement,
		{ direction, role }: { direction: number; role: 'in' | 'out' }
	) => {
		if (!pageTransition || direction === 0) return { duration: 0 };
		const moving = (role === 'in' && direction > 0) || (role === 'out' && direction < 0);
		node.style.zIndex = moving ? '2' : '1';
		return {
			duration: 280,
			easing: cubicOut,
			css: (t: number) =>
				moving ? `transform: translateX(${(1 - t) * 100}%);` : 'transform: none;'
		};
	};
</script>

<ScrollArea
	type="hover"
	class={classes.surface()}
	label="PDF pages"
	theme={documentViewerScrollAreaTheme}
>
	{#if pdf.mode === 'single'}
		<div class={classes.single()} {@attach pdf.attach}>
			{#if pdf.totalPages}
				{#key pdf.page}
					<div
						class={classes.singlePage()}
						in:slidePage={{ direction: pdf.direction, role: 'in' }}
						out:slidePage={{ direction: pdf.direction, role: 'out' }}
					>
						<PDFPage viewer={pdf} pageNumber={pdf.page} classes={pageClasses} />
					</div>
				{/key}
			{/if}
		</div>
	{:else if pdf.orientation === 'horizontal'}
		<div class={classes.scroller()}>
			<div class={classes.pages({ orientation: 'horizontal' })} {@attach pdf.attach}>
				{#each Array(pdf.totalPages), index (index)}
					<PDFPage viewer={pdf} pageNumber={index + 1} classes={pageClasses} />
				{/each}
			</div>
		</div>
	{:else}
		<div class={classes.pages({ orientation: 'vertical' })} {@attach pdf.attach}>
			{#each Array(pdf.totalPages), index (index)}
				<PDFPage viewer={pdf} pageNumber={index + 1} classes={pageClasses} />
			{/each}
		</div>
	{/if}
</ScrollArea>
