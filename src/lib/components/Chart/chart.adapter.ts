import {
	bandX,
	bandY,
	defineChart,
	facet,
	frame,
	whenFocused,
	type ChartAnimationOptions,
	type ChartColorOptions,
	type ChartControl,
	type DomChartDefinition,
	type ChartHostOptions,
	type ChartSpec,
	type StaticChartDefinition
} from '@tanstack/charts';
import { compileAnnotations } from './chart.annotation.js';
import { compileMarkAnalysis } from './chart.analysis.js';
import {
	compileChannel,
	compileChartTheme,
	compileColor,
	compileKeyChannel,
	compileKeyedPaletteScale,
	compileOptionalColor,
	isKeyedPalette
} from './chart.channels.js';
import {
	compileAreaGradients,
	compileBarMark,
	compileScatterMark,
	compileSeriesMark,
	type AreaGradients,
	type CompiledMark,
	type CompiledMarkResult
} from './chart.cartesian.js';
import { compileDistribution, isEmpiricalDistributionMark } from './chart.distribution.js';
import { unsupportedDiscriminant } from './chart.errors.js';
import { compileHexbinColorOptions } from './chart.hexbin.js';
import {
	compileChartLegend,
	withLegendSeries,
	withSeriesLabel,
	type ChartLegendSurface
} from './chart.legend.js';
import {
	compileMatrixColorOptions,
	compileMatrixMark,
	isCalendarMatrixMark,
	isQuantitativeMatrixMark
} from './chart.matrix.js';
import { compilePolarChartMark } from './chart.polar.js';
import { compilePosition } from './chart.position.js';
import { compileProportion } from './chart.proportion.js';
import { compileRelationChart } from './chart.relation.js';
import type {
	ChartChannel,
	ChartDistributionMark,
	ChartFrameDefinition,
	ChartKey,
	ChartMark,
	ChartPositionDefinition,
	ChartProportionMark,
	ChartRelationMark,
	ChartScatterMark,
	ChartValue,
	ChartPalette,
	ChartProps
} from './chart.props.js';
import type { Messages } from '$lib/i18n/en.js';
import {
	compileChartTooltip,
	resolveChartTooltipGroupBy,
	type ChartTooltipSpecialization
} from './chart.tooltip.js';
import { resolveChartSize, validateMarkId } from './chart.validation.js';

type ChartPlotConfiguration<TRow extends object> = Pick<
	ChartProps<TRow>,
	'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip' | 'legend'
> & {
	viewportDomain?: readonly ChartValue[];
	legendValue?: readonly ChartKey[];
	/** Receives the resolved categorical series the Svelte legend draws, or `undefined`. */
	onLegendSurface?: (surface: ChartLegendSurface | undefined) => void;
	/** Active i18n catalog, used for the built-in tooltip row labels. */
	messages?: Messages;
};

type CreateChartOptionsInput<TRow extends object> = Pick<
	ChartProps<TRow>,
	| 'data'
	| 'marks'
	| 'x'
	| 'y'
	| 'guides'
	| 'clip'
	| 'frame'
	| 'margin'
	| 'palette'
	| 'legend'
	| 'tooltip'
	| 'label'
	| 'ariaDescription'
	| 'height'
	| 'aspectRatio'
> & {
	idPrefix: string;
	tooltipClassName?: string;
	animation?: false | ChartAnimationOptions;
	controls?: readonly ChartControl[];
	viewportDomain?: readonly ChartValue[];
	legendValue?: readonly ChartKey[];
	/** Receives the resolved categorical series the Svelte legend draws, or `undefined`. */
	onLegendSurface?: (surface: ChartLegendSurface | undefined) => void;
	/** Active i18n catalog, used for the built-in tooltip row labels. */
	messages?: Messages;
};

/**
 * A facet cell, like a composed view, may only carry chart *spec* options: since
 * @tanstack/charts 0.18 the host options (`focusRing`, `focus`, `keyboard`, `pointer`,
 * `svgAnimation`, `controls`, `tooltip`, …) must live on the outer definition only.
 * Typing the compiled plot as a spec keeps `focusRing` out of its keys, which is what the
 * `facet({ chart })` type guard checks. See
 * node_modules/@tanstack/charts/docs/reference/marks/text-frame-and-facet.md (`facet`).
 */
type CompiledChartSpec<TRow extends object> = ChartSpec & { readonly __datum?: TRow };

type CompiledChartPlot<TRow extends object> = {
	readonly spec: CompiledChartSpec<TRow>;
	/** Same array as `spec.marks`, kept narrowly typed for facet domain inference. */
	readonly marks: readonly CompiledMark[];
	readonly tooltip: ReturnType<typeof compileChartTooltip<TRow>>;
};

type CompileMarkInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly mark: ChartMark<TRow>;
	readonly path: string;
	readonly configuration: ChartPlotConfiguration<TRow>;
	readonly tooltipClassName?: string;
	readonly areaGradients?: AreaGradients;
	readonly fallbackSeries?: ChartChannel<TRow, ChartKey>;
	readonly distributionDomain?: readonly [number, number];
	readonly tooltipGroupBy?: 'x' | 'y';
};

export function createChartOptions<TRow extends object>({
	data,
	marks,
	x,
	y,
	guides,
	clip,
	frame: chartFrame,
	margin,
	palette,
	legend,
	tooltip,
	label,
	ariaDescription,
	idPrefix,
	height,
	aspectRatio,
	tooltipClassName,
	animation,
	controls,
	viewportDomain,
	legendValue,
	onLegendSurface,
	messages
}: CreateChartOptionsInput<TRow>): ChartHostOptions<TRow> {
	const size = resolveChartSize(height, aspectRatio);
	const definition = compileChartDefinition(
		data,
		{
			marks,
			x,
			y,
			guides,
			clip,
			frame: chartFrame,
			margin,
			palette,
			tooltip,
			viewportDomain,
			legend,
			legendValue,
			onLegendSurface,
			messages
		},
		tooltipClassName,
		animation,
		controls
	);

	return {
		definition,
		ariaLabel: label,
		ariaDescription,
		idPrefix,
		initialWidth: size?.width,
		height: size?.height,
		aspectRatio: size?.aspectRatio
	};
}

function compileChartDefinition<TRow extends object>(
	data: readonly TRow[],
	configuration: ChartPlotConfiguration<TRow>,
	tooltipClassName?: string,
	animation?: false | ChartAnimationOptions,
	controls?: readonly ChartControl[]
): DomChartDefinition<TRow> {
	if (!Array.isArray(configuration.marks) || configuration.marks.length === 0) {
		throw new TypeError('[Chart] marks must contain at least one mark.');
	}
	const relationMark = configuration.marks.find(
		(mark): mark is ChartRelationMark<TRow> => mark.type === 'relation'
	);
	if (!relationMark) {
		return compileChartPlot(
			data,
			configuration,
			tooltipClassName,
			'',
			undefined,
			animation,
			controls
		);
	}
	const relationIndex = configuration.marks.indexOf(relationMark);
	const relationPath = `marks[${relationIndex}]`;
	validateRelationPlot(configuration, relationIndex);
	validatePalette(configuration.palette, 'palette');
	const chartTooltip = compileChartTooltip(
		configuration.tooltip,
		tooltipClassName,
		undefined,
		{ type: 'relation' },
		configuration.messages
	);
	return compileRelationChart({
		data,
		mark: relationMark,
		path: relationPath,
		palette: configuration.palette,
		legend: compileChartLegend(
			configuration.legend,
			undefined,
			false,
			configuration.onLegendSurface
		),
		tooltip: chartTooltip.input
	});
}

function compileChartPlot<TRow extends object>(
	data: readonly TRow[],
	configuration: ChartPlotConfiguration<TRow>,
	tooltipClassName?: string,
	path = '',
	fallbackSeries?: ChartChannel<TRow, ChartKey>,
	animation?: false | ChartAnimationOptions,
	controls?: readonly ChartControl[]
): StaticChartDefinition<TRow, ChartValue, ChartValue, 'dom'> {
	const plot = compileChartSpec(data, configuration, tooltipClassName, path, fallbackSeries);
	// Host options belong to the outer definition only; facet cells compile the spec alone.
	return defineChart(plot.spec, {
		svgAnimation: animation,
		focusRing: false,
		keyboard: false,
		pointer: false,
		focus: plot.tooltip.focus,
		controls,
		tooltip: plot.tooltip.input
	});
}

function compileChartSpec<TRow extends object>(
	data: readonly TRow[],
	configuration: ChartPlotConfiguration<TRow>,
	tooltipClassName?: string,
	path = '',
	fallbackSeries?: ChartChannel<TRow, ChartKey>
): CompiledChartPlot<TRow> {
	const marksPath = appendPath(path, 'marks');
	const palettePath = appendPath(path, 'palette');
	const xPath = appendPath(path, 'x');
	const yPath = appendPath(path, 'y');
	if (!Array.isArray(configuration.marks) || configuration.marks.length === 0) {
		throw new TypeError(`[Chart] ${marksPath} must contain at least one mark.`);
	}
	validatePalette(configuration.palette, palettePath);

	const distributionMark = configuration.marks.find(
		(mark): mark is ChartDistributionMark<TRow> => mark.type === 'distribution'
	);
	const proportionMark = configuration.marks.find(
		(mark): mark is ChartProportionMark<TRow> => mark.type === 'proportion'
	);
	const hexbinMark = configuration.marks.find(
		(mark): mark is Extract<ChartScatterMark<TRow>, { variant: 'hexbin' }> =>
			mark.type === 'scatter' && mark.variant === 'hexbin'
	);
	const seriesLabelFormat =
		typeof configuration.legend === 'object' ? configuration.legend.format : undefined;
	const interactiveLegend =
		typeof configuration.legend === 'object' &&
		configuration.legend.interactive === true &&
		supportsSeriesVisibility(configuration.marks);
	const proportionIndex = proportionMark ? configuration.marks.indexOf(proportionMark) : -1;
	if (proportionMark) validateProportionPlot(configuration, proportionIndex, path);

	const chartTooltip = compileChartTooltip(
		configuration.tooltip,
		tooltipClassName,
		hexbinMark ? undefined : resolveChartTooltipGroupBy(configuration),
		resolveTooltipSpecialization(distributionMark, proportionMark, hexbinMark),
		configuration.messages
	);
	const areaGradients = configuration.marks.some((mark) => mark.type === 'series' && mark.area)
		? compileAreaGradients(configuration.palette, path)
		: undefined;
	const markIds = new Map<string, number>();
	let distributionIndex: number | undefined;
	let requiredXPath: string | undefined;
	let requiredYPath: string | undefined;
	let resolvedX = configuration.x;
	let resolvedY = configuration.y;
	let matrixColor: ChartColorOptions | undefined;
	const marks: CompiledMark[] = [];
	const plotFrame = compileFrame(configuration.frame);
	if (plotFrame) marks.push(plotFrame);
	const tooltipFocusBand = compileTooltipFocusBand(data, configuration.marks, chartTooltip.groupBy);
	if (tooltipFocusBand) marks.push(tooltipFocusBand);

	configuration.marks.forEach((mark, index) => {
		const markPath = `${marksPath}[${index}]`;
		validateMarkId(mark, index, markPath, markIds);
		validateBandwidthScales(mark, configuration, markPath, path);
		if (mark.type === 'matrix' && isQuantitativeMatrixMark(mark)) {
			if (configuration.marks.length !== 1) {
				throw new TypeError(
					`[Chart] ${markPath}.value requires the matrix to be the only mark in its plot because it owns the numeric color scale.`
				);
			}
			matrixColor = compileMatrixColorOptions(mark, markPath);
		}
		if (mark.type === 'distribution') {
			if (distributionIndex !== undefined) {
				throw new TypeError(
					`[Chart] ${markPath}.type cannot be combined with ${marksPath}[${distributionIndex}].type; only one distribution mark is supported per plot.`
				);
			}
			distributionIndex = index;
			validateDistributionScales(mark, configuration, markPath, path);
		}

		const compiled = compileMark({
			data,
			mark,
			path: markPath,
			configuration,
			tooltipClassName,
			areaGradients,
			fallbackSeries,
			distributionDomain:
				mark.type === 'distribution' ? resolveDistributionDomain(mark, configuration) : undefined,
			tooltipGroupBy: chartTooltip.groupBy
		});
		if (compiled.implicitPositions) {
			resolvedX = compiled.implicitPositions.x;
			resolvedY = compiled.implicitPositions.y;
		}
		if (compiled.requiresX && requiredXPath === undefined) requiredXPath = markPath;
		if (compiled.requiresY && requiredYPath === undefined) requiredYPath = markPath;
		const compiledMarks = 'marks' in compiled ? compiled.marks : [compiled.mark];
		const annotationSources = compiled.annotationMarks ?? compiledMarks;
		const annotations =
			'annotations' in mark
				? compileAnnotations(data, mark, annotationSources, markPath)
				: { under: [], over: [] };
		const analysisMarks = compileMarkAnalysis({
			data,
			mark,
			path: markPath,
			fallbackSeries
		});
		let layers = [...annotations.under, ...compiledMarks, ...analysisMarks, ...annotations.over];
		if (seriesLabelFormat)
			layers = layers.map((layer) => withSeriesLabel(layer, seriesLabelFormat));
		marks.push(...(interactiveLegend ? layers.map(withLegendSeries) : layers));
	});

	if (requiredXPath !== undefined && resolvedX === undefined) {
		throw new TypeError(`[Chart] ${xPath} is required by ${requiredXPath}.`);
	}
	if (requiredYPath !== undefined && resolvedY === undefined) {
		throw new TypeError(`[Chart] ${yPath} is required by ${requiredYPath}.`);
	}

	const spec: CompiledChartSpec<TRow> = {
		marks,
		scales: {
			x:
				requiredXPath !== undefined && resolvedX
					? compilePosition(resolvedX, xPath, configuration.viewportDomain)
					: null,
			y: requiredYPath !== undefined && resolvedY ? compilePosition(resolvedY, yPath) : null
		},
		guides: configuration.guides,
		clip: configuration.clip ?? Boolean(hexbinMark),
		margin: configuration.margin,
		gradients: areaGradients?.definitions,
		color: {
			...(isKeyedPalette(configuration.palette)
				? { resolver: compileKeyedPaletteScale(configuration.palette) }
				: undefined),
			...(matrixColor ??
				(hexbinMark && configuration.marks.length === 1
					? compileHexbinColorOptions(hexbinMark)
					: undefined)),
			legend: compileChartLegend(
				configuration.legend,
				configuration.legendValue,
				interactiveLegend,
				configuration.onLegendSurface
			)
		},
		theme: compileChartTheme(configuration.palette)
	};

	return { spec, marks, tooltip: chartTooltip };
}

function validatePalette(palette: ChartPalette | undefined, path: string): void {
	if (palette === undefined) return;
	const entries = Array.isArray(palette) ? palette : Object.keys(palette);
	if (entries.length === 0) {
		throw new TypeError(`[Chart] ${path} must contain at least one color.`);
	}
}

function supportsSeriesVisibility<TRow extends object>(marks: readonly ChartMark<TRow>[]): boolean {
	return marks.every((mark) => {
		if (mark.type === 'distribution') return isEmpiricalDistributionMark(mark);
		if (mark.type !== 'series' && mark.type !== 'scatter' && mark.type !== 'bar') return false;
		if (mark.type === 'scatter' && mark.variant === 'hexbin') return false;
		return mark.series === undefined || mark.colorBy === undefined || mark.series === mark.colorBy;
	});
}

function compileTooltipFocusBand<TRow extends object>(
	data: readonly TRow[],
	marks: readonly ChartMark<TRow>[],
	axis: 'x' | 'y' | undefined
): CompiledMark | undefined {
	if (!axis) return undefined;
	const channel = marks
		.map((mark) => {
			switch (mark.type) {
				case 'series':
				case 'scatter':
				case 'bar':
					return mark[axis];
				case 'matrix':
					return mark.variant === 'calendar' ? undefined : mark[axis];
				default:
					return undefined;
			}
		})
		// A wide value channel is a list of fields, never the categorical focus axis.
		.find((candidate) => candidate !== undefined && !Array.isArray(candidate));
	if (!channel) return undefined;
	const accessor = compileChannel(channel as ChartChannel<TRow, ChartValue>);
	const rowsByValue = new Map<string, TRow>();
	data.forEach((row, index) => {
		const value = accessor(row, { index, data });
		if (value === null || value === undefined) return;
		const identity =
			value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
		if (!rowsByValue.has(identity)) rowsByValue.set(identity, row);
	});
	const rows = [...rowsByValue.values()];
	const fill = compileColor('neutral');
	const focusBand =
		axis === 'x'
			? bandX(rows, { id: 'chart-tooltip-focus', x: accessor, fill, fillOpacity: 0.14 })
			: bandY(rows, { id: 'chart-tooltip-focus', y: accessor, fill, fillOpacity: 0.14 });
	return whenFocused(focusBand, { match: axis });
}

function compileFrame(input: boolean | ChartFrameDefinition | undefined): CompiledMark | undefined {
	if (!input) return undefined;
	const definition = input === true ? {} : input;
	return frame({
		fill: compileOptionalColor(definition.fill),
		fillOpacity: definition.fillOpacity,
		stroke: compileColor(definition.stroke ?? 'neutral'),
		strokeOpacity: definition.strokeOpacity ?? 0.35,
		strokeWidth: definition.strokeWidth ?? 1,
		inset: definition.inset,
		radius: definition.radius
	});
}

function compileMark<TRow extends object>({
	data,
	mark,
	path,
	configuration,
	tooltipClassName,
	areaGradients,
	fallbackSeries,
	distributionDomain,
	tooltipGroupBy
}: CompileMarkInput<TRow>): CompiledMarkResult {
	switch (mark.type) {
		case 'series':
			return compileSeriesMark(data, mark, path, areaGradients, fallbackSeries, tooltipGroupBy);
		case 'scatter':
			return compileScatterMark(
				data,
				mark,
				path,
				fallbackSeries,
				tooltipGroupBy,
				configuration.marks.length === 1
			);
		case 'bar':
			return compileBarMark(data, mark, path, fallbackSeries);
		case 'distribution': {
			const compiled = compileDistribution({
				data,
				mark,
				path,
				group: compileChannel(mark.group),
				value: compileChannel(mark.value),
				color: mark.color === undefined ? undefined : compileColor(mark.color),
				domain: distributionDomain
			});
			return {
				marks: compiled.marks,
				annotationMarks: compiled.marks,
				requiresX: true,
				requiresY: true
			};
		}
		case 'proportion': {
			const marks = compileProportion({
				data,
				mark,
				path,
				category: compileChannel(mark.category),
				value: compileChannel(mark.value)
			});
			return { marks, annotationMarks: marks.slice(0, 1), requiresX: false, requiresY: false };
		}
		case 'matrix':
			return compileMatrixMark(data, mark, path, fallbackSeries);
		case 'facet': {
			const nestedConfiguration = shareFacetPositionDomains(
				data,
				{
					...configuration,
					marks: mark.marks,
					frame: undefined,
					legend: false,
					tooltip: undefined
				},
				mark.axes,
				tooltipClassName,
				path
			);
			return {
				mark: facet(data, {
					id: mark.id,
					by: compileKeyChannel(mark.by),
					chart: (facetData, { key: facetKey }) =>
						compileChartSpec(facetData, nestedConfiguration, tooltipClassName, path, () => facetKey)
							.spec,
					columns: mark.columns,
					minWidth: mark.minWidth,
					gap: mark.gap,
					label: mark.label,
					axes: mark.axes
				}),
				requiresX: false,
				requiresY: false
			};
		}
		case 'polar': {
			const polarMark = compilePolarChartMark(data, mark, path);
			return { mark: polarMark, annotationMarks: [polarMark], requiresX: false, requiresY: false };
		}
		case 'relation':
			throw new TypeError(`[Chart] ${path}.type "relation" cannot be nested in a facet.`);
		default:
			return unsupportedDiscriminant(mark, `${path}.type`);
	}
}

function shareFacetPositionDomains<TRow extends object>(
	data: readonly TRow[],
	configuration: ChartPlotConfiguration<TRow>,
	axes: 'outer' | 'cell' | undefined,
	tooltipClassName: string | undefined,
	path: string
): ChartPlotConfiguration<TRow> {
	if (axes === 'cell') return configuration;
	const { marks } = compileChartSpec(data, configuration, tooltipClassName, path);
	return {
		...configuration,
		x: inferFacetPositionDomain(marks, 'x', configuration.x),
		y: inferFacetPositionDomain(marks, 'y', configuration.y)
	};
}

function inferFacetPositionDomain(
	marks: readonly CompiledMark[],
	axis: 'x' | 'y',
	position: ChartPositionDefinition | undefined
): ChartPositionDefinition | undefined {
	if (!position || position.scale.domain !== undefined) return position;
	const { values, includeZero } = collectFacetScaleValues(marks, axis);
	if (!values.length) return position;
	switch (position.scale.type) {
		case 'band':
		case 'point':
			return {
				reverse: position.reverse,
				grid: position.grid,
				axis: position.axis,
				scale: { ...position.scale, domain: uniqueChartValues(values) }
			};
		case 'time':
		case 'utc': {
			const dates = values.filter(
				(value): value is Date => value instanceof Date && Number.isFinite(value.getTime())
			);
			if (!dates.length) return position;
			const timestamps = dates.map((date) => date.getTime());
			return {
				...position,
				scale: {
					...position.scale,
					domain: [new Date(Math.min(...timestamps)), new Date(Math.max(...timestamps))]
				}
			};
		}
		default: {
			const numbers = values.filter(
				(value): value is number => typeof value === 'number' && Number.isFinite(value)
			);
			if (!numbers.length) return position;
			if (includeZero) numbers.push(0);
			return {
				...position,
				scale: { ...position.scale, domain: [Math.min(...numbers), Math.max(...numbers)] }
			};
		}
	}
}

function collectFacetScaleValues(
	marks: readonly CompiledMark[],
	axis: 'x' | 'y'
): { values: ChartValue[]; includeZero: boolean } {
	const values: ChartValue[] = [];
	let includeZero = false;
	marks.forEach((mark, markIndex) => {
		const initialized = mark.initialize({ markIndex });
		for (const channel of Object.values(initialized.channels)) {
			if (channel.scale !== axis) continue;
			includeZero ||= channel.includeZero === true;
			for (const value of channel.values) {
				if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
					values.push(value);
				}
			}
		}
	});
	return { values, includeZero };
}

function uniqueChartValues(values: readonly ChartValue[]): readonly ChartValue[] {
	const unique = new Map<string, ChartValue>();
	for (const value of values) {
		const identity =
			value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
		if (!unique.has(identity)) unique.set(identity, value);
	}
	return [...unique.values()];
}

function validateRelationPlot<TRow extends object>(
	configuration: ChartPlotConfiguration<TRow>,
	relationIndex: number
): void {
	const markPath = `marks[${relationIndex}]`;
	if (configuration.marks.length !== 1) {
		throw new TypeError(
			`[Chart] ${markPath}.type must be the only mark in its plot because it owns the complete relation layout.`
		);
	}
	if (configuration.x !== undefined || configuration.y !== undefined) {
		throw new TypeError(`[Chart] ${markPath}.type cannot be combined with x or y positions.`);
	}
	if (
		configuration.guides !== undefined ||
		configuration.clip !== undefined ||
		configuration.frame !== undefined ||
		configuration.margin !== undefined
	) {
		throw new TypeError(
			`[Chart] ${markPath}.type owns guides, clipping, framing, and margins for its relation layout.`
		);
	}
}

function validateBandwidthScales<TRow extends object>(
	mark: ChartMark<TRow>,
	configuration: ChartPlotConfiguration<TRow>,
	markPath: string,
	definitionPath: string
): void {
	if (mark.type !== 'matrix') return;
	if (isCalendarMatrixMark(mark)) {
		if (configuration.x !== undefined || configuration.y !== undefined) {
			throw new TypeError(
				`[Chart] ${markPath}.variant "calendar" owns its x and y positions and cannot be combined with ${appendPath(definitionPath, 'x')} or ${appendPath(definitionPath, 'y')}.`
			);
		}
		return;
	}
	validateBandScale(configuration.x, `${markPath}.x`, appendPath(definitionPath, 'x'));
	validateBandScale(configuration.y, `${markPath}.y`, appendPath(definitionPath, 'y'));
}

function validateDistributionScales<TRow extends object>(
	mark: ChartDistributionMark<TRow>,
	configuration: ChartPlotConfiguration<TRow>,
	markPath: string,
	definitionPath: string
): void {
	const direction = mark.direction ?? 'vertical';
	if (isEmpiricalDistributionMark(mark)) {
		const valueAxis = direction === 'vertical' ? 'x' : 'y';
		const statisticAxis = direction === 'vertical' ? 'y' : 'x';
		validateLinearScale(
			configuration[valueAxis],
			`${markPath}.value`,
			appendPath(definitionPath, valueAxis)
		);
		validateLinearScale(
			configuration[statisticAxis],
			`${markPath}.variant`,
			appendPath(definitionPath, statisticAxis)
		);
		return;
	}
	const groupAxis = direction === 'vertical' ? 'x' : 'y';
	const valueAxis = direction === 'vertical' ? 'y' : 'x';
	const groupPosition = configuration[groupAxis];
	const valuePosition = configuration[valueAxis];
	if (groupPosition && groupPosition.scale.type !== 'band') {
		throw new TypeError(
			`[Chart] ${markPath}.group requires ${appendPath(definitionPath, groupAxis)}.scale.type to be "band".`
		);
	}
	if (valuePosition && valuePosition.scale.type !== 'linear') {
		throw new TypeError(
			`[Chart] ${markPath}.value requires ${appendPath(definitionPath, valueAxis)}.scale.type to be "linear".`
		);
	}
}

function validateProportionPlot<TRow extends object>(
	configuration: ChartPlotConfiguration<TRow>,
	proportionIndex: number,
	definitionPath: string
): void {
	const markPath = `${appendPath(definitionPath, 'marks')}[${proportionIndex}]`;
	if (configuration.marks.length !== 1) {
		throw new TypeError(
			`[Chart] ${markPath}.type must be the only mark in its plot because it owns the complete proportion layout.`
		);
	}
	if (configuration.x !== undefined || configuration.y !== undefined) {
		throw new TypeError(`[Chart] ${markPath}.type cannot be combined with x or y positions.`);
	}
}

function resolveTooltipSpecialization<TRow extends object>(
	distributionMark: ChartDistributionMark<TRow> | undefined,
	proportionMark: ChartProportionMark<TRow> | undefined,
	hexbinMark: Extract<ChartScatterMark<TRow>, { variant: 'hexbin' }> | undefined
): ChartTooltipSpecialization | undefined {
	if (distributionMark) {
		return { type: 'distribution', direction: distributionMark.direction ?? 'vertical' };
	}
	if (proportionMark) return { type: 'proportion' };
	return hexbinMark ? { type: 'hexbin' } : undefined;
}

function resolveDistributionDomain<TRow extends object>(
	mark: ChartDistributionMark<TRow>,
	configuration: ChartPlotConfiguration<TRow>
): readonly [number, number] | undefined {
	const isVertical = (mark.direction ?? 'vertical') === 'vertical';
	let position: ChartPositionDefinition | undefined;
	if (isEmpiricalDistributionMark(mark)) position = isVertical ? configuration.x : configuration.y;
	else position = isVertical ? configuration.y : configuration.x;
	return position?.scale.type === 'linear' ? position.scale.domain : undefined;
}

function appendPath(parent: string, field: string): string {
	return parent ? `${parent}.${field}` : field;
}

function validateBandScale(
	position: ChartPositionDefinition | undefined,
	channelPath: string,
	positionPath: string
): void {
	if (position === undefined || position.scale.type === 'band') return;
	throw new TypeError(`[Chart] ${channelPath} requires ${positionPath}.scale.type to be "band".`);
}

function validateLinearScale(
	position: ChartPositionDefinition | undefined,
	channelPath: string,
	positionPath: string
): void {
	if (position === undefined || position.scale.type === 'linear') return;
	throw new TypeError(`[Chart] ${channelPath} requires ${positionPath}.scale.type to be "linear".`);
}
