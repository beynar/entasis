<script lang="ts" generics="TRow extends object">
	import type { ChartProps } from './chart.props.js';
	import { ChartState } from './chart.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import ToggleButtonGroup from '../ToggleButtonGroup/ToggleButtonGroup.svelte';

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
		label,
		ariaDescription,
		height,
		aspectRatio,
		class: className,
		ref = $bindable(null),
		theme,
		...attachments
	}: ChartProps<TRow> = $props();
	const t = $derived(useI18n());

	const generatedId = $props.id();
	const idPrefix = `entasis-chart-${generatedId.replaceAll(/[^a-zA-Z0-9_-]/g, '')}`;
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
		get label() {
			return label;
		},
		get ariaDescription() {
			return ariaDescription;
		},
		get height() {
			return height;
		},
		get aspectRatio() {
			return aspectRatio;
		},
		get theme() {
			return theme;
		},
		get className() {
			return className;
		},
		get messages() {
			return t;
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
	{#if chart.legendSurface}
		{#if chart.legendSurface.interactive}
			<!--
				The quiet pair of the two toggle variants: `ghost` (no resting border, so the chip
				is a tint and a label rather than a bordered button) at `small` (a legend sits next
				to axis ticks, not next to the toolbar). Note what that means at rest: every series
				starts visible, so every toggle starts pressed, and pressed ghost is `selectedSoft`
				(`bg-color-muted`) — the default legend is a row of muted pills, and switching a
				series off is what drops its chip to transparent. Visible pressed state is the
				trade: a legend whose "on" state painted nothing could not show which series the
				reader had hidden.
			-->
			<ToggleButtonGroup
				class={chart.legendClass}
				label={chart.legendLabel}
				items={chart.legendItems}
				type="multiple"
				size="small"
				variant="ghost"
				bind:value={() => chart.legendPressed, (pressed) => chart.setLegendPressed(pressed)}
			/>
		{:else}
			<ul class={chart.legendClass} aria-label={chart.legendLabel}>
				{#each chart.legendSurface.items as item (item.key)}
					<li class={chart.legendItemClass}>
						{@render chart.legendSwatch(item.color)()}
						{item.label}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
	<!--
		The plot box, and the only thing the reset control may be anchored to: anchored to the
		root it would land on a `placement: 'top'` legend row. The engine reconciles the host's
		children (and calls `replaceChildren` when it swaps renderers), so the button is a
		sibling of the host inside this box, not a child of it.
	-->
	<div class={chart.plotClass}>
		<div {@attach chart.host} data-chart-host class="absolute inset-0">
			<!-- Markup serialized by the chart engine itself from the typed mark specs, never user HTML. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html chart.initialMarkup}
		</div>
		{#if chart.viewportState.showReset}
			<button
				type="button"
				data-chart-viewport-reset
				class="bg-surface-floating text-neutral hover:bg-neutral-muted focus-visible:ring-focus/50 raised-1 absolute top-2 right-2 z-20 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
				onclick={chart.viewportState.reset}
			>
				Reset zoom
			</button>
		{/if}
	</div>
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
