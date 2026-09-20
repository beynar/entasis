import {
	type ChartMark as TanStackMark,
	type ChartValue as TanStackValue,
	type SceneNode
} from '@tanstack/charts';
import { polar, radialArc } from '@tanstack/charts/polar';
import { pie } from 'd3-shape';
import type { CompiledMark } from './chart.cartesian.js';
import { chartKeyIdentity, type CompiledChartChannel } from './chart.channels.js';
import type { ChartKey, ChartProportionMark } from './chart.props.js';

type ProportionAccessor<TRow, TValue> = CompiledChartChannel<TRow, TValue>;

type NormalizedProportionVariant =
	| { type: 'pie'; padAngle: number; cornerRadius: number }
	| { type: 'donut'; innerRadius: number; padAngle: number; cornerRadius: number }
	| { type: 'waffle'; cells: number; columns: number; gap: number; radius: number };

export type ProportionDatum = {
	readonly __entasisProportion: true;
	readonly __entasisSourceRows: readonly object[];
	readonly identity: string;
	readonly category: ChartKey;
	readonly value: number;
	readonly share: number;
};

type ProportionSlice = ProportionDatum & {
	readonly startAngle: number;
	readonly endAngle: number;
	readonly padAngle: number;
};

type WaffleCell = {
	readonly summary: ProportionDatum;
	readonly summaryIndex: number;
	readonly ordinal: number;
	readonly index: number;
};

type CompileProportionInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly mark: ChartProportionMark<TRow>;
	readonly path: string;
	readonly category: ProportionAccessor<TRow, ChartKey>;
	readonly value: ProportionAccessor<TRow, number>;
};

export function compileProportion<TRow extends object>({
	data,
	mark,
	path,
	category,
	value
}: CompileProportionInput<TRow>): readonly CompiledMark[] {
	const variant = normalizeProportionVariant(mark, path);
	const summaries = summarizeProportions(data, category, value, path);
	const id = mark.id ?? path;
	return variant.type === 'waffle'
		? compileWaffle(summaries, variant, id)
		: compileArcs(summaries, variant, id);
}

export function isProportionDatum(value: unknown): value is ProportionDatum {
	return (
		typeof value === 'object' && value !== null && Reflect.get(value, '__entasisProportion') === true
	);
}

function normalizeProportionVariant<TRow>(
	mark: ChartProportionMark<TRow>,
	path: string
): NormalizedProportionVariant {
	const input = mark.variant;
	const type = typeof input === 'string' ? input : input.type;
	if (type === 'pie') {
		const options = typeof input === 'object' && input.type === 'pie' ? input : undefined;
		return {
			type: 'pie',
			padAngle: nonnegativeNumber(options?.padAngle ?? 0.012, `${path}.variant.padAngle`),
			cornerRadius: nonnegativeNumber(options?.cornerRadius ?? 3, `${path}.variant.cornerRadius`)
		};
	}
	if (type === 'donut') {
		const options = typeof input === 'object' && input.type === 'donut' ? input : undefined;
		const innerRadius = options?.innerRadius ?? 0.58;
		if (!Number.isFinite(innerRadius) || innerRadius < 0 || innerRadius >= 1) {
			throw new TypeError(
				`[Chart] ${path}.variant.innerRadius must be a finite number greater than or equal to 0 and less than 1.`
			);
		}
		return {
			type: 'donut',
			innerRadius,
			padAngle: nonnegativeNumber(options?.padAngle ?? 0.012, `${path}.variant.padAngle`),
			cornerRadius: nonnegativeNumber(options?.cornerRadius ?? 5, `${path}.variant.cornerRadius`)
		};
	}
	if (type === 'waffle') {
		const options = typeof input === 'object' && input.type === 'waffle' ? input : undefined;
		const cells = positiveInteger(options?.cells ?? 100, `${path}.variant.cells`);
		return {
			type: 'waffle',
			cells,
			columns: Math.min(positiveInteger(options?.columns ?? 10, `${path}.variant.columns`), cells),
			gap: nonnegativeNumber(options?.gap ?? 3, `${path}.variant.gap`),
			radius: nonnegativeNumber(options?.radius ?? 2, `${path}.variant.radius`)
		};
	}
	throw new TypeError(`[Chart] ${path}.variant.type "${String(type)}" is not supported.`);
}

function summarizeProportions<TRow extends object>(
	data: readonly TRow[],
	categoryAccessor: ProportionAccessor<TRow, ChartKey>,
	valueAccessor: ProportionAccessor<TRow, number>,
	path: string
): readonly ProportionDatum[] {
	const categories = new Map<string, { category: ChartKey; value: number; rows: TRow[] }>();
	data.forEach((row, index) => {
		const context = { index, data };
		const category = categoryAccessor(row, context);
		const value = valueAccessor(row, context);
		if (value === null || value === undefined) return;
		if (typeof category !== 'string' && typeof category !== 'number') {
			throw new TypeError(
				`[Chart] ${path}.category must produce a string or number at data[${index}].`
			);
		}
		if (!Number.isFinite(value) || value < 0) {
			throw new TypeError(
				`[Chart] ${path}.value must produce a finite non-negative number at data[${index}].`
			);
		}
		const identity = chartKeyIdentity(category);
		const current = categories.get(identity);
		if (current) {
			current.value += value;
			current.rows.push(row);
		} else categories.set(identity, { category, value, rows: [row] });
	});

	const entries = [...categories].filter(([, entry]) => entry.value > 0);
	const total = entries.reduce((sum, [, entry]) => sum + entry.value, 0);
	if (total === 0) return [];
	return entries.map(([identity, entry]) => ({
		__entasisProportion: true,
		__entasisSourceRows: entry.rows,
		identity,
		category: entry.category,
		value: entry.value,
		share: entry.value / total
	}));
}

function compileArcs(
	summaries: readonly ProportionDatum[],
	variant: Exclude<NormalizedProportionVariant, { type: 'waffle' }>,
	id: string
): readonly CompiledMark[] {
	const createLayout = pie<ProportionDatum>()
		.sort(null)
		.value((summary) => summary.value)
		.padAngle(variant.padAngle);
	const slices: readonly ProportionSlice[] = createLayout([...summaries]).map((arc) => ({
		...arc.data,
		startAngle: arc.startAngle,
		endAngle: arc.endAngle,
		padAngle: arc.padAngle
	}));
	const innerRadius =
		variant.type === 'donut' ? ({ radius }: { radius: number }) => radius * variant.innerRadius : 0;
	const arcOptions = {
		key: 'identity',
		color: 'category',
		startAngle: 'startAngle',
		endAngle: 'endAngle',
		padAngle: 'padAngle',
		innerRadius,
		cornerRadius: variant.cornerRadius,
		stroke: 'var(--color-surface)',
		strokeWidth: 2
	} as const;
	const base = polar({
		id,
		marks: [
			radialArc(slices, {
				...arcOptions,
				id: `${id}:slices`,
				fillOpacity: 0.88
			})
		],
		scales: { angle: null, radius: null },
		inset: 16,
		radiusRatio: 0.92
	});
	return [base];
}

function compileWaffle(
	summaries: readonly ProportionDatum[],
	variant: Extract<NormalizedProportionVariant, { type: 'waffle' }>,
	id: string
): readonly CompiledMark[] {
	const cells = allocateWaffleCells(summaries, variant.cells);
	return [waffleMark(summaries, cells, variant, id)];
}

function allocateWaffleCells(
	summaries: readonly ProportionDatum[],
	cellCount: number
): readonly WaffleCell[] {
	const allocations = summaries.map((summary, summaryIndex) => {
		const exact = summary.share * cellCount;
		return { summaryIndex, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
	});
	let remaining = cellCount - allocations.reduce((sum, allocation) => sum + allocation.count, 0);
	for (const allocation of allocations.toSorted(
		(left, right) => right.remainder - left.remainder || left.summaryIndex - right.summaryIndex
	)) {
		if (remaining === 0) break;
		allocation.count += 1;
		remaining -= 1;
	}

	const cells: WaffleCell[] = [];
	allocations.forEach((allocation) => {
		const summary = summaries[allocation.summaryIndex];
		if (!summary) return;
		for (let ordinal = 0; ordinal < allocation.count; ordinal += 1) {
			cells.push({ summary, summaryIndex: allocation.summaryIndex, ordinal, index: cells.length });
		}
	});
	return cells;
}

function waffleMark(
	summaries: readonly ProportionDatum[],
	cells: readonly WaffleCell[],
	variant: Extract<NormalizedProportionVariant, { type: 'waffle' }>,
	id: string
): TanStackMark<ProportionDatum, TanStackValue, TanStackValue, never, never> {
	return {
		initialize() {
			return {
				id,
				channels: {
					color: { scale: 'color', values: summaries.map((summary) => summary.category) }
				},
				seriesFromColor: true,
				render({ chart, color: resolveColor }) {
					const rows = Math.ceil(variant.cells / variant.columns);
					const side = Math.min(chart.width, chart.height) * 0.86;
					const gap = Math.min(variant.gap, side / (Math.max(variant.columns, rows) * 2));
					const size = Math.max(
						0,
						Math.min(
							(side - gap * (variant.columns - 1)) / variant.columns,
							(side - gap * (rows - 1)) / rows
						)
					);
					const width = size * variant.columns + gap * (variant.columns - 1);
					const height = size * rows + gap * (rows - 1);
					const originX = chart.x + (chart.width - width) / 2;
					const originY = chart.y + (chart.height - height) / 2;
					const nodes: SceneNode[] = [];
					const points = cells.map((cell) => {
						const column = cell.index % variant.columns;
						const row = Math.floor(cell.index / variant.columns);
						const x = originX + column * (size + gap);
						const y = originY + (rows - row - 1) * (size + gap);
						const fill = resolveColor(cell.summary.category);
						const key = `${id}:${cell.summary.identity}:${cell.ordinal}`;
						nodes.push({
							kind: 'rect',
							key,
							x,
							y,
							width: size,
							height: size,
							radius: variant.radius,
							style: {
								fill,
								fillOpacity: 0.86
							}
						});
						return {
							key,
							markId: id,
							group: cell.summary.category,
							groupLabel: String(cell.summary.category),
							datum: cell.summary,
							datumIndex: cell.summaryIndex,
							xValue: column,
							yValue: row,
							x: x + size / 2,
							y: y + size / 2,
							color: fill
						};
					});
					return {
						nodes: [
							{
								kind: 'group',
								key: id,
								className: 'ts-chart__proportion ts-chart__proportion--waffle',
								ariaHidden: true,
								children: nodes
							}
						],
						points
					};
				}
			};
		}
	};
}

function positiveInteger(value: number, path: string): number {
	if (!Number.isInteger(value) || value <= 0) {
		throw new TypeError(`[Chart] ${path} must be a positive integer.`);
	}
	return value;
}

function nonnegativeNumber(value: number, path: string): number {
	if (!Number.isFinite(value) || value < 0) {
		throw new TypeError(`[Chart] ${path} must be a finite non-negative number.`);
	}
	return value;
}
