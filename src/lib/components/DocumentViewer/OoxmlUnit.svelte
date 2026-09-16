<script lang="ts">
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';
	import { renderOoxmlUnit, type OoxmlModel, type OoxmlTextRun } from './ooxmlAdapter.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Classes = {
		ooxmlPage: () => string;
		ooxmlCanvas: () => string;
		ooxmlTextLayer: () => string;
	};

	let {
		viewer,
		model,
		index,
		width,
		height,
		root,
		virtualized = false,
		horizontal = false,
		classes
	}: {
		viewer: DocumentViewerState;
		model: OoxmlModel;
		index: number;
		width: number;
		height: number;
		root: HTMLElement | null;
		virtualized?: boolean;
		horizontal?: boolean;
		classes: Classes;
	} = $props();
	const t = $derived(useI18n());

	let page = $state<HTMLDivElement | null>(null);
	let canvas = $state<HTMLCanvasElement | null>(null);
	let textLayer = $state<HTMLDivElement | null>(null);
	let isVisible = $state(false);
	let renderToken = 0;

	$effect(() => {
		const target = page;
		if (!target || !virtualized) {
			isVisible = true;
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				isVisible = entry?.isIntersecting ?? false;
			},
			{ root, rootMargin: horizontal ? '0px 100%' : '100% 0px' }
		);
		observer.observe(target);
		return () => observer.disconnect();
	});

	$effect(() => {
		const currentModel = model;
		const currentIndex = index;
		const currentWidth = width;
		const currentHeight = height;
		const target = canvas;
		const layer = textLayer;
		const shouldRender = isVisible;
		if (!target || !layer) return;
		if (!shouldRender) {
			renderToken++;
			target.width = 0;
			target.height = 0;
			layer.replaceChildren();
			return;
		}
		void render(currentModel, currentIndex, currentWidth, currentHeight, target, layer);
	});

	$effect(() => {
		void [viewer.query, viewer.activeMatch, viewer.page];
		highlightText();
	});

	const render = async (
		currentModel: OoxmlModel,
		currentIndex: number,
		currentWidth: number,
		currentHeight: number,
		target: HTMLCanvasElement,
		layer: HTMLDivElement
	) => {
		const token = ++renderToken;
		const runs: OoxmlTextRun[] = [];
		try {
			const bitmap = await renderOoxmlUnit(
				currentModel,
				currentIndex,
				currentWidth,
				window.devicePixelRatio || 1,
				(run) => runs.push(run)
			);
			if (token !== renderToken) {
				bitmap.close();
				return;
			}
			const context = target.getContext('2d');
			if (!context) {
				bitmap.close();
				throw new Error('The browser could not create a document canvas context.');
			}
			target.width = bitmap.width;
			target.height = bitmap.height;
			target.style.width = `${currentWidth}px`;
			target.style.height = `${currentHeight}px`;
			context.drawImage(bitmap, 0, 0);
			bitmap.close();
			layer.replaceChildren();
			viewer.buildOoxmlTextLayer(layer, runs, currentWidth, currentHeight);
			highlightText();
		} catch (error) {
			if (token !== renderToken) return;
			viewer.reportSurfaceError(error instanceof Error ? error : new Error(String(error)));
		}
	};

	const highlightText = () => {
		if (!textLayer) return;
		const needle = viewer.query.trim().toLowerCase();
		const activeUnit = viewer.matches[viewer.activeMatch]?.unit;
		for (const span of textLayer.querySelectorAll<HTMLElement>('span')) {
			const matches = !!needle && (span.textContent ?? '').toLowerCase().includes(needle);
			span.style.background = matches
				? activeUnit === index + 1
					? 'color-mix(in oklab, var(--color-warning) 80%, transparent)'
					: 'color-mix(in oklab, var(--color-warning) 45%, transparent)'
				: '';
		}
	};
</script>

<div
	bind:this={page}
	class={classes.ooxmlPage()}
	style:width="{width}px"
	style:height="{height}px"
	data-document-unit={index + 1}
	aria-label={viewer.unit === 'slide' ? t.slideIndex(index + 1) : t.pageIndex(index + 1)}
>
	<canvas bind:this={canvas} class={classes.ooxmlCanvas()} aria-hidden="true"></canvas>
	<div bind:this={textLayer} class={classes.ooxmlTextLayer()}></div>
</div>
