import { cell, type ChartColorOptions } from '@tanstack/charts';
import { scaleQuantize } from 'd3-scale';
import {
	compileChannel,
	compileColor,
	compileMarkChannels,
	compileOptionalColor
} from './chart.channels.js';
import type { CompiledMarkResult } from './chart.cartesian.js';
import type {
	ChartChannel,
	ChartKey,
	ChartMatrixMark,
	ChartPositionDefinition
} from './chart.props.js';

type QuantitativeMatrixMark<TRow> = ChartMatrixMark<TRow> & {
	value: ChartChannel<TRow, number>;
};

type CalendarMatrixMark<TRow> = Extract<ChartMatrixMark<TRow>, { variant: 'calendar' }>;

const CALENDAR_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const WEEK_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

export function isQuantitativeMatrixMark<TRow>(
	mark: ChartMatrixMark<TRow>
): mark is QuantitativeMatrixMark<TRow> {
	return mark.value !== undefined;
}

export function isCalendarMatrixMark<TRow>(
	mark: ChartMatrixMark<TRow>
): mark is CalendarMatrixMark<TRow> {
	return mark.variant === 'calendar';
}

export function compileMatrixMark<TRow extends object>(
	data: readonly TRow[],
	mark: ChartMatrixMark<TRow>,
	path: string,
	fallbackSeries?: ChartChannel<TRow, ChartKey>
): CompiledMarkResult {
	const variant: unknown = Reflect.get(mark, 'variant');
	if (variant !== undefined && variant !== 'grid' && variant !== 'calendar') {
		throw new TypeError(`[Chart] ${path}.variant "${String(variant)}" is not supported.`);
	}
	validateMatrixChannels(mark, path);
	if (isCalendarMatrixMark(mark)) return compileCalendarMatrixMark(data, mark, fallbackSeries);
	const matrix = cell(data, {
		...compileMarkChannels(mark, fallbackSeries),
		color: isQuantitativeMatrixMark(mark) ? compileChannel(mark.value) : undefined,
		x: compileChannel(mark.x),
		y: compileChannel(mark.y),
		fill: compileOptionalColor(typeof mark.fill === 'string' ? mark.fill : undefined),
		fillOpacity: mark.fillOpacity,
		stroke: compileOptionalColor(typeof mark.stroke === 'string' ? mark.stroke : undefined),
		strokeWidth: mark.strokeWidth,
		inset: mark.inset,
		radius: mark.radius
	});
	return { mark: matrix, annotationMarks: [matrix], requiresX: true, requiresY: true };
}

function compileCalendarMatrixMark<TRow extends object>(
	data: readonly TRow[],
	mark: CalendarMatrixMark<TRow>,
	fallbackSeries: ChartChannel<TRow, ChartKey> | undefined
): CompiledMarkResult {
	const date = compileChannel(mark.date);
	const dates = data.map((row, index) => date(row, { index, data }));
	const validDates = dates.filter(isValidDate);
	const calendarStart = validDates.length
		? startOfUtcWeek(new Date(Math.min(...validDates.map((value) => value.getTime()))))
		: new Date(0);
	const weekIndexes = dates.map((value) =>
		isValidDate(value)
			? Math.floor((startOfUtcWeek(value).getTime() - calendarStart.getTime()) / WEEK_MILLISECONDS)
			: undefined
	);
	const maximumWeek = Math.max(...weekIndexes.filter(isFiniteNumber), 0);
	const weekLabels = Array.from(
		{ length: validDates.length ? maximumWeek + 1 : 0 },
		(_value, index) => `W${String(index + 1).padStart(2, '0')}`
	);
	const matrix = cell(data, {
		...compileMarkChannels(mark, fallbackSeries),
		color: compileChannel(mark.value),
		x: (_row, { index }) => {
			const week = weekIndexes[index];
			return week === undefined ? undefined : weekLabels[week];
		},
		y: (_row, { index }) => {
			const value = dates[index];
			return isValidDate(value) ? CALENDAR_WEEKDAYS[(value.getUTCDay() + 6) % 7] : undefined;
		},
		fillOpacity: mark.fillOpacity,
		stroke: compileOptionalColor(mark.stroke),
		strokeWidth: mark.strokeWidth,
		inset: mark.inset,
		radius: mark.radius
	});
	const implicitPositions: { x: ChartPositionDefinition; y: ChartPositionDefinition } = {
		x: {
			scale: { type: 'band', domain: weekLabels, padding: 0.08 },
			axis: { label: 'Week', tickLabels: { thin: true } }
		},
		y: {
			scale: { type: 'band', domain: CALENDAR_WEEKDAYS, padding: 0.08 },
			axis: { label: 'Day' }
		}
	};
	return {
		mark: matrix,
		annotationMarks: [matrix],
		requiresX: true,
		requiresY: true,
		implicitPositions
	};
}

export function compileMatrixColorOptions<TRow>(
	mark: ChartMatrixMark<TRow>,
	path: string
): ChartColorOptions | undefined {
	if (!isQuantitativeMatrixMark(mark)) return undefined;
	const definition = mark.colorScale ?? { type: 'quantize' };
	if (definition.type !== 'quantize') {
		throw new TypeError(
			`[Chart] ${path}.colorScale.type "${String(definition.type)}" is not supported.`
		);
	}
	if (definition.domain) validateMatrixColorDomain(definition.domain, `${path}.colorScale.domain`);
	if (definition.range && definition.range.length < 2) {
		throw new TypeError(`[Chart] ${path}.colorScale.range must contain at least two colors.`);
	}
	const range = definition.range?.map(compileColor) ?? createMatrixColorRange(mark.color);
	const createScale = () => scaleQuantize<string>().range(range);
	return {
		scale: definition.domain ? createScale().domain(definition.domain) : createScale
	};
}

function validateMatrixChannels<TRow>(mark: ChartMatrixMark<TRow>, path: string): void {
	if (isCalendarMatrixMark(mark)) return;
	if (!isQuantitativeMatrixMark(mark)) {
		if (mark.colorScale !== undefined) {
			throw new TypeError(`[Chart] ${path}.colorScale requires ${path}.value.`);
		}
		return;
	}
	if (mark.colorBy !== undefined) {
		throw new TypeError(`[Chart] ${path}.value cannot be combined with ${path}.colorBy.`);
	}
	if (mark.fill !== undefined) {
		throw new TypeError(`[Chart] ${path}.value cannot be combined with ${path}.fill.`);
	}
}

function startOfUtcWeek(date: Date): Date {
	const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
	return start;
}

function isValidDate(value: Date | null | undefined): value is Date {
	return value instanceof Date && Number.isFinite(value.getTime());
}

function isFiniteNumber(value: number | undefined): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function createMatrixColorRange(color: Parameters<typeof compileColor>[0] = 'primary'): string[] {
	const compiled = compileColor(color);
	return [
		'var(--color-surface-recessed)',
		`color-mix(in oklab, ${compiled} 28%, var(--color-surface-recessed))`,
		`color-mix(in oklab, ${compiled} 48%, var(--color-surface-recessed))`,
		`color-mix(in oklab, ${compiled} 72%, var(--color-surface-recessed))`,
		compiled
	];
}

function validateMatrixColorDomain(domain: readonly [number, number], path: string): void {
	if (
		Array.isArray(domain) &&
		domain.length === 2 &&
		domain.every(Number.isFinite) &&
		domain[0] < domain[1]
	) {
		return;
	}
	throw new TypeError(`[Chart] ${path} must contain an increasing pair of finite numbers.`);
}
