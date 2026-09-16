import type { ChartMark } from './chart.props.js';

/** Width the server-rendered SVG is laid out at before the browser measures the container. */
export const CHART_PRERENDER_WIDTH = 800;

export type ChartSize = {
	/** Layout width used by the prerendered SVG. */
	readonly width: number;
	/** Fixed plot height in pixels, when `height` sizes the chart. */
	readonly height?: number;
	/** Plot width-to-height ratio, when `aspectRatio` sizes the chart. */
	readonly aspectRatio?: number;
};

/**
 * One sizing input owns the chart: `height` fixes the plot height, `aspectRatio` derives it
 * from the measured width, and neither leaves the root class in charge. The same result
 * sizes the browser layout and the server-rendered SVG, so the two can never drift.
 */
export function resolveChartSize(
	height: number | undefined,
	aspectRatio: number | undefined
): ChartSize | undefined {
	if (height !== undefined && aspectRatio !== undefined) {
		throw new TypeError(
			'[Chart] height cannot be combined with aspectRatio; each one sizes the chart on its own.'
		);
	}
	if (height !== undefined) {
		if (!Number.isFinite(height) || height <= 0) {
			throw new TypeError('[Chart] height must be a finite number of pixels greater than 0.');
		}
		return { width: CHART_PRERENDER_WIDTH, height };
	}
	if (aspectRatio !== undefined) {
		if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
			throw new TypeError('[Chart] aspectRatio must be a finite number greater than 0.');
		}
		return { width: CHART_PRERENDER_WIDTH, aspectRatio };
	}
	return undefined;
}

export function validateMarkId<TRow extends object>(
	mark: ChartMark<TRow>,
	index: number,
	path: string,
	seen: Map<string, number>
): void {
	validateExplicitId(mark.id, index, path, seen);
}

export function validateExplicitId(
	id: string | undefined,
	index: number,
	path: string,
	seen: Map<string, number>
): void {
	if (id === undefined) return;
	const previousIndex = seen.get(id);
	if (previousIndex !== undefined) {
		const previousPath = path.replace(/\[\d+\]$/, `[${previousIndex}]`);
		throw new TypeError(`[Chart] ${path}.id duplicates ${previousPath}.id "${id}".`);
	}
	seen.set(id, index);
}
