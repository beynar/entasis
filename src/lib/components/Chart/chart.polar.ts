import {
	type ChartMark as TanStackMark,
	type ChartValue as TanStackValue,
	type SceneLabel,
	type SceneNode
} from '@tanstack/charts';
import {
	angleGrid,
	polar,
	radialArea,
	radialBarRadius,
	radialDot,
	radialGrid,
	radialLine,
	type PolarGuide,
	type PolarMark,
	type PolarOptions
} from '@tanstack/charts/polar';
import {
	compileChannel,
	compileColor,
	compileColorVisual,
	compileMarkChannels
} from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { CHART_FIT_MARGIN, estimateLabelWidth, LABEL_LINE_BOX } from './chart.fit.js';
import type {
	ChartNumericScaleDefinition,
	ChartPolarMark,
	ChartScaleDefinition
} from './chart.props.js';
import { compileChartCurve, compileChartScale } from './chart.scale.js';

type PolarPathMark<TRow> = Extract<ChartPolarMark<TRow>, { variant: 'circular' | 'radar' }>;
type PolarBarMark<TRow> = Extract<ChartPolarMark<TRow>, { variant: 'radial-bar' | 'rose' }>;

export function compilePolarChartMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartPolarMark<TRow>,
	path: string
): CompiledMark {
	let marks: readonly PolarMark<unknown, TanStackValue, TanStackValue>[];
	switch (mark.variant) {
		case 'circular':
		case 'radar':
			marks = compilePolarLayers(data, mark, path);
			break;
		case 'radial-bar':
		case 'rose':
			marks = [compilePolarBars(data, mark, path)];
			break;
		default:
			throw new TypeError(
				`[Chart] ${path}.variant "${String(readPolarVariant(mark))}" is not supported.`
			);
	}
	const isBar = mark.variant === 'radial-bar' || mark.variant === 'rose';
	const innerRadius = isBar ? resolvePolarInnerRadius(mark, path) : 0;
	const angleScale: ChartScaleDefinition =
		mark.angleScale ?? (isBar ? { type: 'band', padding: 0.08 } : { type: 'point', padding: 0 });
	const radiusScale: ChartNumericScaleDefinition = mark.radiusScale ?? {
		type: mark.variant === 'rose' ? 'sqrt' : 'linear',
		domain: mark.domain
	};
	if (mark.domain && mark.radiusScale?.domain) {
		throw new TypeError(
			`[Chart] ${path}.domain cannot be combined with ${path}.radiusScale.domain.`
		);
	}
	const radiusRatio = mark.radiusRatio ?? 1;
	// TanStack reads `inset` from these options on every render, which lets `fitPolarToPlot`
	// size the circle to the plot it is drawn in.
	const options: PolarOptions<typeof marks> = {
		id: mark.id,
		marks,
		guides: compilePolarGuides(mark),
		scales: {
			angle: {
				scale: compileChartScale(angleScale, `${path}.angleScale`),
				wrap: true
			},
			radius: {
				scale: compileChartScale(radiusScale, `${path}.radiusScale`),
				range:
					innerRadius > 0
						? [({ radius }) => radius * innerRadius, ({ radius }) => radius]
						: undefined
			}
		},
		startAngle: mark.startAngle,
		endAngle: mark.endAngle,
		inset: mark.inset ?? 24,
		radiusRatio
	};
	return fitPolarToPlot(polar(options), {
		options,
		fit: mark.inset === undefined,
		radar: mark.variant === 'radar',
		shapeMargin: CHART_FIT_MARGIN + polarShapeOverhang(mark)
	});
}

function compilePolarLayers<TRow extends object>(
	data: readonly TRow[],
	mark: PolarPathMark<TRow>,
	path: string
): readonly PolarMark<unknown, TanStackValue, TanStackValue>[] {
	const isDefault = mark.area === undefined && mark.line === undefined && mark.points === undefined;
	const hasArea = Boolean(mark.area);
	const hasLine = isDefault || Boolean(mark.line);
	const hasPoints = Boolean(mark.points);
	if (!hasArea && !hasLine && !hasPoints) {
		throw new TypeError(`[Chart] ${path} must enable area, line, or points.`);
	}
	const curve = compileChartCurve(mark.curve ?? 'linear-closed', `${path}.curve`);
	const color = mark.color === undefined ? undefined : compileColor(mark.color);
	const marks: PolarMark<unknown, TanStackValue, TanStackValue>[] = [];
	if (hasArea) {
		marks.push(
			radialArea(data, {
				...compileMarkChannels(mark),
				id: `${path}:area`,
				angle: compileChannel(mark.angle),
				radius: compileChannel(mark.radius),
				curve,
				fill: compileColorVisual(mark.fill) ?? color,
				fillOpacity: mark.fillOpacity ?? 0.18
			})
		);
	}
	if (hasLine) {
		marks.push(compilePolarLine(data, mark, curve, color, `${path}:line`));
	}
	if (hasPoints) {
		marks.push(compilePolarPoints(data, mark, color, `${path}:points`));
	}
	return marks;
}

function compilePolarLine<TRow extends object>(
	data: readonly TRow[],
	mark: PolarPathMark<TRow>,
	curve: ReturnType<typeof compileChartCurve>,
	color: string | undefined,
	id: string
): PolarMark<unknown, TanStackValue, TanStackValue> {
	return radialLine(data, {
		...compileMarkChannels(mark),
		id,
		angle: compileChannel(mark.angle),
		radius: compileChannel(mark.radius),
		curve,
		stroke: compileColorVisual(mark.stroke) ?? color,
		strokeOpacity: mark.strokeOpacity,
		strokeWidth: mark.strokeWidth ?? 2.25,
		strokeDasharray: mark.strokeDasharray
	});
}

function compilePolarPoints<TRow extends object>(
	data: readonly TRow[],
	mark: PolarPathMark<TRow>,
	color: string | undefined,
	id: string
): PolarMark<unknown, TanStackValue, TanStackValue> {
	return radialDot(data, {
		...compileMarkChannels(mark),
		id,
		angle: compileChannel(mark.angle),
		radius: compileChannel(mark.radius),
		r: mark.pointRadius ?? 3.5,
		fill: color
	});
}

function compilePolarBars<TRow extends object>(
	data: readonly TRow[],
	mark: PolarBarMark<TRow>,
	path: string
): PolarMark<unknown, TanStackValue, TanStackValue> {
	const angle = compileChannel(mark.angle);
	const radius = compileChannel(mark.radius);
	const color = mark.color === undefined ? undefined : compileColor(mark.color);
	return radialBarRadius(data, {
		...compileMarkChannels(mark),
		id: `${path}:bars`,
		angle,
		radius,
		radius1: 0,
		cornerRadius: mark.cornerRadius,
		fill: compileColorVisual(mark.fill) ?? color,
		fillOpacity: mark.fillOpacity ?? 0.82,
		stroke: compileColorVisual(mark.stroke),
		strokeOpacity: mark.strokeOpacity,
		strokeWidth: mark.strokeWidth
	});
}

function resolvePolarInnerRadius<TRow>(mark: PolarBarMark<TRow>, path: string): number {
	const innerRadius = mark.innerRadius ?? 0;
	if (!Number.isFinite(innerRadius) || innerRadius < 0 || innerRadius >= 1) {
		throw new TypeError(
			`[Chart] ${path}.innerRadius must be greater than or equal to 0 and less than 1.`
		);
	}
	return innerRadius;
}

function compilePolarGuides<TRow extends object>(
	mark: ChartPolarMark<TRow>
): readonly PolarGuide[] | undefined {
	if (mark.guides === false) return undefined;
	const shape = mark.variant === 'radar' ? 'polygon' : 'circle';
	return [radialGrid({ ticks: 5, shape, strokeOpacity: 0.14 }), angleGrid({ strokeOpacity: 0.14 })];
}

type PolarFit = {
	/** The options TanStack renders from; the fit writes `inset` before each render. */
	options: { inset?: number; radiusRatio?: number };
	/** False when the author set `inset`, which is then used as given. */
	fit: boolean;
	/** Centre the radar polygon, rather than the circle around it, in the plot. */
	radar: boolean;
	/** Room for strokes and points on the outer circle, plus the plot margin. */
	shapeMargin: number;
};

/** What a polar mark draws beyond its outer radius: half its stroke, or its points. */
function polarShapeOverhang<TRow>(mark: ChartPolarMark<TRow>): number {
	if (!isPolarPathMark(mark)) return (mark.strokeWidth ?? 0) / 2;
	const line =
		Boolean(mark.line) ||
		(mark.area === undefined && mark.line === undefined && mark.points === undefined);
	return Math.max(
		line ? (mark.strokeWidth ?? 2.25) / 2 : 0,
		mark.points ? (mark.pointRadius ?? 3.5) : 0
	);
}

function isPolarPathMark<TRow>(mark: ChartPolarMark<TRow>): mark is PolarPathMark<TRow> {
	return mark.variant === 'circular' || mark.variant === 'radar';
}

/**
 * Sizes a polar chart to its plot. The angle labels sit a fixed distance outside the circle, so
 * how much room they need depends on where they fall: a label at twelve o'clock adds its height
 * above the circle, a band label just past it adds less, and side labels add their width. A first
 * render places the labels; the largest radius that keeps every label and the outer circle inside
 * the plot is then solved directly, and the chart is rendered at that radius.
 */
function fitPolarToPlot<TRow, TXValue extends TanStackValue, TYValue extends TanStackValue>(
	mark: TanStackMark<TRow, TXValue, TYValue>,
	fit: PolarFit
): TanStackMark<TRow, TXValue, TYValue> {
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const { chart } = renderContext;
					const half = Math.min(chart.width, chart.height) / 2;
					const ratio = fit.options.radiusRatio ?? 1;
					const radiusFor = () => Math.max(0, half - (fit.options.inset ?? 0)) * ratio;
					let rendered = initialized.render(renderContext);
					const polygon = fit.radar ? radarPolygon(rendered) : null;
					if (fit.fit) {
						const radius = solvePolarRadius(rendered, chart, polygon, fit.shapeMargin, {
							radius: radiusFor(),
							rtl: renderContext.layout?.typography?.direction === 'rtl'
						});
						// The previous frame's inset usually fits already; render again only when not.
						if (radius !== null && Math.abs(radius - radiusFor()) > 0.5) {
							fit.options.inset = Math.max(0, half - radius / ratio);
							rendered = initialized.render(renderContext);
						}
					}
					if (!polygon) return rendered;
					const radius = radiusFor();
					const translateX = polygon.shiftX * radius;
					const translateY = polygon.shiftY * radius;
					return {
						nodes: rendered.nodes.map((node) =>
							node.kind === 'group'
								? {
										...node,
										translateX: (node.translateX ?? 0) + translateX,
										translateY: (node.translateY ?? 0) + translateY
									}
								: node
						),
						points: rendered.points?.map((point) => ({
							...point,
							x: point.x + translateX,
							y: point.y + translateY
						}))
					};
				}
			};
		}
	};
}

type PolarRender = {
	nodes: readonly SceneNode[];
	points?: readonly { xValue: TanStackValue }[];
};

type RadarPolygon = {
	/** Corners on the unit circle, clockwise from twelve o'clock. */
	corners: readonly (readonly [number, number])[];
	/** Shift, per unit of radius, that centres the polygon's bounding box. */
	shiftX: number;
	shiftY: number;
};

function radarPolygon(rendered: PolarRender): RadarPolygon | null {
	const angleValues = new Set(
		(rendered.points ?? []).map((point) => chartValueIdentity(point.xValue))
	);
	if (angleValues.size < 3) return null;
	const corners = Array.from({ length: angleValues.size }, (_value, index) => {
		const angle = (index / angleValues.size) * Math.PI * 2;
		return [Math.sin(angle), -Math.cos(angle)] as const;
	});
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	return {
		corners,
		shiftX: -(Math.min(...xs) + Math.max(...xs)) / 2,
		shiftY: -(Math.min(...ys) + Math.max(...ys)) / 2
	};
}

/**
 * Something drawn at `direction * (radius + offset) + shift * radius` from the plot centre, with
 * extents on each side. Each one bounds the radius linearly, so the fit is a minimum over bounds.
 */
type PolarExtreme = {
	direction: readonly [number, number];
	offset: number;
	left: number;
	right: number;
	up: number;
	down: number;
};

function solvePolarRadius(
	rendered: PolarRender,
	chart: { width: number; height: number },
	polygon: RadarPolygon | null,
	shapeMargin: number,
	probe: { radius: number; rtl: boolean }
): number | null {
	const shape: PolarExtreme[] = (
		polygon?.corners ?? [
			[0, -1],
			[1, 0],
			[0, 1],
			[-1, 0]
		]
	).map((direction) => ({
		direction,
		offset: 0,
		left: shapeMargin,
		right: shapeMargin,
		up: shapeMargin,
		down: shapeMargin
	}));
	const labels = collectLabels(rendered.nodes).flatMap(({ label, x, y }): PolarExtreme[] => {
		const distance = Math.hypot(x, y);
		if (distance === 0) return [];
		const fontSize = label.fontSize ?? 12;
		const width = estimateLabelWidth(label.text, fontSize, label.fontWeight ?? 400);
		const anchor =
			probe.rtl && label.anchor !== 'middle'
				? label.anchor === 'end'
					? 'start'
					: 'end'
				: label.anchor;
		const lineBox = LABEL_LINE_BOX[label.baseline ?? 'middle'];
		// Labels sit `offset` px beyond the circle along their spoke; recover both from the render.
		return [
			{
				direction: [x / distance, y / distance],
				offset: distance - probe.radius,
				left: (anchor === 'end' ? width : anchor === 'start' ? 0 : width / 2) + CHART_FIT_MARGIN,
				right: (anchor === 'start' ? width : anchor === 'end' ? 0 : width / 2) + CHART_FIT_MARGIN,
				up: lineBox.above * fontSize + CHART_FIT_MARGIN,
				down: lineBox.below * fontSize + CHART_FIT_MARGIN
			}
		];
	});
	const halfWidth = chart.width / 2;
	const halfHeight = chart.height / 2;
	let radius = Infinity;
	for (const extreme of [...shape, ...labels]) {
		const [dx, dy] = extreme.direction;
		const slopeX = dx + (polygon?.shiftX ?? 0);
		const slopeY = dy + (polygon?.shiftY ?? 0);
		const baseX = dx * extreme.offset;
		const baseY = dy * extreme.offset;
		if (slopeX > 0) radius = Math.min(radius, (halfWidth - extreme.right - baseX) / slopeX);
		if (slopeX < 0) radius = Math.min(radius, (halfWidth - extreme.left + baseX) / -slopeX);
		if (slopeY > 0) radius = Math.min(radius, (halfHeight - extreme.down - baseY) / slopeY);
		if (slopeY < 0) radius = Math.min(radius, (halfHeight - extreme.up + baseY) / -slopeY);
	}
	return Number.isFinite(radius) && radius >= 1 ? radius : null;
}

/** Angle labels with positions relative to the plot centre, where the polar group is drawn. */
function collectLabels(nodes: readonly SceneNode[]): { label: SceneLabel; x: number; y: number }[] {
	const within = (
		children: readonly SceneNode[],
		x: number,
		y: number
	): { label: SceneLabel; x: number; y: number }[] =>
		children.flatMap((node) => {
			if (node.kind === 'label') return [{ label: node, x: node.x + x, y: node.y + y }];
			if (node.kind !== 'group') return [];
			return within(node.children, x + (node.translateX ?? 0), y + (node.translateY ?? 0));
		});
	return nodes.flatMap((node) => (node.kind === 'group' ? within(node.children, 0, 0) : []));
}

function chartValueIdentity(value: TanStackValue): string {
	return value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
}

function readPolarVariant(value: unknown): unknown {
	return typeof value === 'object' && value !== null && 'variant' in value
		? value.variant
		: undefined;
}
