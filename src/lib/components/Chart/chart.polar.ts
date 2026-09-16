import { type ChartMark as TanStackMark, type ChartValue as TanStackValue } from '@tanstack/charts';
import {
	angleGrid,
	polar,
	radialArea,
	radialBarRadius,
	radialDot,
	radialGrid,
	radialLine,
	type PolarGuide,
	type PolarMark
} from '@tanstack/charts/polar';
import {
	compileChannel,
	compileColor,
	compileColorVisual,
	compileMarkChannels
} from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
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
	const inset = mark.inset ?? (mark.variant === 'radar' ? 24 : 16);
	const radiusRatio = mark.radiusRatio ?? (mark.variant === 'radar' ? 1 : 0.92);
	const compiled = polar({
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
		inset,
		radiusRatio
	});
	return mark.variant === 'radar' ? centerPolarPolygon(compiled, inset, radiusRatio) : compiled;
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

function centerPolarPolygon<TRow, TXValue extends TanStackValue, TYValue extends TanStackValue>(
	mark: TanStackMark<TRow, TXValue, TYValue>,
	inset: number,
	radiusRatio: number
): TanStackMark<TRow, TXValue, TYValue> {
	return {
		...mark,
		initialize(context) {
			const initialized = mark.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					const angleValues = new Set(
						(rendered.points ?? []).map((point) => chartValueIdentity(point.xValue))
					);
					if (angleValues.size < 3) return rendered;
					const unitPoints = Array.from({ length: angleValues.size }, (_value, index) => {
						const angle = (index / angleValues.size) * Math.PI * 2;
						return [Math.sin(angle), -Math.cos(angle)] as const;
					});
					const xs = unitPoints.map(([x]) => x);
					const ys = unitPoints.map(([, y]) => y);
					const radius =
						Math.max(
							0,
							Math.min(renderContext.chart.width, renderContext.chart.height) / 2 - inset
						) * radiusRatio;
					const translateX = -((Math.min(...xs) + Math.max(...xs)) / 2) * radius;
					const translateY = -((Math.min(...ys) + Math.max(...ys)) / 2) * radius;
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

function chartValueIdentity(value: TanStackValue): string {
	return value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
}

function readPolarVariant(value: unknown): unknown {
	return typeof value === 'object' && value !== null && 'variant' in value
		? value.variant
		: undefined;
}
