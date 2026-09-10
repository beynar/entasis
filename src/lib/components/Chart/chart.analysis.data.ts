import {
	chartKeyIdentity,
	compileColor,
	compileOptionalChannel,
	type CompilableChartChannel,
	type CompiledChartChannel
} from './chart.channels.js';
import type { ChartAnalysisScope, ChartColor, ChartKey, ChartValue } from './chart.props.js';

export type AnalysisGroupAccessor<TRow> = CompiledChartChannel<TRow, ChartKey>;

export type AnalysisSourceRow<TRow> = {
	readonly row: TRow;
	readonly index: number;
};

export type AnalysisSourceGroup<TRow> = {
	readonly key: ChartKey | null;
	readonly identity: string;
	readonly rows: readonly AnalysisSourceRow<TRow>[];
};

export type AnalysisGroups<TRow> = {
	readonly groups: readonly AnalysisSourceGroup<TRow>[];
	readonly isGrouped: boolean;
};

export type AnalysisLineStyle = {
	readonly color?: ChartColor;
	readonly strokeOpacity?: number;
	readonly strokeWidth?: number;
	readonly strokeDasharray?: string;
};

export type AnalysisPaint = {
	readonly groupChannel?: 'group';
	readonly colorChannel?: 'group';
	readonly paint?: string;
};

export type NumericChartValue = {
	readonly numeric: number;
	readonly kind: 'number' | 'date';
};

export function groupAnalysisRows<TRow>(
	data: readonly TRow[],
	group: AnalysisGroupAccessor<TRow> | undefined,
	scope: ChartAnalysisScope | undefined,
	path: string
): AnalysisGroups<TRow> {
	if (scope !== undefined && scope !== 'plot' && scope !== 'series') {
		throw new TypeError(`[Chart] ${path}.scope "${String(scope)}" is not supported.`);
	}
	const resolvedScope = scope ?? (group ? 'series' : 'plot');
	if (resolvedScope === 'plot') {
		return {
			groups: [
				{
					key: null,
					identity: 'plot',
					rows: data.map((row, index) => ({ row, index }))
				}
			],
			isGrouped: false
		};
	}
	if (!group) {
		throw new TypeError(
			`[Chart] ${path}.scope "series" requires the parent mark to define series, colorBy, or group.`
		);
	}
	const groups = new Map<string, { key: ChartKey; rows: AnalysisSourceRow<TRow>[] }>();
	data.forEach((row, index) => {
		const key = group(row, { index, data });
		if (key === null || key === undefined) return;
		if (typeof key !== 'string' && typeof key !== 'number') {
			throw new TypeError(`[Chart] ${path}.scope received a non-scalar series key.`);
		}
		const identity = chartKeyIdentity(key);
		const existing = groups.get(identity);
		if (existing) existing.rows.push({ row, index });
		else groups.set(identity, { key, rows: [{ row, index }] });
	});
	return {
		groups: [...groups].map(([identity, groupRows]) => ({
			key: groupRows.key,
			identity,
			rows: groupRows.rows
		})),
		isGrouped: true
	};
}

export function resolveAnalysisPaint(
	style: AnalysisLineStyle,
	isGrouped: boolean,
	fallback: ChartColor
): AnalysisPaint {
	if (style.color !== undefined) {
		const paint = compileColor(style.color);
		return isGrouped ? { groupChannel: 'group', paint } : { paint };
	}
	return isGrouped
		? { groupChannel: 'group', colorChannel: 'group' }
		: { paint: compileColor(fallback) };
}

export function readNumericChartValue(value: unknown, path: string): NumericChartValue | undefined {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'number' && Number.isFinite(value)) {
		return { numeric: value, kind: 'number' };
	}
	if (value instanceof Date && Number.isFinite(value.getTime())) {
		return { numeric: value.getTime(), kind: 'date' };
	}
	throw new TypeError(`[Chart] ${path} requires finite numbers or dates.`);
}

export function readFiniteNumber(value: unknown, path: string): number | undefined {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	throw new TypeError(`[Chart] ${path} requires finite numbers.`);
}

export function readChartValue(value: unknown, path: string): ChartValue | undefined {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (value instanceof Date && Number.isFinite(value.getTime())) return value;
	throw new TypeError(`[Chart] ${path} requires finite numbers, strings, or dates.`);
}

export function restoreNumericChartValue(
	value: number,
	kind: NumericChartValue['kind']
): number | Date {
	return kind === 'date' ? new Date(value) : value;
}

export function assertSingleNumericKind(
	values: readonly NumericChartValue[],
	path: string
): NumericChartValue['kind'] | undefined {
	const kind = values[0]?.kind;
	if (kind && values.some((value) => value.kind !== kind)) {
		throw new TypeError(`[Chart] ${path} cannot mix numbers and dates.`);
	}
	return kind;
}

export function compileAnalysisGroupAccessor<TRow extends object>(
	channel: CompilableChartChannel<TRow, ChartKey> | undefined
): AnalysisGroupAccessor<TRow> | undefined {
	return compileOptionalChannel(channel);
}
