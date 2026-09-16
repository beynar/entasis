<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import type {
		PDFAnnotation,
		PDFPageProxy,
		PDFViewport,
		PDFViewerState,
		TextLayerInstance
	} from './pdfViewer.state.svelte.js';

	type ClassFn = () => string;

	/** Reads the given values so the enclosing `$effect` depends on them. */
	const track = (...values: unknown[]) => values;

	let {
		viewer,
		pageNumber,
		classes
	}: {
		viewer: PDFViewerState;
		pageNumber: number;
		classes: { page: ClassFn; canvas: ClassFn; pageError: ClassFn };
	} = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	const t = $derived(useI18n());
	let textEl = $state<HTMLDivElement | null>(null);
	let rendered = $state(false);
	let renderedW = $state(0);
	let renderedH = $state(0);
	// The scale/rotation the current canvas was rendered at; while these differ
	// from the live values (during an async re-render) the box uses the estimate
	// so the placeholder resizes immediately on zoom and the anchor doesn't jump.
	let renderedScale = $state(0);
	let renderedRotation = $state(0);
	let links = $state<{ url: string; left: number; top: number; width: number; height: number }[]>(
		[]
	);
	let pageError = $state(false);

	let renderToken = 0;
	let currentTask: { cancel(): void } | null = null;
	let textLayer: TextLayerInstance | null = null;
	let textDivs: HTMLElement[] = [];
	let itemsStr: string[] = [];

	// Placeholder size: page-1 dims (rotation swaps w/h for 90/270) × scale.
	const quarter = $derived(((viewer.rotation % 180) + 180) % 180); // 0 or 90
	const estW = $derived(quarter === 90 ? viewer.baseHeight : viewer.baseWidth);
	const estH = $derived(quarter === 90 ? viewer.baseWidth : viewer.baseHeight);
	const fresh = $derived(
		rendered && renderedScale === viewer.scale && renderedRotation === viewer.rotation
	);
	const boxW = $derived(fresh ? renderedW : Math.round(estW * viewer.scale) || 1);
	const boxH = $derived(fresh ? renderedH : Math.round(estH * viewer.scale) || 1);

	const registerAttachment = (node: HTMLElement) => viewer.registerPage(pageNumber, node);

	// Render / tear down as the page enters or leaves the virtualization band,
	// and re-render on scale / rotation changes.
	$effect(() => {
		const should = viewer.renderPages.has(pageNumber);
		track(viewer.scale, viewer.rotation, viewer.doc, viewer.pdfjs);
		untrack(() => {
			if (should) void render();
			else teardown();
		});
	});

	// Re-apply search highlights when matches change (if this page has text).
	$effect(() => {
		track(viewer.matches, viewer.activeMatch);
		untrack(() => applyHighlights());
	});

	const render = async () => {
		const doc = viewer.doc;
		const pdfjs = viewer.pdfjs;
		const canvas = canvasEl;
		if (!doc || !pdfjs || !canvas) return;

		const token = ++renderToken;
		const renderScale = viewer.scale;
		const renderRotation = viewer.rotation;
		currentTask?.cancel();
		pageError = false;

		try {
			const page = await doc.getPage(pageNumber);
			if (token !== renderToken) return;
			const viewport = page.getViewport({
				scale: renderScale,
				rotation: viewer.rotationFor(page.rotate)
			});

			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			const outputScale = window.devicePixelRatio || 1;
			canvas.width = Math.floor(viewport.width * outputScale);
			canvas.height = Math.floor(viewport.height * outputScale);
			canvas.style.width = `${Math.floor(viewport.width)}px`;
			canvas.style.height = `${Math.floor(viewport.height)}px`;
			renderedW = Math.floor(viewport.width);
			renderedH = Math.floor(viewport.height);

			const task = page.render({
				canvasContext: ctx,
				viewport,
				transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined
			});
			currentTask = task;
			await task.promise;
			if (token !== renderToken) return;
			rendered = true;
			renderedScale = renderScale;
			renderedRotation = renderRotation;

			await renderTextLayer(page, viewport, token);
			await renderLinks(page, viewport, token);
		} catch (e) {
			if (e instanceof Error && e.name === 'RenderingCancelledException') return;
			if (token !== renderToken) return;
			pageError = true;
		}
	};

	const renderTextLayer = async (page: PDFPageProxy, viewport: PDFViewport, token: number) => {
		const pdfjs = viewer.pdfjs;
		if (!pdfjs || !textEl) return;
		textLayer?.cancel();
		// eslint-disable-next-line svelte/no-dom-manipulating -- the text layer's children are created and owned by pdf.js, not by Svelte.
		textEl.replaceChildren();
		pdfjs.setLayerDimensions(textEl, viewport);
		const content = await page.getTextContent();
		if (token !== renderToken || !textEl) return;
		const tl = new pdfjs.TextLayer({ textContentSource: content, container: textEl, viewport });
		textLayer = tl;
		await tl.render();
		if (token !== renderToken) return;
		textDivs = tl.textDivs;
		itemsStr = tl.textContentItemsStr;
		applyHighlights();
	};

	const safeLink = (value: string) => {
		try {
			const url = new URL(value, window.location.href);
			return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
		} catch {
			return null;
		}
	};

	const renderLinks = async (page: PDFPageProxy, viewport: PDFViewport, token: number) => {
		const annots = await page.getAnnotations();
		if (token !== renderToken) return;
		links = annots.flatMap((annotation: PDFAnnotation) => {
			if (annotation.subtype !== 'Link' || !annotation.url) return [];
			const url = safeLink(annotation.url);
			if (!url) return [];
			const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(annotation.rect);
			return [
				{
					url,
					left: Math.min(x1, x2),
					top: Math.min(y1, y2),
					width: Math.abs(x2 - x1),
					height: Math.abs(y2 - y1)
				}
			];
		});
	};

	const teardown = () => {
		renderToken++;
		currentTask?.cancel();
		currentTask = null;
		textLayer?.cancel();
		textLayer = null;
		textDivs = [];
		itemsStr = [];
		if (canvasEl) {
			canvasEl.width = 0;
			canvasEl.height = 0;
			canvasEl.style.width = '';
			canvasEl.style.height = '';
		}
		// eslint-disable-next-line svelte/no-dom-manipulating -- the text layer's children are created and owned by pdf.js, not by Svelte.
		textEl?.replaceChildren();
		links = [];
		rendered = false;
	};

	// Wrap matched character ranges in the text layer with highlight spans.
	const applyHighlights = () => {
		if (!textEl || !textDivs.length) return;
		const { ranges, activeOnPage } = viewer.matchesForPage(pageNumber);

		// Reset any previously highlighted divs to plain text.
		for (let i = 0; i < textDivs.length; i++) {
			const div = textDivs[i];
			if (div.dataset.hl) {
				div.textContent = itemsStr[i] ?? '';
				delete div.dataset.hl;
			}
		}
		if (!ranges.length) return;

		let offset = 0;
		for (let i = 0; i < textDivs.length; i++) {
			const div = textDivs[i];
			const text = itemsStr[i] ?? '';
			const start = offset;
			const end = offset + text.length;
			offset = end;

			const local: { s: number; e: number; active: boolean }[] = [];
			for (const r of ranges) {
				const s = Math.max(r.start, start);
				const e = Math.min(r.end, end);
				if (s < e) local.push({ s: s - start, e: e - start, active: r.active });
			}
			if (!local.length) continue;
			local.sort((a, b) => a.s - b.s);

			const frag = document.createDocumentFragment();
			let pos = 0;
			for (const seg of local) {
				if (seg.s > pos) frag.append(text.slice(pos, seg.s));
				const mark = document.createElement('span');
				mark.dataset.pdfHighlight = '';
				if (seg.active) mark.dataset.active = '';
				mark.textContent = text.slice(seg.s, seg.e);
				frag.append(mark);
				pos = seg.e;
			}
			if (pos < text.length) frag.append(text.slice(pos));
			div.replaceChildren(frag);
			div.dataset.hl = '1';
		}

		if (activeOnPage) {
			const activeEl = textEl.querySelector('[data-active]');
			if (activeEl instanceof HTMLElement) viewer.scrollElementIntoView(activeEl);
		}
	};
</script>

<div
	class={classes.page()}
	style="width:{boxW}px;height:{boxH}px;--scale-factor:{viewer.scale};--total-scale-factor:{viewer.scale};--scale-round-x:1px;--scale-round-y:1px;"
	data-page-number={pageNumber}
	{@attach registerAttachment}
>
	<canvas bind:this={canvasEl} class={classes.canvas()} aria-hidden="true"></canvas>
	<div bind:this={textEl} class="pdf-text-layer"></div>
	<div class="pdf-link-layer">
		{#each links as link, i (i)}
			<a
				href={link.url}
				target="_blank"
				rel="noopener noreferrer external"
				aria-label={t.linkTo(link.url)}
				style="left:{link.left}px;top:{link.top}px;width:{link.width}px;height:{link.height}px;"
			></a>
		{/each}
	</div>
	{#if pageError}
		<div class={classes.pageError()}>{t.pageRenderError(pageNumber)}</div>
	{/if}
</div>

<style>
	/* pdf.js text layer — targets the spans pdf.js injects at runtime, so these
	   must be global and structural (positioning), not themeable. */
	:global(.pdf-text-layer) {
		position: absolute;
		inset: 0;
		overflow: clip;
		opacity: 1;
		line-height: 1;
		text-size-adjust: none;
		forced-color-adjust: none;
		transform-origin: 0 0;
		z-index: 2;
	}
	:global(.pdf-text-layer > span),
	:global(.pdf-text-layer > br) {
		color: transparent;
		position: absolute;
		white-space: pre;
		cursor: text;
		user-select: text;
		transform-origin: 0 0;
	}
	:global(.pdf-text-layer > span [data-pdf-highlight]) {
		background: color-mix(in oklab, var(--color-warning) 45%, transparent);
		border-radius: 2px;
	}
	:global(.pdf-text-layer > span [data-active]) {
		background: color-mix(in oklab, var(--color-warning) 80%, transparent);
	}
	:global(.pdf-text-layer ::selection) {
		background: color-mix(in oklab, var(--color-primary) 40%, transparent);
	}
	:global(.pdf-text-layer .endOfContent) {
		display: block;
		position: absolute;
		inset: 100% 0 0;
		z-index: -1;
		cursor: default;
		user-select: none;
	}

	.pdf-link-layer {
		position: absolute;
		inset: 0;
		z-index: 3;
		/* The full-page overlay must not swallow pointer events, or it blocks
		   text selection on the text layer below — only the links themselves
		   should be interactive. */
		pointer-events: none;
	}
	.pdf-link-layer a {
		position: absolute;
		cursor: pointer;
		pointer-events: auto;
	}
	.pdf-link-layer a:hover {
		background: color-mix(in oklab, var(--color-primary) 12%, transparent);
	}
</style>
