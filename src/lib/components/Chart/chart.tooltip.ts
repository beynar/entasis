import type {
	ChartFocusPreset,
	ChartPoint,
	ChartTooltipContent,
	ChartTooltipContentContext,
	ChartTooltipDatumItem,
	ChartTooltipInput,
	ChartTooltipRow,
	ChartValue
} from '@tanstack/charts';
import { tooltip } from '@tanstack/charts/tooltip';
import type { DistributionEmpiricalDatum } from './chart.distribution.empirical.js';
import { isDistributionSummary, type DistributionSummary } from './chart.distribution.js';
import { isHexbinDatum, type ChartHexbinDatum } from './chart.hexbin.js';
import { isProportionDatum, type ProportionDatum } from './chart.proportion.js';
import { isRelationDatum } from './chart.relation.data.js';
import type {
	ChartPositionDefinition,
	ChartTooltipDefinition,
	ChartTooltipField
} from './chart.props.js';
import { en, type Messages } from '$lib/i18n/en.js';

const GROUPED_TOOLTIP_PLACEMENTS = ['top', 'right', 'left', 'bottom'] as const;
const PROPORTION_VALUE_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const PROPORTION_SHARE_FORMAT = new Intl.NumberFormat(undefined, {
	style: 'percent',
	maximumFractionDigits: 1
});

export type ChartTooltipSpecialization =
	| { type: 'distribution'; direction: 'vertical' | 'horizontal' }
	| { type: 'proportion' }
	| { type: 'relation' }
	| { type: 'hexbin' };

export function compileChartTooltip<TRow extends object>(
	definition: boolean | ChartTooltipDefinition<TRow> | undefined,
	className: string | undefined,
	groupBy: 'x' | 'y' | undefined,
	specialization?: ChartTooltipSpecialization,
	messages: Messages = en
): {
	input: false | ChartTooltipInput<TRow, ChartValue, ChartValue, 'dom'>;
	focus?: ChartFocusPreset;
	groupBy?: 'x' | 'y';
} {
	if (!definition) return { input: false };
	let distributionGroupBy: 'x' | 'y' | undefined;
	if (specialization?.type === 'distribution') {
		distributionGroupBy = specialization.direction === 'vertical' ? 'x' : 'y';
	}
	if (specialization && definition !== true && definition.fields?.length) {
		throw new TypeError(
			`[Chart] tooltip.fields cannot be used with a ${specialization.type} mark; its tooltip is built in.`
		);
	}
	if (
		(specialization?.type === 'proportion' ||
			specialization?.type === 'relation' ||
			specialization?.type === 'hexbin') &&
		definition !== true &&
		definition.groupBy !== undefined &&
		definition.groupBy !== false
	) {
		throw new TypeError(
			`[Chart] tooltip.groupBy cannot be used with a ${specialization.type} mark.`
		);
	}
	if (
		distributionGroupBy &&
		definition !== true &&
		definition.groupBy !== undefined &&
		definition.groupBy !== distributionGroupBy
	) {
		throw new TypeError(
			`[Chart] tooltip.groupBy must be "${distributionGroupBy}" for this distribution direction.`
		);
	}
	let configuredGroupBy = distributionGroupBy;
	if (
		!configuredGroupBy &&
		specialization?.type !== 'proportion' &&
		specialization?.type !== 'relation' &&
		specialization?.type !== 'hexbin'
	) {
		configuredGroupBy =
			definition === true ? groupBy : resolveConfiguredGroupBy(definition, groupBy);
	}
	const isGrouped = configuredGroupBy !== undefined;
	const focus = configuredGroupBy ? (`group-${configuredGroupBy}` as const) : 'nearest';
	const placement = definition === true ? undefined : definition.placement;
	let content:
		| ((
				points: readonly ChartPoint<TRow>[],
				context: ChartTooltipContentContext
		  ) => ChartTooltipContent)
		| undefined;
	if (specialization?.type === 'distribution') {
		content = (points, context) => compileDistributionTooltip(points, context, messages);
	}
	if (specialization?.type === 'proportion') {
		content = (points, context) => compileProportionTooltip(points, context, messages);
	}
	if (specialization?.type === 'relation') {
		content = (points, context) => compileRelationTooltip(points, context, messages);
	}
	if (specialization?.type === 'hexbin') content = compileHexbinTooltip;

	return {
		focus,
		groupBy: configuredGroupBy,
		input: {
			use: tooltip,
			className,
			anchor: isGrouped ? 'group-center' : 'point',
			placement: placement ?? (isGrouped ? GROUPED_TOOLTIP_PLACEMENTS : 'auto'),
			sort: 'color-domain',
			items: definition === true ? undefined : definition.fields?.map(compileTooltipField),
			content,
			offset: definition === true ? undefined : definition.offset,
			sticky: false
		}
	};
}

function compileRelationTooltip<TRow extends object>(
	points: readonly ChartPoint<TRow>[],
	_context: ChartTooltipContentContext,
	messages: Messages
): ChartTooltipContent {
	const point = points.find((candidate) => isRelationDatum(candidate.datum));
	if (!point || !isRelationDatum(point.datum)) {
		throw new Error('[Chart] Relation tooltip focus did not contain a node or link.');
	}
	const relation = point.datum;
	if (relation.kind === 'relation-link') {
		return {
			title: `${relation.sourceLabel} → ${relation.targetLabel}`,
			rows:
				relation.value === undefined
					? []
					: [
							{
								label: messages.valueLabel,
								value: PROPORTION_VALUE_FORMAT.format(relation.value),
								color: point.color
							}
						]
		};
	}
	const rows: ChartTooltipRow[] = [];
	if (relation.group !== undefined) {
		rows.push({ label: messages.chartGroup, value: String(relation.group) });
	}
	if (relation.value !== undefined) {
		rows.push({
			label: messages.valueLabel,
			value: PROPORTION_VALUE_FORMAT.format(relation.value)
		});
	}
	return { title: relation.label, color: point.color, rows };
}

function compileProportionTooltip<TRow extends object>(
	points: readonly ChartPoint<TRow>[],
	_context: ChartTooltipContentContext,
	messages: Messages
): ChartTooltipContent {
	const point = points.find((candidate) => isProportionDatum(candidate.datum));
	if (!point || !isProportionDatum(point.datum)) {
		throw new Error('[Chart] Proportion tooltip focus did not contain a proportion summary.');
	}
	const summary: ProportionDatum = point.datum;
	return {
		title: String(summary.category),
		rows: [
			{
				label: messages.valueLabel,
				value: PROPORTION_VALUE_FORMAT.format(summary.value),
				color: point.color
			},
			{ label: messages.chartShare, value: PROPORTION_SHARE_FORMAT.format(summary.share) }
		]
	};
}

export function resolveChartTooltipGroupBy(configuration: {
	x?: ChartPositionDefinition;
	y?: ChartPositionDefinition;
}): 'x' | 'y' | undefined {
	if (!configuration.x || !configuration.y) return undefined;
	const xIsCategorical = isCategoricalScale(configuration.x.scale);
	const yIsCategorical = isCategoricalScale(configuration.y.scale);
	return yIsCategorical && !xIsCategorical ? 'y' : 'x';
}

function compileDistributionTooltip<TRow extends object>(
	points: readonly ChartPoint<TRow>[],
	context: ChartTooltipContentContext,
	messages: Messages
): ChartTooltipContent {
	const point = points.find((candidate) => isDistributionSummary(candidate.datum));
	if (!point || !isDistributionSummary(point.datum)) {
		return compileEmpiricalDistributionTooltip(points, context);
	}
	const summary: DistributionSummary = point.datum;
	const formatValue = summary.direction === 'vertical' ? context.formatY : context.formatX;
	const range = `${formatValue(summary.low)} – ${formatValue(summary.high)}`;
	let rows: readonly ChartTooltipRow[];
	if (summary.variant === 'violin') {
		rows = [
			{ label: messages.chartSamples, value: String(summary.count) },
			{ label: messages.chartMedian, value: formatValue(summary.median), color: point.color }
		];
	} else if (summary.variant === 'box') {
		rows = [
			{ label: messages.chartSamples, value: String(summary.count) },
			{ label: messages.chartMedian, value: formatValue(summary.median), color: point.color },
			{
				label: messages.chartQuartiles,
				value: `${formatValue(summary.q1)} – ${formatValue(summary.q3)}`
			},
			{ label: messages.chartWhiskers, value: range }
		];
	} else {
		rows = [
			{ label: messages.chartSamples, value: String(summary.count) },
			{ label: messages.chartMean, value: formatValue(summary.mean), color: point.color },
			{ label: summary.intervalLabel ?? messages.chartInterval, value: range }
		];
	}
	return { title: String(summary.group), rows };
}

function compileEmpiricalDistributionTooltip<TRow extends object>(
	points: readonly ChartPoint<TRow>[],
	context: ChartTooltipContentContext
): ChartTooltipContent {
	const empiricalPoints = points.filter((point) => isDistributionEmpiricalDatum(point.datum));
	const firstPoint = empiricalPoints[0];
	if (!firstPoint || !isDistributionEmpiricalDatum(firstPoint.datum)) {
		throw new Error('[Chart] Distribution tooltip focus did not contain a statistical summary.');
	}
	const firstDatum = firstPoint.datum;
	const formatValue = firstDatum.direction === 'vertical' ? context.formatX : context.formatY;
	if (firstDatum.variant === 'histogram') {
		const lower = firstDatum.lower;
		const upper = firstDatum.upper;
		if (lower === undefined || upper === undefined) {
			throw new Error('[Chart] Histogram tooltip did not contain bin endpoints.');
		}
		return {
			title: `${formatValue(lower)} – ${formatValue(upper)}`,
			rows: empiricalPoints.map((point) => {
				const datum = point.datum as DistributionEmpiricalDatum;
				return { label: String(datum.group), value: String(datum.count), color: point.color };
			})
		};
	}
	let formatStatistic: (value: number) => string = context.formatY;
	if (firstDatum.variant === 'ecdf') {
		formatStatistic = (value) => PROPORTION_SHARE_FORMAT.format(value);
	} else if (firstDatum.direction === 'horizontal') formatStatistic = context.formatX;
	return {
		title: formatValue(firstDatum.value),
		rows: empiricalPoints.map((point) => {
			const datum = point.datum as DistributionEmpiricalDatum;
			return {
				label: String(datum.group),
				value: formatStatistic(datum.statistic),
				color: point.color
			};
		})
	};
}

function compileHexbinTooltip<TRow extends object>(
	points: readonly ChartPoint<TRow>[],
	context: ChartTooltipContentContext
): ChartTooltipContent {
	const point = points.find((candidate) => isHexbinDatum(candidate.datum));
	if (!point || !isHexbinDatum(point.datum)) {
		throw new Error('[Chart] Hexbin tooltip focus did not contain an aggregate bin.');
	}
	const bin: ChartHexbinDatum = point.datum;
	return {
		title: `${bin.count} observation${bin.count === 1 ? '' : 's'}`,
		color: point.color,
		rows: [
			{ label: 'x', value: context.formatX(bin.x) },
			{ label: 'y', value: context.formatY(bin.y) }
		]
	};
}

function isDistributionEmpiricalDatum(value: unknown): value is DistributionEmpiricalDatum {
	return (
		typeof value === 'object' &&
		value !== null &&
		Reflect.get(value, '__svelaiDistributionEmpirical') === true
	);
}

function resolveConfiguredGroupBy<TRow extends object>(
	definition: ChartTooltipDefinition<TRow>,
	fallback: 'x' | 'y' | undefined
): 'x' | 'y' | undefined {
	return definition.groupBy === false ? undefined : (definition.groupBy ?? fallback);
}

function isCategoricalScale(scale: ChartPositionDefinition['scale']): boolean {
	return scale.type === 'band' || scale.type === 'point';
}

function compileTooltipField<TRow extends object>(
	field: ChartTooltipField<TRow>
): ChartTooltipDatumItem<TRow> {
	const format = field.format;
	return {
		field: field.field,
		label: field.label,
		text: format
			? (point) => Reflect.apply(format, undefined, [point.datum[field.field], point.datum])
			: undefined
	};
}
