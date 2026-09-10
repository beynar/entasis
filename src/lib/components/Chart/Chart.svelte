<script lang="ts" generics="TRow extends object">
	import type { ChartProps } from './chart.props.js';
	import { ChartState } from './chart.state.svelte.js';

	let {
		data,
		marks,
		x,
		y,
		guides,
		clip,
		frame,
		margin,
		palette,
		legend,
		tooltip,
		viewport,
		ariaLabel,
		ariaDescription,
		initialDimensions,
		class: className,
		ref = $bindable(null),
		theme,
		...attachments
	}: ChartProps<TRow> = $props();

	const generatedId = $props.id();
	const idPrefix = `svelai-chart-${generatedId.replaceAll(/[^a-zA-Z0-9_-]/g, '')}`;
	const chart = new ChartState<TRow>({
		get data() {
			return data;
		},
		get marks() {
			return marks;
		},
		get x() {
			return x;
		},
		get y() {
			return y;
		},
		get guides() {
			return guides;
		},
		get clip() {
			return clip;
		},
		get frame() {
			return frame;
		},
		get margin() {
			return margin;
		},
		get palette() {
			return palette;
		},
		get legend() {
			return legend;
		},
		get tooltip() {
			return tooltip;
		},
		get viewport() {
			return viewport;
		},
		get ariaLabel() {
			return ariaLabel;
		},
		get ariaDescription() {
			return ariaDescription;
		},
		get initialDimensions() {
			return initialDimensions;
		},
		get theme() {
			return theme;
		},
		get className() {
			return className;
		},
		get idPrefix() {
			return idPrefix;
		}
	});
</script>

<div
	bind:this={ref}
	data-slot="chart"
	data-chart-viewport-axis={chart.viewportState.axis}
	class={chart.rootClass}
	style={chart.rootStyle}
	{...attachments}
>
	<div {@attach chart.host} data-chart-host class={chart.plotClass} style="width:100%;height:100%">
		{@html chart.initialMarkup}
	</div>
	{#if chart.viewportState.showReset}
		<button
			type="button"
			data-chart-viewport-reset
			class="border-neutral-muted bg-surface-floating text-neutral hover:bg-neutral-muted focus-visible:ring-primary absolute top-2 right-2 z-20 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
			onclick={chart.viewportState.reset}
		>
			Reset zoom
		</button>
	{/if}
	{#if chart.viewportState.status}
		<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
			{chart.viewportState.status}
		</span>
	{/if}
</div>

<style>
	[data-slot='chart'] :global(svg.ts-chart) {
		outline: none;
	}

	[data-slot='chart'] :global([data-ts-focus-layer]) {
		display: none;
	}

	[data-slot='chart'][data-chart-viewport-axis='x'] :global(svg.ts-chart) {
		cursor: crosshair;
		touch-action: pan-y;
	}

	/* The brush is a zoom gesture, not a draggable persistent range. */
	[data-slot='chart'] :global([data-chart-brush-selection]),
	[data-slot='chart'] :global([data-chart-brush-handle]) {
		pointer-events: none;
	}
</style>
