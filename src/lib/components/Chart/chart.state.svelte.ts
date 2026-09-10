import type {
	ChartHostOptions,
	ChartInteractionController,
	ChartRenderContext,
	ChartValue
} from '@tanstack/charts';
import { createChartAdapter, type ChartAdapter } from '@tanstack/charts/adapter';
import { renderChartSvgWithResources } from '@tanstack/charts/svg/resources';
import { bind } from '$lib/utils/state.svelte.js';
import { untrack } from 'svelte';
import { createChartOptions } from './chart.adapter.js';
import type { ChartKey, ChartProps } from './chart.props.js';
import { useChartTheme } from './chart.theme.js';
import { ChartViewportState } from './chart.viewport.svelte.js';

interface ChartStateOptions<TRow extends object> {
	readonly data: ChartProps<TRow>['data'];
	readonly marks: ChartProps<TRow>['marks'];
	readonly x: ChartProps<TRow>['x'];
	readonly y: ChartProps<TRow>['y'];
	readonly guides: ChartProps<TRow>['guides'];
	readonly clip: ChartProps<TRow>['clip'];
	readonly frame: ChartProps<TRow>['frame'];
	readonly margin: ChartProps<TRow>['margin'];
	readonly palette: ChartProps<TRow>['palette'];
	readonly legend?: ChartProps<TRow>['legend'];
	readonly tooltip: ChartProps<TRow>['tooltip'];
	readonly viewport: ChartProps<TRow>['viewport'];
	readonly ariaLabel: ChartProps<TRow>['ariaLabel'];
	readonly ariaDescription: ChartProps<TRow>['ariaDescription'];
	readonly initialDimensions: ChartProps<TRow>['initialDimensions'];
	readonly theme: ChartProps<TRow>['theme'];
	readonly idPrefix: string;
	readonly className?: string;
}

export interface ChartState<TRow extends object> extends ChartStateOptions<TRow> {}
export class ChartState<TRow extends object> {
	readonly viewportState: ChartViewportState<TRow>;
	readonly classes = $derived(useChartTheme(this.theme));
	readonly options = $derived(this.createOptions());
	readonly rootClass = $derived(this.classes.root({ className: this.className }));
	readonly plotClass = $derived(this.classes.plot());
	readonly rootStyle = $derived(
		this.initialDimensions
			? `position:relative;width:100%;aspect-ratio:${this.initialDimensions.width}/${this.initialDimensions.height}`
			: 'position:relative;width:100%;height:320px'
	);

	readonly initialMarkup: string;
	#adapter: ChartAdapter<ChartHostOptions<TRow>, TRow, ChartValue, ChartValue>;
	#interaction: ChartInteractionController<TRow> | undefined;
	#legendValue = $state<readonly ChartKey[] | undefined>();

	constructor(options: ChartStateOptions<TRow>) {
		bind(this, options);
		this.#legendValue = typeof this.legend === 'object' ? this.legend.defaultValue : undefined;
		this.viewportState = new ChartViewportState(this);
		this.#adapter = untrack(() => createChartAdapter(this.createOptions()));
		this.initialMarkup = untrack(() => (this.initialDimensions ? this.#adapter.prerender() : ''));

		$effect(() => {
			const options = this.options;
			untrack(() => this.#adapter.update(options));
		});
	}

	host = (node: HTMLDivElement) => {
		untrack(() => this.#adapter.mount(node));
		node.addEventListener('pointermove', this.handlePointerMove, true);
		node.addEventListener('pointerdown', this.clearPointerFocus, true);
		node.addEventListener('pointerleave', this.clearPointerFocus);
		node.addEventListener('pointercancel', this.clearPointerFocus);
		return () => {
			node.removeEventListener('pointermove', this.handlePointerMove, true);
			node.removeEventListener('pointerdown', this.clearPointerFocus, true);
			node.removeEventListener('pointerleave', this.clearPointerFocus);
			node.removeEventListener('pointercancel', this.clearPointerFocus);
			this.#adapter.destroy();
			this.#interaction = undefined;
		};
	};

	clearPointerFocus = () => {
		this.#interaction?.setControlledFocus(null);
	};

	private setLegendValue = (value: readonly ChartKey[]) => {
		this.clearPointerFocus();
		const legend = typeof this.legend === 'object' ? this.legend : undefined;
		if (legend?.value === undefined) this.#legendValue = value;
		legend?.onValueChange?.(value);
	};

	private handlePointerMove = (event: PointerEvent) => {
		// Native controls consume hover too; forward it through native picking without click focus.
		event.stopPropagation();
		if (!this.tooltip || event.buttons || this.viewportState.isBrushing) {
			this.clearPointerFocus();
			return;
		}
		const focus = this.#interaction?.resolvePointer(event.clientX, event.clientY) ?? null;
		this.#interaction?.setControlledFocus(focus);
	};

	private createOptions() {
		return {
			...createChartOptions({
				data: this.data,
				marks: this.marks,
				x: this.x,
				y: this.y,
				guides: this.guides,
				clip: this.viewportState.isEnabled ? true : this.clip,
				frame: this.frame,
				margin: this.margin,
				palette: this.palette,
				legend: this.legend,
				legendValue:
					typeof this.legend === 'object'
						? (this.legend.value ?? this.#legendValue)
						: this.#legendValue,
				onLegendValueChange: this.setLegendValue,
				tooltip: this.tooltip,
				ariaLabel: this.ariaLabel,
				ariaDescription: this.ariaDescription,
				idPrefix: this.idPrefix,
				initialDimensions: this.initialDimensions,
				animation: this.viewportState.animation,
				controls: this.viewportState.controls,
				viewportDomain: this.viewportState.xDomain,
				tooltipClassName: this.classes.tooltip()
			}),
			onRender: ({ scene, interaction }: ChartRenderContext<TRow>) => {
				this.#interaction = interaction;
				this.viewportState.syncScene(scene);
			},
			renderSvg: renderChartSvgWithResources
		};
	}
}
