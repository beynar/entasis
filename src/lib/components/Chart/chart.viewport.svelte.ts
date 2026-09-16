import type { ChartControl, ChartScene, ChartValue as TanStackValue } from '@tanstack/charts';
import { brushX, type BrushRange, type BrushXChange } from '@tanstack/charts/interaction/brush';
import { controlledSignal } from '@tanstack/charts/interaction/signal';
import type { ChartValue } from './chart.core.js';
import type { ChartState } from './chart.state.svelte.js';
import { resolveChartViewport, sameChartViewportDomain } from './chart.viewport.js';

export class ChartViewportState<TRow extends object> {
	readonly #chart: ChartState<TRow>;
	/** The chart this viewport belongs to. */
	get chart(): ChartState<TRow> {
		return this.#chart;
	}
	xDomain = $state<readonly ChartValue[] | undefined>();
	fullDomain = $state<readonly ChartValue[]>([]);
	range = $state<BrushRange<ChartValue> | undefined>();
	isBrushing = $state(false);

	readonly currentDomain = $derived(this.xDomain ?? this.fullDomain);
	readonly configuration = $derived(
		resolveChartViewport(this.chart.viewport, this.chart.x, this.chart.viewportMotion)
	);
	readonly axis = $derived(this.configuration ? 'x' : undefined);
	readonly isEnabled = $derived(this.configuration !== undefined);
	readonly isZoomed = $derived(this.xDomain !== undefined);
	readonly showReset = $derived(this.configuration?.reset === true && this.isZoomed);
	readonly animation = $derived(this.configuration?.animation);
	readonly controls = $derived(this.createControls());
	readonly status = $derived(this.isZoomed ? 'Chart zoomed on the x axis.' : '');

	constructor(chart: ChartState<TRow>) {
		this.#chart = chart;
		$effect(() => {
			if (this.configuration) return;
			this.xDomain = undefined;
			this.fullDomain = [];
			this.range = undefined;
			this.isBrushing = false;
		});
	}

	syncScene(scene: ChartScene<TRow>) {
		if (!this.configuration || this.isZoomed) return;
		const scale = scene.scales.x;
		if (!scale || scale.domain.length === 0) return;
		const domain = scale.domain;
		if (!sameChartViewportDomain(domain, this.fullDomain)) {
			this.fullDomain = domain;
			this.range = domainRange(domain);
		}
	}

	reset = () => {
		if (this.isZoomed) this.chart.clearPointerFocus();
		this.xDomain = undefined;
		this.range = domainRange(this.fullDomain);
		this.isBrushing = false;
	};

	private createControls(): readonly ChartControl[] | undefined {
		if (!this.configuration || !this.range) return undefined;
		const isFullRange = sameRange(this.range, domainRange(this.currentDomain));
		const options = {
			label: 'Chart zoom range',
			startAriaLabel: 'Zoom range start',
			endAriaLabel: 'Zoom range end',
			format: formatBrushValue,
			selectionStyle: {
				fill: 'var(--color-primary)',
				fillOpacity: isFullRange ? 0 : 0.15,
				stroke: 'var(--color-primary)',
				strokeOpacity: isFullRange ? 0 : 1,
				strokeWidth: 1
			},
			handleStyle: {
				fill: 'var(--color-primary)',
				fillOpacity: isFullRange ? 0 : 0.9
			}
		};
		if (this.chart.x?.scale.type === 'band' || this.chart.x?.scale.type === 'point') {
			return [
				brushX({
					...options,
					values: this.currentDomain,
					range: controlledSignal(
						this.range,
						(next, { reason }: { reason: BrushXChange<ChartValue> }) =>
							this.handleBrushChange(next, reason)
					)
				})
			];
		}
		const { start, end } = this.range;
		if (typeof start === 'string' || typeof end === 'string') {
			throw new TypeError('[Chart] A continuous brush requires number or Date bounds.');
		}
		return [
			brushX({
				...options,
				keyboard: false,
				range: controlledSignal(
					{ start, end },
					(next, { reason }: { reason: BrushXChange<number | Date> }) =>
						this.handleBrushChange(next, reason)
				)
			})
		];
	}

	private handleBrushChange(next: BrushRange<ChartValue>, reason: BrushXChange<ChartValue>) {
		this.chart.clearPointerFocus();
		this.isBrushing = reason.type === 'preview';
		if (reason.type === 'cancel') {
			this.range = reason.origin;
			return;
		}
		this.range = next;
		if (reason.type !== 'commit') return;
		const domain = selectedDomain(this.chart.x, this.currentDomain, next);
		if (!domain || sameChartViewportDomain(domain, this.currentDomain)) {
			this.range = domainRange(this.currentDomain);
			return;
		}
		this.range = domainRange(domain);
		this.xDomain = domain;
	}
}

function selectedDomain(
	position: ChartState<object>['x'],
	currentDomain: readonly ChartValue[],
	range: BrushRange<ChartValue>
): readonly ChartValue[] | undefined {
	if (!position || currentDomain.length === 0) return undefined;
	if (position.scale.type === 'band' || position.scale.type === 'point') {
		const start = currentDomain.findIndex((value) => sameValue(value, range.start));
		const end = currentDomain.findIndex((value) => sameValue(value, range.end));
		if (start < 0 || end < 0) return undefined;
		const selected = currentDomain.slice(Math.min(start, end), Math.max(start, end) + 1);
		return selected.length > 1 ? selected : undefined;
	}
	if (sameValue(range.start, range.end)) return undefined;
	const isAscending = valueNumber(currentDomain[0]) <= valueNumber(currentDomain.at(-1));
	return isAscending ? [range.start, range.end] : [range.end, range.start];
}

function domainRange(domain: readonly ChartValue[]): BrushRange<ChartValue> | undefined {
	const start = domain[0];
	const end = domain.at(-1);
	return start === undefined || end === undefined ? undefined : { start, end };
}

function sameRange(
	left: BrushRange<ChartValue>,
	right: BrushRange<ChartValue> | undefined
): boolean {
	return Boolean(right && sameValue(left.start, right.start) && sameValue(left.end, right.end));
}

function sameValue(left: ChartValue, right: TanStackValue | undefined): boolean {
	if (left instanceof Date || right instanceof Date) {
		return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
	}
	return Object.is(left, right);
}

function valueNumber(value: ChartValue | undefined): number {
	if (value instanceof Date) return value.getTime();
	return typeof value === 'number' ? value : Number.NaN;
}

function formatBrushValue(value: ChartValue): string {
	return value instanceof Date ? value.toLocaleDateString() : String(value);
}
