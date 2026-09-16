import type { ChartColorLegend, ChartColorLegendContext, SceneNode } from '@tanstack/charts';
import { controlledSignal } from '@tanstack/charts/interaction/signal';
import { colorLegend, interactiveColorLegend } from '@tanstack/charts/legend';
import type { ChartKey, ChartLegend } from './chart.props.js';
import type { CompiledMark } from './chart.cartesian.js';

/** One categorical series, as the Svelte legend draws it. */
export type ChartLegendItem = {
	/** Identity of the series key, stable across renders and unique per scale entry. */
	readonly key: string;
	/** The series key itself, handed back to `legend.onValueChange`. */
	readonly value: ChartKey;
	/** Display text: `legend.format` applied to the key, or the key itself. */
	readonly label: string;
	/** Resolved colour the mark paints for this series. */
	readonly color: string;
};

/** Everything the Svelte legend needs, published by the engine's scale resolution. */
export type ChartLegendSurface = {
	readonly placement: 'top' | 'bottom';
	readonly align: 'left' | 'center' | 'right';
	readonly orientation: 'horizontal' | 'vertical';
	/** True when the legend toggles series visibility, false for a read-only key. */
	readonly interactive: boolean;
	readonly label?: string;
	readonly items: readonly ChartLegendItem[];
};

/** What the engine draws where a categorical legend used to be: nothing. */
const EMPTY_LEGEND: SceneNode = { kind: 'group', key: 'legend', children: [] };

/**
 * Categorical legends are library controls: Chart.svelte renders them as a
 * `ToggleButtonGroup` (interactive) or a plain item row (static), so the engine must not
 * paint one.
 *
 * It also must not *reserve* a band for one. `ChartColorLegend.height()` is the only
 * reservation hook and it has to answer in pixels before the DOM exists, while the real
 * height of a row of `ToggleButton`s depends on the design system's control height, its
 * type metrics and how many entries wrap — none of which the engine can measure. Reserving
 * a guessed band would either clip the controls or leave a gap, so the categorical branch
 * reserves nothing (`height` → 0, `render` → an empty group) and the Svelte legend takes
 * its own flex row above or below the plot host, which then shrinks by exactly the row it
 * gave up. `placement` / `align` / `orientation` move from the engine's `layout()` onto the
 * `legend` theme part.
 *
 * Numeric legends are a colour ramp, not controls: the engine still owns them end to end,
 * including the `layout()` alignment below.
 */
export function compileChartLegend(
	input: ChartLegend | undefined,
	value?: readonly ChartKey[],
	interactive = true,
	onSurface?: (surface: ChartLegendSurface | undefined) => void
): ChartColorLegend | undefined {
	if (!input) return undefined;
	const options = input === true ? {} : input;
	const placement = options.placement ?? 'bottom';
	const align = options.align ?? 'left';
	const orientation = options.orientation ?? 'horizontal';
	const format = options.format;
	const isInteractive = options.interactive === true && interactive;
	// Visibility is proposed by the Svelte controls, so the signal only ever reads: the
	// engine keeps owning which series leave the scene (`seriesVisible` keeps hidden ones in
	// scale inference, `filterMark` drops their geometry) and nothing else.
	const visible = value ?? options.value ?? options.defaultValue;
	const visibility =
		isInteractive && visible
			? interactiveColorLegend({ visible: controlledSignal(visible, () => {}) })
			: undefined;

	/** The colour ramp, resolved once the engine knows the scale is not categorical. */
	let ramp: ChartColorLegend | undefined;

	function layout(context: ChartColorLegendContext): ChartColorLegendContext {
		const width = Math.min(context.chart.width, 240);
		let offset = 0;
		if (align === 'center') offset = (context.chart.width - width) / 2;
		else if (align === 'right') offset = context.chart.width - width;
		return {
			...context,
			chart: { ...context.chart, width },
			bounds: { ...context.bounds, x: context.bounds.x + offset, width }
		};
	}

	function publish(context: ChartColorLegendContext): void {
		onSurface?.({
			placement,
			align,
			orientation,
			interactive: isInteractive,
			label: options.label,
			items: context.colors.domain.map((key) => ({
				key: legendItemKey(key),
				value: key,
				label: format ? format(key) : String(key),
				color: context.colors.map(key)
			}))
		});
	}

	return {
		placement,
		height(count, context) {
			if (context.colors.kind === 'categorical') {
				ramp = undefined;
				publish(context);
				return 0;
			}
			ramp = colorLegend({ placement, label: options.label });
			onSurface?.(undefined);
			return ramp.height(count, layout(context));
		},
		render: (context) => (ramp ? ramp.render(layout(context)) : EMPTY_LEGEND),
		seriesVisible: visibility?.seriesVisible,
		filterMark: visibility?.filterMark
	};
}

/**
 * Series identity for the legend controls. It matches the engine's own scale key so a
 * numeric series and a string series that print the same never collapse into one entry.
 */
export function legendItemKey(value: ChartKey): string {
	return typeof value === 'string'
		? `string:${value.length}:${value}`
		: `${typeof value}:${String(value)}`;
}

/**
 * Applies `legend.format` to the series label carried by every rendered point, which is
 * what the native tooltip prints for the series key. The point objects are shared with the
 * scene nodes that reference them, so the label is rewritten in place on the freshly
 * rendered scene rather than copied, keeping node interactions and scene points in sync.
 */
export function withSeriesLabel(
	mark: CompiledMark,
	format: (key: ChartKey) => string
): CompiledMark {
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					for (const point of rendered.points ?? []) formatPointLabel(point, format);
					formatNodeLabels(rendered.nodes, format);
					return rendered;
				}
			};
		}
	};
}

function formatNodeLabels(nodes: readonly SceneNode[], format: (key: ChartKey) => string): void {
	for (const node of nodes) {
		if (node.kind === 'group') {
			formatNodeLabels(node.children, format);
			continue;
		}
		if (node.kind === 'label') continue;
		const interaction = node.interaction;
		if (!interaction) continue;
		if (interaction.point) formatPointLabel(interaction.point, format);
		else for (const point of interaction.points) formatPointLabel(point, format);
	}
}

function formatPointLabel(
	point: { group: ChartKey | null; groupLabel: string },
	format: (key: ChartKey) => string
): void {
	if (point.group === null) return;
	point.groupLabel = format(point.group);
}

export function withLegendSeries(mark: CompiledMark): CompiledMark {
	return {
		...mark,
		initialize(context) {
			return { ...mark.initialize(context), seriesFromColor: true };
		}
	};
}
