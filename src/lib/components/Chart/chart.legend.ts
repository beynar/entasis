import type { ChartColorLegend, ChartColorLegendContext } from '@tanstack/charts';
import { controlledSignal } from '@tanstack/charts/interaction/signal';
import { colorLegend, interactiveColorLegend } from '@tanstack/charts/legend';
import type { ChartKey, ChartLegend } from './chart.props.js';
import type { CompiledMark } from './chart.cartesian.js';

export function compileChartLegend(
	input: ChartLegend | undefined,
	value?: readonly ChartKey[],
	onValueChange?: (value: readonly ChartKey[]) => void,
	interactive = true
): ChartColorLegend | undefined {
	if (!input) return undefined;
	const options = input === true ? {} : input;
	const placement = options.placement ?? 'bottom';
	const staticLegend = colorLegend({ placement, label: options.label });
	let resolved = staticLegend;
	function layout(context: ChartColorLegendContext): ChartColorLegendContext {
		const count = context.colors.domain.length;
		const categorical = context.colors.kind === 'categorical';
		const columns = options.orientation === 'vertical' ? 1 : Math.max(1, count);
		const gap = options.interactive && interactive ? 8 : 0;
		const desiredWidth = categorical ? columns * (110 + gap) - gap : 240;
		const width = Math.min(context.chart.width, desiredWidth);
		let offset = 0;
		if (options.align === 'center') offset = (context.chart.width - width) / 2;
		else if (options.align === 'right') offset = context.chart.width - width;
		return {
			...context,
			chart: { ...context.chart, width },
			bounds: { ...context.bounds, x: context.bounds.x + offset, width }
		};
	}
	return {
		placement,
		height(count, context) {
			// Native scale resolution owns the initial series set, including derived marks.
			resolved =
				options.interactive && interactive && context.colors.kind === 'categorical'
					? interactiveColorLegend({
							placement,
							ariaLabel: options.label,
							visible: controlledSignal(
								value ?? options.value ?? options.defaultValue ?? context.colors.domain,
								onValueChange ?? options.onValueChange ?? (() => {})
							)
						})
					: staticLegend;
			return resolved.height(count, layout(context));
		},
		render: (context) => resolved.render(layout(context)),
		get seriesVisible() {
			return resolved.seriesVisible;
		},
		get filterMark() {
			return resolved.filterMark;
		},
		get control() {
			const control = resolved.control;
			return control ? (context: ChartColorLegendContext) => control(layout(context)) : undefined;
		}
	};
}

export function withLegendSeries(mark: CompiledMark): CompiledMark {
	return {
		...mark,
		initialize(context) {
			return { ...mark.initialize(context), seriesFromColor: true };
		}
	};
}
