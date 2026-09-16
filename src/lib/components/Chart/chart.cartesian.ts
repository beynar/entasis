import {
	areaX,
	areaY,
	barX,
	barY,
	d3AreaXCurve,
	d3Curve,
	dot,
	group,
	hexagon,
	lineY,
	stack,
	type ChannelAccessor,
	type ChartLinearGradient,
	type ChartDotStateStyle,
	type ChartMark as TanStackMark,
	type ChartMarkState,
	type ChartValue as TanStackValue,
	type SceneNode,
	type SceneRect,
	type VisualChannel
} from '@tanstack/charts';
import {
	compileChannel,
	compileColorVisual,
	compileKeyChannel,
	compileMarkChannels,
	compileNumberOrChannel,
	compilePaletteColors
} from './chart.channels.js';
import { unsupportedDiscriminant } from './chart.errors.js';
import { compileHexbinScatterMark } from './chart.hexbin.js';
import { withoutTooltipPoints } from './chart.mark.js';
import type {
	ChartBarMark,
	ChartChannel,
	ChartColor,
	ChartKey,
	ChartLineOptions,
	ChartPalette,
	ChartPointOptions,
	ChartPositionDefinition,
	ChartRequiredChannel,
	ChartScatterMark,
	ChartScatterSizeScale,
	ChartSeriesInterval,
	ChartSeriesMark,
	ChartStackLayout,
	ChartValue,
	ChartVisual
} from './chart.props.js';
import {
	isWideChannel,
	meltWideRows,
	wideKey,
	wideSeries,
	wideValue,
	type ChartWideRow
} from './chart.wide.js';
import { compileChartCurve, compileChartSizeChannel } from './chart.scale.js';

export type CompiledMark = TanStackMark<unknown, TanStackValue, TanStackValue>;

export type CompiledMarkResult =
	| {
			mark: CompiledMark;
			annotationMarks?: readonly CompiledMark[];
			requiresX: boolean;
			requiresY: boolean;
			implicitPositions?: {
				x: ChartPositionDefinition;
				y: ChartPositionDefinition;
			};
	  }
	| {
			marks: readonly CompiledMark[];
			annotationMarks?: readonly CompiledMark[];
			requiresX: boolean;
			requiresY: boolean;
			implicitPositions?: {
				x: ChartPositionDefinition;
				y: ChartPositionDefinition;
			};
	  };

export type AreaGradients = {
	definitions: readonly ChartLinearGradient[];
	vertical: ReadonlyMap<string, string>;
	horizontal: ReadonlyMap<string, string>;
};

export function compileSeriesMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSeriesMark<TRow>,
	path: string,
	gradients: AreaGradients | undefined,
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	focusAxis?: 'x' | 'y'
): CompiledMarkResult {
	const vertical = mark.direction === undefined || mark.direction === 'vertical';
	const valueChannel = vertical ? mark.y : mark.x;
	if (isWideChannel(valueChannel)) {
		return compileWideAreaSeries(data, mark, path, vertical, valueChannel, gradients, focusAxis);
	}
	const line = resolveSeriesLine(mark);
	if (!mark.area && !line && !mark.points) {
		throw new TypeError(`[Chart] ${path} must enable line, area, or points.`);
	}
	if (mark.interval && mark.area) {
		throw new TypeError(
			`[Chart] ${path}.interval cannot be combined with ${path}.area because both render a filled surface.`
		);
	}
	if (mark.interval && (mark.layout !== undefined || mark.baseline !== undefined)) {
		throw new TypeError(
			`[Chart] ${path}.interval cannot be combined with ${path}.layout or ${path}.baseline.`
		);
	}
	const compiled = mark.area
		? compileAreaSeries(data, mark, path, gradients, line, fallbackSeries, focusAxis)
		: compileLineSeries(data, mark, path, line, fallbackSeries, focusAxis);
	if (!mark.interval) return compiled;
	const interval = compileSeriesInterval(data, mark, mark.interval, path, line, fallbackSeries);
	const marks = 'marks' in compiled ? compiled.marks : [compiled.mark];
	return {
		marks: [interval, ...marks],
		annotationMarks: compiled.annotationMarks,
		requiresX: compiled.requiresX,
		requiresY: compiled.requiresY
	};
}

function compileWideAreaSeries<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSeriesMark<TRow>,
	path: string,
	vertical: boolean,
	fields: readonly string[],
	gradients: AreaGradients | undefined,
	focusAxis?: 'x' | 'y'
): CompiledMarkResult {
	const axis = vertical ? 'y' : 'x';
	validateWideMark(mark, path, axis);
	if (!mark.area || mark.layout === undefined) {
		throw new TypeError(
			`[Chart] ${path}.${axis} accepts a list of fields only on an area stack; set ${path}.area and ${path}.layout.`
		);
	}
	const rows = meltWideRows(data, fields, `${path}.${axis}`);
	const melted = {
		...mark,
		[axis]: wideValue<TRow>,
		series: wideSeries<TRow>,
		colorBy: wideSeries<TRow>,
		key: wideKey(mark.key)
	} as unknown as ChartSeriesMark<ChartWideRow<TRow>>;
	return compileAreaSeries(
		rows,
		melted,
		path,
		gradients,
		resolveSeriesLine(melted),
		undefined,
		focusAxis
	);
}

function compileSeriesInterval<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSeriesMark<TRow>,
	interval: ChartSeriesInterval<TRow>,
	path: string,
	line: ChartLineOptions<TRow> | undefined,
	fallbackSeries?: ChartChannel<TRow, ChartKey>
): CompiledMark {
	const curve = line?.curve ?? mark.curve;
	const curveFactory = curve ? compileChartCurve(curve, `${path}.curve`) : undefined;
	const style = {
		...compileMarkChannels(mark, fallbackSeries),
		id: `${mark.id ?? path}:interval`,
		fill: compileColorVisual(interval.fill ?? mark.fill ?? line?.stroke ?? mark.stroke),
		fillOpacity: interval.fillOpacity ?? 0.18
	};
	if (mark.direction === undefined || mark.direction === 'vertical') {
		return withoutTooltipPoints(
			areaY(data, {
				...style,
				x: compileChannel(mark.x),
				y1: compileChannel(interval.lower),
				y2: compileChannel(interval.upper),
				curve: curveFactory ? d3Curve(curveFactory) : undefined
			})
		);
	}
	if (mark.direction === 'horizontal') {
		return withoutTooltipPoints(
			areaX(data, {
				...style,
				x1: compileChannel(interval.lower),
				x2: compileChannel(interval.upper),
				y: compileChannel(mark.y),
				curve: curveFactory ? d3AreaXCurve(curveFactory) : undefined
			})
		);
	}
	return unsupportedDiscriminant(mark, `${path}.direction`);
}

function compileLineSeries<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSeriesMark<TRow>,
	path: string,
	line: ChartLineOptions<TRow> | undefined,
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	focusAxis?: 'x' | 'y'
): CompiledMarkResult {
	if (mark.direction === 'horizontal') {
		throw new TypeError(`[Chart] ${path}.direction "horizontal" requires ${path}.area to be true.`);
	}
	const curve = line?.curve ?? mark.curve;
	const lineMark = line
		? lineY(data, {
				...compileMarkChannels(mark, fallbackSeries),
				x: compileChannel(mark.x as ChartChannel<TRow, ChartValue>),
				y: compileChannel(mark.y as ChartChannel<TRow, number>),
				stroke: compileColorVisual(line.stroke ?? mark.stroke),
				strokeOpacity: line.strokeOpacity ?? mark.strokeOpacity,
				strokeWidth: line.strokeWidth ?? mark.strokeWidth,
				strokeDasharray: line.strokeDasharray ?? mark.strokeDasharray,
				points: false,
				curve: curve ? d3Curve(compileChartCurve(curve, `${path}.curve`)) : undefined
			})
		: undefined;
	const points = mark.points
		? compileCartesianPoints(
				data,
				mark as CartesianPointMark<TRow>,
				mark.points,
				`${path}:points`,
				fallbackSeries,
				mark.fill ?? line?.stroke ?? mark.stroke,
				false,
				focusAxis
			)
		: undefined;
	const marks = [lineMark, points].filter(
		(compiled): compiled is CompiledMark => compiled !== undefined
	);
	return {
		marks,
		annotationMarks: lineMark ? [lineMark] : points ? [points] : undefined,
		requiresX: true,
		requiresY: true
	};
}

/** A mark whose positions are known to be single channels, never wide value fields. */
type CartesianPointMark<TRow> = {
	id?: string;
	key?: ChartRequiredChannel<TRow, ChartKey>;
	series?: ChartChannel<TRow, ChartKey>;
	colorBy?: ChartChannel<TRow, ChartKey>;
	x: ChartChannel<TRow, ChartValue> | ChartChannel<TRow, number>;
	y: ChartChannel<TRow, ChartValue> | ChartChannel<TRow, number>;
};

function compileCartesianPoints<TRow extends object>(
	data: readonly TRow[],
	mark: CartesianPointMark<TRow>,
	input: true | ChartPointOptions<TRow>,
	id: string,
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	fallbackFill?: ChartVisual<TRow, ChartColor>,
	isScatter = false,
	focusAxis?: 'x' | 'y',
	radiusOverride?: number | ChannelAccessor<TRow, number | null | undefined>
): CompiledMark {
	const options = input === true ? {} : input;
	const fill = options.fill ?? fallbackFill;
	const radius = radiusOverride ?? compileNumberOrChannel(options.radius);
	const compiledFill = compileColorVisual(fill);
	const compiledStroke = compileColorVisual(options.stroke);
	const common = {
		...compileMarkChannels(mark, fallbackSeries),
		id,
		x: compileChannel(mark.x),
		y: compileChannel(mark.y),
		r: radius ?? (isScatter ? 3.5 : 2.5),
		fill: compiledFill,
		fillOpacity: options.fillOpacity ?? options.opacity,
		stroke: compiledStroke,
		strokeOpacity: options.strokeOpacity ?? options.opacity,
		strokeWidth: options.strokeWidth,
		states: compilePointFocusStates<TRow>(focusAxis)
	};
	if (options.shape === 'hexagon') return hexagon(data, common);
	const pointMark = dot(data, {
		...common,
		fill: typeof compiledFill === 'string' ? compiledFill : undefined,
		stroke: typeof compiledStroke === 'string' ? compiledStroke : undefined
	});
	return applyDotVisualChannels(pointMark, data, compiledFill, compiledStroke);
}

function applyDotVisualChannels<TRow, TXValue extends TanStackValue, TYValue extends TanStackValue>(
	mark: TanStackMark<TRow, TXValue, TYValue>,
	data: readonly TRow[],
	fill: VisualChannel<TRow, string> | undefined,
	stroke: VisualChannel<TRow, string> | undefined
): TanStackMark<TRow, TXValue, TYValue> {
	if (typeof fill !== 'function' && typeof stroke !== 'function') return mark;
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					return {
						...rendered,
						nodes: rendered.nodes.map((node) => applyDotVisualNode(node, data, fill, stroke))
					};
				}
			};
		}
	};
}

function applyDotVisualNode<TRow>(
	node: SceneNode,
	data: readonly TRow[],
	fill: VisualChannel<TRow, string> | undefined,
	stroke: VisualChannel<TRow, string> | undefined
): SceneNode {
	if (node.kind === 'group') {
		return {
			...node,
			children: node.children.map((child) => applyDotVisualNode(child, data, fill, stroke))
		};
	}
	if (node.kind !== 'dot' || !node.interaction?.point) return node;
	const point = node.interaction.point;
	const datum = data[point.datumIndex];
	if (datum === undefined) return node;
	const context = { index: point.datumIndex, data };
	const resolvedFill = typeof fill === 'function' ? fill(datum, context) : node.style?.fill;
	const resolvedStroke = typeof stroke === 'function' ? stroke(datum, context) : node.style?.stroke;
	return {
		...node,
		interaction: {
			...node.interaction,
			point: {
				...point,
				color: resolvedFill ?? point.color
			}
		},
		style: {
			...node.style,
			fill: resolvedFill,
			stroke: resolvedStroke
		}
	};
}

function compilePointFocusStates<TRow>(
	focusAxis: 'x' | 'y' | undefined
): readonly ChartMarkState<TRow, ChartDotStateStyle<TRow>>[] | undefined {
	if (!focusAxis) return undefined;
	return [
		{ when: { focus: focusAxis }, style: { r: 5 } },
		{ when: { focus: 'unmatched' }, style: { opacity: 0.3 } }
	];
}

export function compileScatterMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartScatterMark<TRow>,
	path: string,
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	focusAxis?: 'x' | 'y',
	useColorScale = true
): CompiledMarkResult {
	const variant: unknown = Reflect.get(mark, 'variant');
	if (variant !== undefined && variant !== 'points' && variant !== 'hexbin') {
		throw new TypeError(`[Chart] ${path}.variant "${String(variant)}" is not supported.`);
	}
	if (mark.variant === 'hexbin') return compileHexbinScatterMark(data, mark, path, useColorScale);
	validateScatterSizeScale(mark.size, mark.sizeScale, path);
	const radius =
		mark.size !== undefined && typeof mark.size !== 'number'
			? compileChartSizeChannel(compileChannel(mark.size), mark.sizeScale, `${path}.sizeScale`)
			: mark.size;
	const points = compileCartesianPoints(
		data,
		mark,
		{
			shape: mark.shape,
			fill: mark.fill,
			fillOpacity: mark.fillOpacity,
			stroke: mark.stroke,
			strokeOpacity: mark.strokeOpacity,
			strokeWidth: mark.strokeWidth,
			opacity: mark.opacity
		},
		mark.id ?? `${path}:points`,
		fallbackSeries,
		undefined,
		true,
		focusAxis,
		radius
	);
	return { mark: points, annotationMarks: [points], requiresX: true, requiresY: true };
}

function validateScatterSizeScale<TRow extends object>(
	size: number | ChartChannel<TRow, number> | undefined,
	sizeScale: ChartScatterSizeScale | undefined,
	path: string
): void {
	if (sizeScale === undefined || (size !== undefined && typeof size !== 'number')) return;
	throw new TypeError(`[Chart] ${path}.sizeScale requires ${path}.size to be a data channel.`);
}

export function compileAreaGradients(
	palette: ChartPalette | undefined,
	path: string
): AreaGradients {
	const colors = compilePaletteColors(palette);
	const prefix = `${path || 'root'}-area`.replaceAll(/[^a-zA-Z0-9_-]/g, '-');
	const vertical = new Map<string, string>();
	const horizontal = new Map<string, string>();
	const definitions: ChartLinearGradient[] = [];
	colors.forEach((color, index) => {
		const verticalId = `${prefix}-vertical-${index}`;
		const horizontalId = `${prefix}-horizontal-${index}`;
		vertical.set(color, verticalId);
		horizontal.set(color, horizontalId);
		definitions.push(
			{
				id: verticalId,
				y1: 1,
				y2: 0,
				stops: [
					{ offset: 0, color, opacity: 0.45 },
					{ offset: 1, color, opacity: 0.85 }
				]
			},
			{
				id: horizontalId,
				x1: 0,
				x2: 1,
				y1: 0,
				y2: 0,
				stops: [
					{ offset: 0, color, opacity: 0.45 },
					{ offset: 1, color, opacity: 0.85 }
				]
			}
		);
	});
	return { definitions, vertical, horizontal };
}

function compileAreaSeries<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSeriesMark<TRow>,
	path: string,
	gradients: AreaGradients | undefined,
	line: ChartLineOptions<TRow> | undefined,
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	focusAxis?: 'x' | 'y'
): CompiledMarkResult {
	const curve = line?.curve ?? mark.curve;
	const curveFactory = curve ? compileChartCurve(curve, `${path}.curve`) : undefined;
	const lineCurve = curveFactory ? d3Curve(curveFactory) : undefined;
	const style = {
		...compileMarkChannels(mark, fallbackSeries),
		fill: compileColorVisual(mark.fill),
		fillOpacity: mark.fillOpacity,
		stroke: line ? compileColorVisual(line.stroke ?? mark.stroke ?? mark.fill) : undefined,
		strokeWidth: line ? (line.strokeWidth ?? mark.strokeWidth ?? 2) : undefined
	};

	if (mark.direction === undefined || mark.direction === 'vertical') {
		const compiled = areaY(data, {
			...style,
			x: compileChannel(mark.x as ChartChannel<TRow, ChartValue>),
			y: compileChannel(mark.y as ChartChannel<TRow, number>),
			y1: compileNumberOrChannel(mark.baseline),
			layout: compileStackLayout(mark.layout, `${path}.layout`),
			curve: lineCurve
		});
		const area = applyAreaPresentation(compiled, 'vertical', gradients, {
			curve: lineCurve,
			strokeOpacity: line?.strokeOpacity ?? mark.strokeOpacity,
			strokeDasharray: line?.strokeDasharray ?? mark.strokeDasharray,
			hasLine: line !== undefined
		});
		const points = mark.points
			? alignAreaPoints(
					compileCartesianPoints(
						data,
						mark as CartesianPointMark<TRow>,
						mark.points,
						`${path}:points`,
						fallbackSeries,
						mark.fill ?? line?.stroke ?? mark.stroke,
						false,
						focusAxis
					),
					area
				)
			: undefined;
		return {
			marks: points ? [area, points] : [area],
			annotationMarks: [area],
			requiresX: true,
			requiresY: true
		};
	}

	if (mark.direction === 'horizontal') {
		const compiled = areaX(data, {
			...style,
			x: compileChannel(mark.x as ChartChannel<TRow, number>),
			x1: compileNumberOrChannel(mark.baseline),
			y: compileChannel(mark.y as ChartChannel<TRow, ChartValue>),
			layout: compileStackLayout(mark.layout, `${path}.layout`),
			curve: curveFactory ? d3AreaXCurve(curveFactory) : undefined
		});
		const area = applyAreaPresentation(compiled, 'horizontal', gradients, {
			curve: lineCurve,
			strokeOpacity: line?.strokeOpacity ?? mark.strokeOpacity,
			strokeDasharray: line?.strokeDasharray ?? mark.strokeDasharray,
			hasLine: line !== undefined
		});
		const points = mark.points
			? alignAreaPoints(
					compileCartesianPoints(
						data,
						mark as CartesianPointMark<TRow>,
						mark.points,
						`${path}:points`,
						fallbackSeries,
						mark.fill ?? line?.stroke ?? mark.stroke,
						false,
						focusAxis
					),
					area
				)
			: undefined;
		return {
			marks: points ? [area, points] : [area],
			annotationMarks: [area],
			requiresX: true,
			requiresY: true
		};
	}

	return unsupportedDiscriminant(mark, `${path}.direction`);
}

export function compileBarMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartBarMark<TRow>,
	path: string,
	fallbackSeries?: ChartChannel<TRow, ChartKey>
): CompiledMarkResult {
	const vertical = mark.direction === undefined || mark.direction === 'vertical';
	const valueChannel = vertical ? mark.y : mark.x;
	if (isWideChannel(valueChannel)) {
		return compileWideBarMark(data, mark, path, vertical, valueChannel);
	}
	if (mark.variant && mark.series === undefined && mark.colorBy === undefined) {
		throw new TypeError(
			`[Chart] ${path}.variant "${mark.variant}" requires ${path}.series or ${path}.colorBy.`
		);
	}
	const style = {
		...compileMarkChannels(mark, fallbackSeries),
		fill: compileColorVisual(mark.fill),
		fillOpacity: mark.fillOpacity,
		inset: mark.inset,
		radius: mark.radius
	};

	if (vertical) {
		const compiled = withStackGap(
			barY(data, {
				...style,
				x: compileChannel(mark.x as ChartChannel<TRow, ChartValue>),
				y: compileChannel(mark.y as ChartChannel<TRow, number>),
				y1: compileNumberOrChannel(mark.baseline),
				layout: compileBarVariant(mark, `${path}.variant`)
			}),
			mark,
			'vertical',
			path
		);
		return {
			mark: compiled,
			annotationMarks: [compiled],
			requiresX: true,
			requiresY: true
		};
	}

	if (mark.direction === 'horizontal') {
		const compiled = withStackGap(
			barX(data, {
				...style,
				x: compileChannel(mark.x as ChartChannel<TRow, number>),
				x1: compileNumberOrChannel(mark.baseline),
				y: compileChannel(mark.y as ChartChannel<TRow, ChartValue>),
				layout: compileBarVariant(mark, `${path}.variant`)
			}),
			mark,
			'horizontal',
			path
		);
		return {
			mark: compiled,
			annotationMarks: [compiled],
			requiresX: true,
			requiresY: true
		};
	}

	return unsupportedDiscriminant(mark, `${path}.direction`);
}

function compileWideBarMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartBarMark<TRow>,
	path: string,
	vertical: boolean,
	fields: readonly string[]
): CompiledMarkResult {
	const axis = vertical ? 'y' : 'x';
	validateWideMark(mark, path, axis);
	const rows = meltWideRows(data, fields, `${path}.${axis}`);
	const style = {
		id: mark.id,
		key: compileKeyChannel(wideKey(mark.key)),
		z: wideSeries<TRow>,
		color: wideSeries<TRow>,
		fill: compileColorVisual<ChartWideRow<TRow>>(mark.fill),
		fillOpacity: mark.fillOpacity,
		inset: mark.inset,
		radius: mark.radius
	};
	const layout = compileBarVariant(mark, `${path}.variant`);
	const compiled = withStackGap(
		vertical
			? barY(rows, {
					...style,
					x: compileChannel(mark.x as ChartChannel<ChartWideRow<TRow>, ChartValue>),
					y: wideValue<TRow>,
					layout
				})
			: barX(rows, {
					...style,
					x: wideValue<TRow>,
					y: compileChannel(mark.y as ChartChannel<ChartWideRow<TRow>, ChartValue>),
					layout
				}),
		mark,
		vertical ? 'vertical' : 'horizontal',
		path
	);
	return { mark: compiled, annotationMarks: [compiled], requiresX: true, requiresY: true };
}

export function validateWideMark(
	mark: { variant?: string; annotations?: readonly unknown[]; analysis?: readonly unknown[] },
	path: string,
	axis: 'x' | 'y'
): void {
	if (mark.annotations !== undefined) {
		throw new TypeError(
			`[Chart] ${path}.annotations cannot be combined with a wide ${path}.${axis} because the melted rows own their own keys.`
		);
	}
	if (mark.analysis !== undefined) {
		throw new TypeError(
			`[Chart] ${path}.analysis cannot be combined with a wide ${path}.${axis} because the displayed values are transformed by the stack layout.`
		);
	}
}

/**
 * Segment gap for a stacked bar. TanStack bars expose `inset` (both categorical edges) and
 * `maxThickness`, but nothing between the segments of one stack, and the stack layout owns
 * the value positions, so the gap is taken out of the painted rectangles after layout:
 * every segment that has a neighbour before it on the value axis is shortened on that side.
 * Points, semantic values, and stack totals are untouched, so the tooltip still reads the
 * real values and hit testing still resolves through each bar's `x` affinity.
 */
function withStackGap<TRow>(
	mark: CompiledMark,
	source: ChartBarMark<TRow>,
	direction: 'vertical' | 'horizontal',
	path: string
): CompiledMark {
	const gap = source.variant === 'stack' ? source.gap : undefined;
	if (gap === undefined) return mark;
	if (!Number.isFinite(gap) || gap < 0) {
		throw new TypeError(`[Chart] ${path}.gap must be a finite number of pixels of 0 or more.`);
	}
	if (gap === 0) return mark;
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					return { ...rendered, nodes: applyStackGap(rendered.nodes, gap, direction) };
				}
			};
		}
	};
}

function applyStackGap(
	nodes: readonly SceneNode[],
	gap: number,
	direction: 'vertical' | 'horizontal'
): readonly SceneNode[] {
	const rects: SceneRect[] = [];
	const collect = (children: readonly SceneNode[]) => {
		for (const node of children) {
			if (node.kind === 'group') collect(node.children);
			else if (node.kind === 'rect') rects.push(node);
		}
	};
	collect(nodes);
	// A segment is shortened only on the edge it shares with the previous segment of the same
	// stack, so the segment sitting on the baseline keeps its full extent and the stack total
	// still reaches the same end.
	const shrunk = new Map<SceneNode, SceneNode>();
	for (const rect of rects) {
		const shares = rects.some((other) => {
			if (other === rect) return false;
			if (direction === 'vertical') {
				if (Math.abs(other.x - rect.x) > 0.5) return false;
				return Math.abs(other.y - (rect.y + rect.height)) < 0.5;
			}
			if (Math.abs(other.y - rect.y) > 0.5) return false;
			return Math.abs(other.x + other.width - rect.x) < 0.5;
		});
		if (!shares) continue;
		shrunk.set(
			rect,
			direction === 'vertical'
				? { ...rect, height: Math.max(0, rect.height - gap) }
				: { ...rect, x: rect.x + gap, width: Math.max(0, rect.width - gap) }
		);
	}
	if (shrunk.size === 0) return nodes;
	const map = (children: readonly SceneNode[]): readonly SceneNode[] =>
		children.map((node) =>
			node.kind === 'group' ? { ...node, children: map(node.children) } : (shrunk.get(node) ?? node)
		);
	return map(nodes);
}

function resolveSeriesLine<TRow>(mark: ChartSeriesMark<TRow>): ChartLineOptions<TRow> | undefined {
	if (mark.line === false) return undefined;
	return mark.line === undefined || mark.line === true ? {} : mark.line;
}

function applyAreaPresentation<TRow, TXValue extends TanStackValue, TYValue extends TanStackValue>(
	mark: TanStackMark<TRow, TXValue, TYValue>,
	direction: 'vertical' | 'horizontal',
	gradients: AreaGradients | undefined,
	line: {
		curve: ReturnType<typeof d3Curve> | undefined;
		strokeOpacity: number | undefined;
		strokeDasharray: string | undefined;
		hasLine: boolean;
	}
): TanStackMark<TRow, TXValue, TYValue> {
	const ids = gradients
		? direction === 'vertical'
			? gradients.vertical
			: gradients.horizontal
		: undefined;
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					return {
						...rendered,
						nodes: rendered.nodes.map((node) => presentAreaNode(node, ids, line))
					};
				}
			};
		}
	};
}

function alignAreaPoints(pointMark: CompiledMark, areaMark: CompiledMark): CompiledMark {
	return {
		...pointMark,
		initialize(context) {
			const initializedPoints = pointMark.initialize(context);
			const initializedArea = areaMark.initialize(context);
			return {
				...initializedPoints,
				render(renderContext) {
					const pointScene = initializedPoints.render(renderContext);
					const areaScene = initializedArea.render(renderContext);
					const areaPositionByDatum = new Map(
						(areaScene.points ?? []).map((point) => [point.datumIndex, { x: point.x, y: point.y }])
					);
					const points = (pointScene.points ?? []).map((point) => {
						const position = areaPositionByDatum.get(point.datumIndex);
						if (!position) {
							throw new Error('[Chart] Area point could not resolve its rendered position.');
						}
						return { ...point, ...position };
					});
					const positionByKey = new Map(
						points.map((point) => [point.key, { x: point.x, y: point.y }])
					);
					return {
						...pointScene,
						nodes: pointScene.nodes.map((node) => alignPointNode(node, positionByKey)),
						points
					};
				}
			};
		}
	};
}

function alignPointNode(
	node: SceneNode,
	positionByKey: ReadonlyMap<string, { x: number; y: number }>
): SceneNode {
	if (node.kind === 'group') {
		return {
			...node,
			children: node.children.map((child) => alignPointNode(child, positionByKey))
		};
	}
	if (node.kind !== 'dot') return node;
	const position = positionByKey.get(node.key);
	return position ? { ...node, ...position } : node;
}

function presentAreaNode(
	node: SceneNode,
	ids: ReadonlyMap<string, string> | undefined,
	line: {
		curve: ReturnType<typeof d3Curve> | undefined;
		strokeOpacity: number | undefined;
		strokeDasharray: string | undefined;
		hasLine: boolean;
	}
): SceneNode {
	if (node.kind === 'group') {
		return {
			...node,
			children: node.children.map((child) => presentAreaNode(child, ids, line))
		};
	}
	if (node.kind !== 'area' || !node.style?.fill) return node;
	const id = ids?.get(node.style.fill);
	const fill = {
		...node,
		key: `${node.key}:fill`,
		style: {
			...node.style,
			fill: id ? `url(#${id})` : node.style.fill,
			stroke: undefined,
			strokeWidth: undefined
		}
	};
	if (!line.hasLine) return fill;

	const points = node.points.slice(0, node.points.length / 2);
	return {
		kind: 'group',
		key: node.key,
		children: [
			fill,
			{
				kind: 'polyline',
				key: `${node.key}:line`,
				points,
				path: line.curve?.line(points),
				style: {
					fill: 'none',
					stroke: node.style.stroke ?? node.style.fill,
					strokeOpacity: line.strokeOpacity,
					strokeWidth: node.style.strokeWidth,
					strokeDasharray: line.strokeDasharray,
					lineCap: 'round',
					lineJoin: 'round'
				}
			}
		]
	};
}

function compileStackLayout(
	layout: ChartStackLayout | undefined,
	path: string
): ReturnType<typeof stack> | undefined {
	if (layout === undefined) return undefined;
	const type = layout.type;
	if (type !== 'stack') return unsupportedDiscriminant(type, `${path}.type`);
	return stack({ order: layout.order, offset: layout.offset, reverse: layout.reverse });
}

function compileBarVariant<TRow>(
	mark: ChartBarMark<TRow>,
	path: string
): ReturnType<typeof stack> | ReturnType<typeof group> | undefined {
	switch (mark.variant) {
		case undefined:
			return undefined;
		case 'stack':
			return stack({ order: mark.order, offset: mark.offset, reverse: mark.reverse });
		case 'group':
			return group({ padding: mark.padding });
		default:
			return unsupportedDiscriminant(mark, path);
	}
}
