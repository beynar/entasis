import type {
	ChartHostOptions,
	ChartInteractionController,
	ChartPoint,
	ChartRenderContext,
	ChartScene,
	ChartValue
} from '@tanstack/charts';
import { createChartAdapter, type ChartAdapter } from '@tanstack/charts/adapter';
import { renderChartSvgWithResources } from '@tanstack/charts/svg/resources';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { untrack } from 'svelte';
import { createChartOptions } from './chart.adapter.js';
import { compileKeyChannel } from './chart.channels.js';
import { chartLegendSwatch } from './chart.legend.swatch.js';
import { legendItemKey, type ChartLegendSurface } from './chart.legend.js';
import type { ToggleButtonGroupItems } from '../ToggleButtonGroup/index.js';
import type { ChartKey, ChartMark, ChartProps } from './chart.props.js';
import { useChartMotion, useChartTheme } from './chart.theme.js';
import { resolveChartSize } from './chart.validation.js';
import { ChartViewportState } from './chart.viewport.svelte.js';
import type { Messages } from '$lib/i18n/en.js';

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
	readonly label: ChartProps<TRow>['label'];
	readonly ariaDescription: ChartProps<TRow>['ariaDescription'];
	readonly height: ChartProps<TRow>['height'];
	readonly aspectRatio: ChartProps<TRow>['aspectRatio'];
	readonly theme: ChartProps<TRow>['theme'];
	readonly idPrefix: string;
	readonly className?: string;
	/** Active i18n catalog, used for the built-in tooltip row labels. */
	readonly messages?: Messages;
}

// `bind()` copies the option accessors onto the instance; this typed base is what declares
// them on `this`. A generic class cannot call a mixin factory in its `extends` clause, and
// merging an interface into the class declaration would be unsafe declaration merging.
const BoundChartOptions = createBindableStateClass<object>() as unknown as new <
	Options extends object
>(
	options: Options
) => Options;

export class ChartState<TRow extends object> extends BoundChartOptions<ChartStateOptions<TRow>> {
	readonly viewportState: ChartViewportState<TRow>;
	readonly classes = $derived(useChartTheme(this.theme));
	// Viewport zoom timing from `chartTheme.motion`, through the override ladder
	// (registry → `setChartTheme` → instance `theme.motion`).
	readonly #resolveMotion = useChartMotion();
	readonly viewportMotion = $derived(
		this.#resolveMotion(undefined, { motion: this.theme?.motion }).in
	);
	readonly options = $derived(this.createOptions());
	readonly rootClass = $derived(this.classes.root({ className: this.className }));
	readonly plotClass = $derived(this.classes.plot());
	readonly size = $derived(resolveChartSize(this.height, this.aspectRatio));
	// `height` and `aspectRatio` own the box when they are set, so they win over the root
	// class; with neither, the root class keeps its own height and the chart observes it.
	readonly rootStyle = $derived(
		this.size?.height !== undefined
			? `position:relative;width:100%;height:${this.size.height}px`
			: this.size?.aspectRatio !== undefined
				? `position:relative;width:100%;height:auto;aspect-ratio:${this.size.aspectRatio}`
				: 'position:relative;width:100%'
	);

	readonly initialMarkup: string;
	#adapter: ChartAdapter<ChartHostOptions<TRow>, TRow, ChartValue, ChartValue>;
	#interaction: ChartInteractionController<TRow> | undefined;
	#legendValue = $state<readonly ChartKey[] | undefined>();
	/** The categorical series the engine resolved, as the Svelte legend draws them. */
	#legendSurface = $state.raw<ChartLegendSurface | undefined>();
	/** Identity of the published surface, so a re-render that changed nothing is dropped. */
	#legendSignature: string | undefined;
	#tooltipValue = $state<ChartKey | null>(null);
	#scene = $state.raw<ChartScene<TRow, ChartValue, ChartValue> | undefined>();
	#pointerFocused = false;
	/** Scene key of the pin this chart last painted, so unpinning can clear it once. */
	#appliedPin: string | undefined;

	constructor(options: ChartStateOptions<TRow>) {
		super(options);
		this.#legendValue = typeof this.legend === 'object' ? this.legend.defaultValue : undefined;
		this.#tooltipValue =
			typeof this.tooltip === 'object' ? (this.tooltip.defaultValue ?? null) : null;
		this.viewportState = new ChartViewportState(this);
		this.#adapter = untrack(() => createChartAdapter(this.createOptions()));
		this.initialMarkup = untrack(() => (this.size ? this.#adapter.prerender() : ''));

		$effect(() => {
			const options = this.options;
			untrack(() => this.#adapter.update(options));
		});

		// A pinned row is painted from the rendered scene, so it survives a data or size
		// change. Only the pin is applied here: an unrelated render must not take focus away
		// from a pointer or keyboard reader.
		$effect(() => {
			void this.#scene;
			void this.tooltipValue;
			untrack(() => {
				if (this.#pointerFocused) return;
				const pinned = this.pinnedPoint();
				if (pinned) {
					this.#appliedPin = pinned.key;
					this.#interaction?.setControlledFocus(pinned, { source: 'programmatic' });
				} else if (this.#appliedPin !== undefined) {
					this.#appliedPin = undefined;
					this.#interaction?.setControlledFocus(null, { source: 'programmatic' });
				}
			});
		});
	}

	/** Row key of the pinned datum, controlled by `tooltip.value` when it is provided. */
	readonly tooltipValue = $derived(
		typeof this.tooltip === 'object' && this.tooltip.value !== undefined
			? this.tooltip.value
			: this.#tooltipValue
	);

	host = (node: HTMLDivElement) => {
		untrack(() => this.#adapter.mount(node));
		node.addEventListener('pointermove', this.handlePointerMove, true);
		node.addEventListener('pointerdown', this.handlePointerDown, true);
		node.addEventListener('click', this.handleClick);
		node.addEventListener('pointerleave', this.clearPointerFocus);
		node.addEventListener('pointercancel', this.clearPointerFocus);
		return () => {
			node.removeEventListener('pointermove', this.handlePointerMove, true);
			node.removeEventListener('pointerdown', this.handlePointerDown, true);
			node.removeEventListener('click', this.handleClick);
			node.removeEventListener('pointerleave', this.clearPointerFocus);
			node.removeEventListener('pointercancel', this.clearPointerFocus);
			this.#adapter.destroy();
			this.#interaction = undefined;
			this.#scene = undefined;
		};
	};

	clearPointerFocus = () => {
		this.#pointerFocused = false;
		this.restorePinnedFocus();
	};

	/** Paints the pinned row, or clears focus when nothing is pinned. */
	restorePinnedFocus = () => {
		if (!this.#interaction) return;
		const pinned = this.pinnedPoint();
		this.#appliedPin = pinned?.key;
		this.#interaction.setControlledFocus(pinned ?? null, { source: 'programmatic' });
	};

	/** The rendered point of the pinned row, when the tooltip is enabled and one matches. */
	pinnedPoint = (): ChartPoint<TRow, ChartValue, ChartValue> | undefined => {
		if (!this.tooltip) return undefined;
		const value = this.tooltipValue;
		if (value === null || value === undefined) return undefined;
		return this.#scene?.points.find((point) => this.#rowKeyOf(point) === chartRowKey(value));
	};

	/**
	 * Called by the compiled legend while the engine resolves the colour scale. The signature
	 * guard keeps an unchanged re-render from writing state the legend would react to.
	 */
	private setLegendSurface = (surface: ChartLegendSurface | undefined) => {
		const signature = surface && JSON.stringify(surface);
		if (signature === this.#legendSignature) return;
		this.#legendSignature = signature;
		this.#legendSurface = surface;
	};

	readonly legendSurface = $derived(this.#legendSurface);
	readonly legendClass = $derived.by(() => {
		const surface = this.#legendSurface;
		return this.classes.legend({
			placement: surface?.placement,
			align: surface?.align,
			orientation: surface?.orientation
		});
	});
	readonly legendItemClass = $derived(this.classes.legendItem());
	/** Accessible name of the legend, falling back to the catalog for each of its two roles. */
	readonly legendLabel = $derived.by(() => {
		const surface = this.#legendSurface;
		if (surface?.label !== undefined) return surface.label;
		return surface?.interactive
			? (this.messages?.chartSeriesVisibility ?? 'Series visibility')
			: (this.messages?.chartLegend ?? 'Chart legend');
	});

	/** The series colour chip, painted with the colour the mark resolved for that series. */
	legendSwatch = (color: string) => chartLegendSwatch(color, this.classes.legendSwatch());

	/** One toggle button per series: colour swatch, formatted label, pressed when visible. */
	readonly legendItems: ToggleButtonGroupItems = $derived(
		(this.#legendSurface?.items ?? []).map((item) => ({
			value: item.key,
			children: item.label,
			prefix: this.legendSwatch(item.color)
		}))
	);

	/** Visible series keys: controlled `legend.value`, else the local set, else every series. */
	readonly legendVisible = $derived.by((): readonly ChartKey[] => {
		const legend = typeof this.legend === 'object' ? this.legend : undefined;
		return (
			legend?.value ??
			this.#legendValue ??
			(this.#legendSurface?.items ?? []).map((item) => item.value)
		);
	});

	/** Pressed toggle values, which are the series identities of the visible series. */
	readonly legendPressed = $derived.by(() => {
		const visible = this.legendVisible.map(legendItemKey);
		return (this.#legendSurface?.items ?? [])
			.filter((item) => visible.includes(item.key))
			.map((item) => item.key);
	});

	/** Maps the pressed identities back to series keys, in the colour scale's own order. */
	setLegendPressed = (pressed: readonly string[]) => {
		this.setLegendValue(
			(this.#legendSurface?.items ?? [])
				.filter((item) => pressed.includes(item.key))
				.map((item) => item.value)
		);
	};

	private setLegendValue = (value: readonly ChartKey[]) => {
		this.clearPointerFocus();
		const legend = typeof this.legend === 'object' ? this.legend : undefined;
		if (legend?.value === undefined) this.#legendValue = value;
		legend?.onValueChange?.(value);
	};

	private setTooltipValue = (value: ChartKey | null) => {
		const tooltip = typeof this.tooltip === 'object' ? this.tooltip : undefined;
		if (tooltip?.value === undefined) this.#tooltipValue = value;
		tooltip?.onValueChange?.(value);
	};

	/** Key of the row a point was drawn from: the mark's `key` channel, or its x value. */
	readonly #rowKeyChannel = $derived(resolveRowKeyChannel(this.marks));

	#rowKeyOf(point: ChartPoint<TRow, ChartValue, ChartValue>): string {
		const channel = this.#rowKeyChannel;
		if (channel) {
			return chartRowKey(channel(point.datum, { index: point.datumIndex, data: this.data }));
		}
		return chartRowKey(point.xValue instanceof Date ? point.xValue.getTime() : point.xValue);
	}

	private handlePointerDown = () => {
		// The viewport brush owns the press gesture; the tooltip stays out of the way.
		if (this.viewportState.isEnabled) this.clearPointerFocus();
	};

	private handleClick = (event: MouseEvent) => {
		if (!this.tooltip || this.viewportState.isEnabled) return;
		const resolved = this.#interaction?.resolvePointer(event.clientX, event.clientY);
		if (!resolved) return;
		const key = this.#rowKeyOf(resolved.point);
		const pinned = this.tooltipValue;
		this.setTooltipValue(
			pinned !== null && pinned !== undefined && chartRowKey(pinned) === key
				? null
				: rawRowKey(resolved.point, this.#rowKeyChannel, this.data)
		);
	};

	private handlePointerMove = (event: PointerEvent) => {
		// Native controls consume hover too; forward it through native picking without click focus.
		event.stopPropagation();
		if (!this.tooltip || event.buttons || this.viewportState.isBrushing) {
			this.clearPointerFocus();
			return;
		}
		const focus = this.#interaction?.resolvePointer(event.clientX, event.clientY) ?? null;
		this.#pointerFocused = focus !== null;
		if (focus) this.#interaction?.setControlledFocus(focus);
		else this.restorePinnedFocus();
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
				onLegendSurface: this.setLegendSurface,
				tooltip: this.tooltip,
				label: this.label,
				ariaDescription: this.ariaDescription,
				idPrefix: this.idPrefix,
				height: this.height,
				aspectRatio: this.aspectRatio,
				animation: this.viewportState.animation,
				controls: this.viewportState.controls,
				viewportDomain: this.viewportState.xDomain,
				tooltipClassName: this.classes.tooltip(),
				messages: this.messages
			}),
			onRender: ({ scene, interaction }: ChartRenderContext<TRow>) => {
				this.#interaction = interaction;
				this.#scene = scene;
				this.viewportState.syncScene(scene);
			},
			renderSvg: renderChartSvgWithResources
		};
	}
}

function resolveRowKeyChannel<TRow extends object>(marks: readonly ChartMark<TRow>[]) {
	for (const mark of marks) {
		if ('key' in mark && mark.key !== undefined) return compileKeyChannel(mark.key);
	}
	return undefined;
}

function rawRowKey<TRow extends object>(
	point: ChartPoint<TRow, ChartValue, ChartValue>,
	channel: ReturnType<typeof resolveRowKeyChannel<TRow>>,
	data: readonly TRow[]
): ChartKey {
	if (channel) return channel(point.datum, { index: point.datumIndex, data });
	return point.xValue instanceof Date ? point.xValue.getTime() : (point.xValue as ChartKey);
}

/**
 * Pinned rows are compared as text so a date axis can be pinned by timestamp or by its own
 * value without the consumer having to know which one the mark produced.
 */
function chartRowKey(value: ChartKey | ChartValue): string {
	return value instanceof Date ? String(value.getTime()) : String(value);
}
