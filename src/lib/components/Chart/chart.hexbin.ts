import type { ChannelAccessor, ChartColorOptions, TransformReduceContext } from '@tanstack/charts';
import { hexbin, type HexbinDatum } from '@tanstack/charts/spatial/hexbin';
import { scaleSqrt } from 'd3-scale';
import { compileChannel, compileColor } from './chart.channels.js';
import type { CompiledMarkResult } from './chart.cartesian.js';
import type { ChartScatterMark } from './chart.props.js';

type HexbinScatterMark<TRow> = Extract<ChartScatterMark<TRow>, { variant: 'hexbin' }>;

export type ChartHexbinDatum<TRow extends object = object> = HexbinDatum<TRow> & {
	readonly __entasisHexbin: true;
	readonly __entasisSourceRows: readonly TRow[];
};

export function compileHexbinScatterMark<TRow extends object>(
	data: readonly TRow[],
	mark: HexbinScatterMark<TRow>,
	path: string,
	useColorScale = true
): CompiledMarkResult {
	const radius = mark.radius ?? 12;
	if (!Number.isFinite(radius) || radius <= 0) {
		throw new TypeError(`[Chart] ${path}.radius must be a finite number greater than 0.`);
	}
	const compiled = hexbin(data, {
		id: mark.id ?? `${path}:hexbin`,
		x: compileChannel(mark.x),
		y: compileChannel(mark.y),
		binWidth: Math.sqrt(3) * radius,
		r: Math.max(0, radius - 0.75),
		color: useColorScale ? 'count' : undefined,
		fill: useColorScale
			? undefined
			: createMixedHexbinFill<TRow>(compileColor(mark.color ?? 'primary')),
		outputs: {
			count: { reduce: 'count' },
			__entasisHexbin: { reduce: () => true as const },
			__entasisSourceRows: {
				reduce: ({ data }: TransformReduceContext<TRow>) => data
			}
		}
	});
	return { mark: compiled, annotationMarks: [compiled], requiresX: true, requiresY: true };
}

export function compileHexbinColorOptions<TRow>(mark: HexbinScatterMark<TRow>): ChartColorOptions {
	const color = compileColor(mark.color ?? 'primary');
	return { scale: () => createHexbinColorScale(color) };
}

function createHexbinColorScale(color: string) {
	return scaleSqrt<string>().range([
		`color-mix(in oklab, ${color} 16%, transparent)`,
		`color-mix(in oklab, ${color} 94%, transparent)`
	]);
}

function createMixedHexbinFill<TRow>(color: string): ChannelAccessor<HexbinDatum<TRow>, string> {
	const scale = createHexbinColorScale(color);
	let previousBins: readonly HexbinDatum<TRow>[] | undefined;
	return (bin, { data }) => {
		// A mixed plot keeps its categorical color scale; derive the single-hue ramp once per layout.
		if (data !== previousBins) {
			previousBins = data;
			scale.domain([0, data.reduce((maximum, bin) => Math.max(maximum, bin.count), 1)]);
		}
		return scale(bin.count);
	};
}

export function isHexbinDatum(value: unknown): value is ChartHexbinDatum {
	return (
		typeof value === 'object' && value !== null && Reflect.get(value, '__entasisHexbin') === true
	);
}
