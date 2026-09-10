import type { ChannelAccessor, ChartAxisOptions, ChartScale } from '@tanstack/charts';
import {
	scaleBand,
	scaleLinear,
	scaleLog,
	scalePoint,
	scalePow,
	scaleSqrt,
	scaleSymlog,
	scaleTime,
	scaleUtc
} from 'd3-scale';
import {
	curveBasis,
	curveBasisClosed,
	curveCardinal,
	curveCardinalClosed,
	curveCatmullRom,
	curveCatmullRomClosed,
	curveLinear,
	curveLinearClosed,
	curveMonotoneX,
	curveMonotoneY,
	curveNatural,
	curveStep,
	curveStepAfter,
	curveStepBefore,
	type CurveFactory
} from 'd3-shape';
import type {
	ChartCurve,
	ChartScaleDefinition,
	ChartScatterSizeScale,
	ChartValue
} from './chart.props.js';

type CompiledScale = Exclude<ChartAxisOptions['scale'], ChartScale>;

function configuredScale<TDomain, TScale extends { domain(values: Iterable<TDomain>): TScale }>(
	domain: readonly TDomain[] | undefined,
	createScale: () => TScale
): TScale | (() => TScale) {
	return domain === undefined ? createScale : createScale().domain(domain);
}

export function compileChartScale(definition: ChartScaleDefinition, path: string): CompiledScale {
	switch (definition.type) {
		case 'linear':
			return configuredScale(definition.domain, () => createLinearScale(definition));
		case 'sqrt':
			return configuredScale(definition.domain, () => createSqrtScale(definition));
		case 'pow':
			return configuredScale(definition.domain, () => createPowerScale(definition));
		case 'log':
			return configuredScale(definition.domain, () => createLogScale(definition));
		case 'symlog':
			return configuredScale(definition.domain, () => createSymlogScale(definition));
		case 'time':
			return configuredScale(definition.domain, () => createTimeScale(definition));
		case 'utc':
			return configuredScale(definition.domain, () => createUtcScale(definition));
		case 'band':
			return configuredScale<ChartValue, ReturnType<typeof scaleBand<ChartValue>>>(
				definition.domain,
				() => {
					const scale = scaleBand<ChartValue>();
					if (definition.padding !== undefined) scale.padding(definition.padding);
					if (definition.paddingInner !== undefined) scale.paddingInner(definition.paddingInner);
					if (definition.paddingOuter !== undefined) scale.paddingOuter(definition.paddingOuter);
					if (definition.align !== undefined) scale.align(definition.align);
					return scale;
				}
			);
		case 'point':
			return configuredScale<ChartValue, ReturnType<typeof scalePoint<ChartValue>>>(
				definition.domain,
				() => {
					const scale = scalePoint<ChartValue>();
					if (definition.padding !== undefined) scale.padding(definition.padding);
					if (definition.align !== undefined) scale.align(definition.align);
					return scale;
				}
			);
		default:
			return unsupportedScale(definition, path);
	}
}

function createLinearScale(definition: Extract<ChartScaleDefinition, { type: 'linear' }>) {
	return scaleLinear().clamp(definition.clamp ?? false);
}

function createSqrtScale(definition: Extract<ChartScaleDefinition, { type: 'sqrt' }>) {
	return scaleSqrt().clamp(definition.clamp ?? false);
}

function createPowerScale(definition: Extract<ChartScaleDefinition, { type: 'pow' }>) {
	const scale = scalePow().clamp(definition.clamp ?? false);
	return definition.exponent === undefined ? scale : scale.exponent(definition.exponent);
}

function createLogScale(definition: Extract<ChartScaleDefinition, { type: 'log' }>) {
	const scale = scaleLog().clamp(definition.clamp ?? false);
	return definition.base === undefined ? scale : scale.base(definition.base);
}

function createSymlogScale(definition: Extract<ChartScaleDefinition, { type: 'symlog' }>) {
	const scale = scaleSymlog().clamp(definition.clamp ?? false);
	return definition.constant === undefined ? scale : scale.constant(definition.constant);
}

function createTimeScale(definition: Extract<ChartScaleDefinition, { type: 'time' }>) {
	return scaleTime().clamp(definition.clamp ?? false);
}

function createUtcScale(definition: Extract<ChartScaleDefinition, { type: 'utc' }>) {
	return scaleUtc().clamp(definition.clamp ?? false);
}

export function compileChartCurve(curve: ChartCurve, path: string): CurveFactory {
	switch (curve) {
		case 'linear':
			return curveLinear;
		case 'linear-closed':
			return curveLinearClosed;
		case 'step':
			return curveStep;
		case 'step-before':
			return curveStepBefore;
		case 'step-after':
			return curveStepAfter;
		case 'basis':
			return curveBasis;
		case 'basis-closed':
			return curveBasisClosed;
		case 'cardinal':
			return curveCardinal;
		case 'cardinal-closed':
			return curveCardinalClosed;
		case 'catmull-rom':
			return curveCatmullRom;
		case 'catmull-rom-closed':
			return curveCatmullRomClosed;
		case 'monotone-x':
			return curveMonotoneX;
		case 'monotone-y':
			return curveMonotoneY;
		case 'natural':
			return curveNatural;
		default:
			return unsupportedCurve(curve, path);
	}
}

const DEFAULT_SCATTER_SIZE_RANGE = [3, 18] as const;

type NumericChannelAccessor<TRow> = ChannelAccessor<TRow, number | null | undefined>;

type ResolvedScatterSizeScale = Exclude<ChartScatterSizeScale, string>;

export function compileChartSizeChannel<TRow>(
	channel: NumericChannelAccessor<TRow>,
	definition: ChartScatterSizeScale = 'sqrt',
	path = 'sizeScale'
): NumericChannelAccessor<TRow> {
	const resolved = resolveScatterSizeScale(definition, path);
	let cachedRows: readonly TRow[] | undefined;
	let cachedRadii: readonly (number | null | undefined)[] = [];

	return (_row, { index, data }) => {
		if (data !== cachedRows) {
			const values = data.map((row, rowIndex) => channel(row, { index: rowIndex, data }));
			cachedRadii = mapScatterSizes(values, resolved, path);
			cachedRows = data;
		}
		return cachedRadii[index];
	};
}

function resolveScatterSizeScale(
	definition: ChartScatterSizeScale,
	path: string
): ResolvedScatterSizeScale {
	if (typeof definition === 'string') {
		switch (definition) {
			case 'linear':
			case 'sqrt':
			case 'log':
			case 'exp':
				return { type: definition };
			default:
				throw new TypeError(`[Chart] ${path} "${definition}" is not supported.`);
		}
	}
	if (typeof definition !== 'object' || definition === null) {
		throw new TypeError(`[Chart] ${path} must be a shortcut or scale definition.`);
	}
	validateScatterSizeScale(definition, path);
	return definition;
}

function mapScatterSizes(
	values: readonly (number | null | undefined)[],
	definition: ResolvedScatterSizeScale,
	path: string
): readonly (number | null | undefined)[] {
	const observed = values.filter(
		(value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
	);
	const mapRadius = createScatterSizeMapper(definition, observed, path);

	return values.map((value) => {
		if (value === null || value === undefined) return value;
		if (!Number.isFinite(value) || value < 0) return undefined;
		if (definition.type === 'log' && value === 0) return 0;
		const radius = mapRadius(value);
		return Number.isFinite(radius) && radius >= 0 ? radius : undefined;
	});
}

function createScatterSizeMapper(
	definition: ResolvedScatterSizeScale,
	values: readonly number[],
	path: string
): (value: number) => number {
	const domain = definition.domain ?? inferScatterSizeDomain(definition.type, values);
	const range = definition.range ?? DEFAULT_SCATTER_SIZE_RANGE;
	validateScatterSizeDomain(domain, definition.type, `${path}.domain`);

	switch (definition.type) {
		case 'linear':
			return scaleLinear().domain(domain).range(range);
		case 'sqrt':
			return scaleSqrt().domain(domain).range(range);
		case 'log':
			return scaleLog()
				.base(definition.base ?? 10)
				.domain(domain)
				.range(range);
		case 'exp':
			return createExponentialSizeMapper(domain, range, definition.base ?? Math.E);
	}
}

function inferScatterSizeDomain(
	type: ResolvedScatterSizeScale['type'],
	values: readonly number[]
): readonly [number, number] {
	if (type === 'log') {
		const positiveValues = values.filter((value) => value > 0);
		if (positiveValues.length === 0) return [1, 10];
		const minimum = Math.min(...positiveValues);
		const maximum = Math.max(...positiveValues);
		return minimum === maximum ? [minimum, minimum * 10] : [minimum, maximum];
	}

	const maximum = values.length === 0 ? 1 : Math.max(...values);
	return [0, maximum === 0 ? 1 : maximum];
}

function createExponentialSizeMapper(
	domain: readonly [number, number],
	range: readonly [number, number],
	base: number
): (value: number) => number {
	const [domainMinimum, domainMaximum] = domain;
	const [rangeMinimum, rangeMaximum] = range;
	if (domainMinimum === domainMaximum) {
		const midpoint = (rangeMinimum + rangeMaximum) / 2;
		return () => midpoint;
	}
	const logarithm = Math.log(base);
	const denominator = Math.expm1(logarithm);
	return (value) => {
		const position = (value - domainMinimum) / (domainMaximum - domainMinimum);
		const transformed = Math.expm1(logarithm * position) / denominator;
		return rangeMinimum + transformed * (rangeMaximum - rangeMinimum);
	};
}

function validateScatterSizeScale(definition: ResolvedScatterSizeScale, path: string): void {
	if (
		definition.type !== 'linear' &&
		definition.type !== 'sqrt' &&
		definition.type !== 'log' &&
		definition.type !== 'exp'
	) {
		throw new TypeError(`[Chart] ${path}.type "${String(definition.type)}" is not supported.`);
	}
	if (definition.domain) {
		validateScatterSizeDomain(definition.domain, definition.type, `${path}.domain`);
	}
	if (definition.range) validateFinitePair(definition.range, `${path}.range`, true);
	if ('base' in definition && definition.base !== undefined) {
		if (!Number.isFinite(definition.base) || definition.base <= 1) {
			throw new TypeError(`[Chart] ${path}.base must be a finite number greater than 1.`);
		}
	}
}

function validateScatterSizeDomain(
	values: readonly [number, number],
	type: ResolvedScatterSizeScale['type'],
	path: string
): void {
	validateFinitePair(values, path, true);
	if (values[0] > values[1]) {
		throw new TypeError(`[Chart] ${path} minimum must not exceed its maximum.`);
	}
	if (type === 'log' && values.some((value) => value <= 0)) {
		throw new TypeError(`[Chart] ${path} must contain two positive numbers for a log scale.`);
	}
}

function validateFinitePair(
	values: readonly [number, number],
	path: string,
	requireNonnegative: boolean
): void {
	if (
		Array.isArray(values) &&
		values.length === 2 &&
		values.every((value) => Number.isFinite(value) && (!requireNonnegative || value >= 0))
	) {
		return;
	}
	const requirement = requireNonnegative ? 'finite non-negative numbers' : 'finite numbers';
	throw new TypeError(`[Chart] ${path} must contain two ${requirement}.`);
}

function unsupportedScale(definition: never, path: string): never {
	throw new TypeError(
		`[Chart] ${path}.type "${String(readDiscriminant(definition))}" is not supported.`
	);
}

function unsupportedCurve(curve: never, path: string): never {
	throw new TypeError(`[Chart] ${path} "${String(curve)}" is not supported.`);
}

function readDiscriminant(value: unknown): unknown {
	return typeof value === 'object' && value !== null && 'type' in value ? value.type : value;
}
