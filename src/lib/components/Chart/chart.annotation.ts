import type {
	ChannelAccessor,
	ChartPoint,
	ChartValue as TanStackValue,
	InitializedMark,
	MaterializedChannel,
	SceneNode
} from '@tanstack/charts';
import {
	chartKeyIdentity,
	compileColor,
	compileKeyChannel,
	compileOptionalChannel
} from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { unsupportedDiscriminant } from './chart.errors.js';
import { withoutTooltipPoints } from './chart.mark.js';
import type {
	ChartAnnotation,
	ChartChannel,
	ChartKey,
	ChartRequiredChannel,
	ChartVisual
} from './chart.props.js';

type AnnotatableMark<TRow extends object> = {
	readonly key?: ChartRequiredChannel<TRow, ChartKey>;
	readonly series?: ChartChannel<TRow, ChartKey> | ChartRequiredChannel<TRow, ChartKey>;
	readonly colorBy?: ChartChannel<TRow, ChartKey> | ChartRequiredChannel<TRow, ChartKey>;
	readonly annotations?: readonly ChartAnnotation<TRow>[];
};

export type CompiledAnnotations = {
	readonly under: readonly CompiledMark[];
	readonly over: readonly CompiledMark[];
};

export function compileAnnotations<TRow extends object>(
	data: readonly TRow[],
	mark: AnnotatableMark<TRow>,
	sourceMarks: readonly CompiledMark[],
	path: string
): CompiledAnnotations {
	if (!mark.annotations?.length) return { under: [], over: [] };
	const ids = new Set<string>();
	const under: CompiledMark[] = [];
	const over: CompiledMark[] = [];
	mark.annotations.forEach((annotation, index) => {
		const annotationPath = `${path}.annotations[${index}]`;
		if (annotation.id && ids.has(annotation.id)) {
			throw new TypeError(
				`[Chart] ${annotationPath}.id duplicates another annotation id "${annotation.id}".`
			);
		}
		if (annotation.id) ids.add(annotation.id);
		const compiled = compileAnnotation(data, mark, sourceMarks, annotation, annotationPath);
		(annotation.placement === 'under' ? under : over).push(compiled);
	});
	return { under, over };
}

function compileAnnotation<TRow extends object>(
	data: readonly TRow[],
	mark: AnnotatableMark<TRow>,
	sourceMarks: readonly CompiledMark[],
	annotation: ChartAnnotation<TRow>,
	path: string
): CompiledMark {
	if ('key' in annotation.target && mark.key === undefined) {
		throw new TypeError(`[Chart] ${path}.target.key requires the parent mark to define key.`);
	}
	if (
		'key' in annotation.target &&
		annotation.target.series !== undefined &&
		mark.series === undefined &&
		mark.colorBy === undefined
	) {
		throw new TypeError(
			`[Chart] ${path}.target.series requires the parent mark to define series or colorBy.`
		);
	}
	const key = compileKeyChannel(mark.key);
	const series = compileOptionalChannel(mark.series ?? mark.colorBy);

	return withoutTooltipPoints({
		initialize(context) {
			const initializedSources = sourceMarks.map((source) => source.initialize(context));
			return {
				id: annotation.id ?? path,
				channels: mergeChannels(initializedSources),
				seriesFromColor: initializedSources.some((source) => source.seriesFromColor),
				render(renderContext) {
					const targetRows = resolveTargetRows(data, annotation, key, series);
					const renderedPoints = initializedSources.flatMap((source) => {
						const resolved = source.resolveLayout?.(renderContext) ?? source;
						return collectRenderedPoints(resolved.render(renderContext));
					});
					const matches = uniqueCoordinates(
						renderedPoints.filter((point) => pointContainsTargetRow(point, targetRows))
					);
					if (matches.length !== 1) {
						throw new TypeError(
							`[Chart] ${path}.target must resolve to exactly one rendered coordinate; received ${matches.length}.`
						);
					}
					const point = matches[0];
					const row = targetRows.find((candidate) => pointContainsTargetRow(point, [candidate]));
					if (!point || !row) {
						throw new Error(`[Chart] ${path} could not recover its resolved datum.`);
					}
					return {
						nodes: compileAnnotationNodes(
							annotation,
							point,
							row,
							data.indexOf(row),
							data,
							renderContext.chart,
							renderContext.scales.x?.bandwidth,
							renderContext.scales.y?.bandwidth,
							annotation.id ?? path
						).map((node) => ({ ...node, pointOwner: point })),
						points: []
					};
				}
			};
		}
	});
}

function collectRenderedPoints(
	rendered: ReturnType<InitializedMark['render']>
): readonly ChartPoint[] {
	const points = [...(rendered.points ?? [])];
	const collectNode = (node: SceneNode): void => {
		if (node.pointOwner) points.push(node.pointOwner);
		if ('interaction' in node && node.interaction) {
			if (node.interaction.point) points.push(node.interaction.point);
			else points.push(...node.interaction.points);
		}
		if (node.kind === 'group') node.children.forEach(collectNode);
	};
	rendered.nodes.forEach(collectNode);
	return points;
}

function mergeChannels(
	initializedSources: readonly InitializedMark[]
): Readonly<Record<string, MaterializedChannel>> {
	const channels = new Map<string, MaterializedChannel>();
	for (const initialized of initializedSources) {
		for (const [name, channel] of Object.entries(initialized.channels)) {
			const existing = channels.get(name);
			channels.set(
				name,
				existing
					? {
							scale: existing.scale ?? channel.scale,
							values: [...existing.values, ...channel.values],
							includeZero: existing.includeZero || channel.includeZero
						}
					: channel
			);
		}
	}
	return Object.fromEntries(channels);
}

function resolveTargetRows<TRow extends object>(
	data: readonly TRow[],
	annotation: ChartAnnotation<TRow>,
	key: ChannelAccessor<TRow, ChartKey> | undefined,
	series: ChannelAccessor<TRow, ChartKey | null | undefined> | undefined
): readonly TRow[] {
	const target = annotation.target;
	if ('where' in target && target.where) {
		return data.filter((row, index) => target.where(row, index, data));
	}
	if (!key) throw new Error('[Chart] Annotation key validation did not produce an accessor.');
	const targetKey = chartKeyIdentity(target.key);
	const targetSeries = target.series === undefined ? undefined : chartKeyIdentity(target.series);
	return data.filter((row, index) => {
		const context = { index, data };
		if (chartKeyIdentity(key(row, context)) !== targetKey) return false;
		if (targetSeries === undefined) return true;
		const seriesKey = series?.(row, context);
		return (
			seriesKey !== null && seriesKey !== undefined && chartKeyIdentity(seriesKey) === targetSeries
		);
	});
}

function pointContainsTargetRow<TRow extends object>(
	point: ChartPoint<unknown, TanStackValue, TanStackValue>,
	targetRows: readonly TRow[]
): boolean {
	if (targetRows.includes(point.datum as TRow)) return true;
	if (typeof point.datum !== 'object' || point.datum === null) return false;
	const sourceRows = Reflect.get(point.datum, '__svelaiSourceRows');
	return Array.isArray(sourceRows) && targetRows.some((row) => sourceRows.includes(row));
}

function uniqueCoordinates(
	points: readonly ChartPoint<unknown, TanStackValue, TanStackValue>[]
): readonly ChartPoint<unknown, TanStackValue, TanStackValue>[] {
	const coordinates = new Map<string, ChartPoint<unknown, TanStackValue, TanStackValue>>();
	for (const point of points) coordinates.set(`${point.x}:${point.y}`, point);
	return [...coordinates.values()];
}

function compileAnnotationNodes<TRow extends object>(
	annotation: ChartAnnotation<TRow>,
	point: ChartPoint<unknown, TanStackValue, TanStackValue>,
	row: TRow,
	index: number,
	rows: readonly TRow[],
	chart: { x: number; y: number; width: number; height: number },
	xBandwidth: number | undefined,
	yBandwidth: number | undefined,
	path: string
): readonly SceneNode[] {
	const color = compileColor(annotation.color ?? 'neutral');
	const style = { stroke: color, fill: color, opacity: annotation.opacity };
	switch (annotation.type) {
		case 'marker':
			return [
				{
					kind: 'dot',
					key: path,
					x: point.x,
					y: point.y,
					radius: annotation.radius ?? 5,
					ariaHidden: true,
					style: {
						...style,
						fill: annotation.fill ? compileColor(annotation.fill) : 'var(--color-surface)',
						stroke: compileColor(annotation.stroke ?? annotation.color ?? 'neutral'),
						strokeWidth: annotation.strokeWidth ?? 2
					}
				}
			];
		case 'label': {
			const offset = annotation.offset ?? { x: 0, y: -12 };
			return [
				{
					kind: 'label',
					key: path,
					x: point.x + offset.x,
					y: point.y + offset.y,
					text: String(resolveVisual(annotation.text, row, index, rows)),
					anchor: annotation.anchor ?? 'middle',
					baseline: 'middle',
					fontSize: annotation.fontSize,
					fontWeight: annotation.fontWeight,
					ariaHidden: true,
					style: { fill: color, opacity: annotation.opacity }
				}
			];
		}
		case 'rule':
			return [
				{
					kind: 'rule',
					key: path,
					x1: annotation.axis === 'x' ? point.x : chart.x,
					x2: annotation.axis === 'x' ? point.x : chart.x + chart.width,
					y1: annotation.axis === 'y' ? point.y : chart.y,
					y2: annotation.axis === 'y' ? point.y : chart.y + chart.height,
					ariaHidden: true,
					style: {
						stroke: color,
						strokeWidth: annotation.strokeWidth ?? 1.5,
						strokeDasharray: annotation.strokeDasharray,
						opacity: annotation.opacity
					}
				}
			];
		case 'band': {
			const thickness =
				annotation.thickness ?? (annotation.axis === 'x' ? xBandwidth : yBandwidth) ?? 16;
			const inset = annotation.inset ?? 0;
			return [
				{
					kind: 'rect',
					key: path,
					x: annotation.axis === 'x' ? point.x - thickness / 2 + inset : chart.x,
					y: annotation.axis === 'y' ? point.y - thickness / 2 + inset : chart.y,
					width: annotation.axis === 'x' ? Math.max(0, thickness - inset * 2) : chart.width,
					height: annotation.axis === 'y' ? Math.max(0, thickness - inset * 2) : chart.height,
					radius: annotation.radius,
					ariaHidden: true,
					style: {
						fill: color,
						fillOpacity: annotation.fillOpacity ?? 0.12,
						opacity: annotation.opacity
					}
				}
			];
		}
		case 'arrow':
			return compileArrowNodes(annotation, point, row, index, rows, color, path);
		default:
			return unsupportedDiscriminant(annotation, `${path}.type`);
	}
}

function compileArrowNodes<TRow extends object>(
	annotation: Extract<ChartAnnotation<TRow>, { type: 'arrow' }>,
	point: ChartPoint<unknown, TanStackValue, TanStackValue>,
	row: TRow,
	index: number,
	rows: readonly TRow[],
	color: string,
	path: string
): readonly SceneNode[] {
	const offset = annotation.offset ?? { x: 36, y: -28 };
	const tailX = point.x + offset.x;
	const tailY = point.y + offset.y;
	const angle = Math.atan2(point.y - tailY, point.x - tailX);
	const headLength = annotation.headLength ?? 8;
	const wing = Math.PI / 7;
	const head = [
		[point.x, point.y],
		[point.x - Math.cos(angle - wing) * headLength, point.y - Math.sin(angle - wing) * headLength],
		[point.x - Math.cos(angle + wing) * headLength, point.y - Math.sin(angle + wing) * headLength]
	] as const;
	const nodes: SceneNode[] = [
		{
			kind: 'rule',
			key: `${path}:shaft`,
			x1: tailX,
			y1: tailY,
			x2: point.x,
			y2: point.y,
			ariaHidden: true,
			style: {
				stroke: color,
				strokeWidth: annotation.strokeWidth ?? 1.5,
				opacity: annotation.opacity
			}
		},
		{
			kind: 'area',
			key: `${path}:head`,
			points: head,
			ariaHidden: true,
			style: { fill: color, opacity: annotation.opacity }
		}
	];
	if (annotation.label !== undefined) {
		nodes.push({
			kind: 'label',
			key: `${path}:label`,
			x: tailX,
			y: tailY,
			text: String(resolveVisual(annotation.label, row, index, rows)),
			anchor: offset.x < 0 ? 'end' : 'start',
			baseline: 'middle',
			ariaHidden: true,
			style: { fill: color, opacity: annotation.opacity }
		});
	}
	return nodes;
}

function resolveVisual<TRow, TValue>(
	visual: ChartVisual<TRow, TValue>,
	row: TRow,
	index: number,
	rows: readonly TRow[]
): TValue {
	return typeof visual === 'function'
		? (visual as (row: TRow, index: number, rows: readonly TRow[]) => TValue)(row, index, rows)
		: visual;
}
