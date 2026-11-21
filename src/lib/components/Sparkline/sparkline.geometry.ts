// The drawing of a sparkline, free of the DOM. Everything is laid out in a 100 × 100 box that the
// SVG stretches to its own size: x runs from the first value to the last, y from the top of the
// scale (0) to its bottom (100). Strokes and dots keep their own width in pixels whatever the
// stretch, so these coordinates never need the size of the page.
//
// The variants, the markers and the trend threshold are react-tiny-sparkline's
// (github.com/mulkatz/react-tiny-sparkline), Copyright (c) 2026 Franz Benthin, MIT. The curve is
// a monotone cubic (Fritsch and Carlson, 1980), as d3's curveMonotoneX draws it.

export type SparklineVariant = 'line' | 'area' | 'bar' | 'dot';
/** Which way a series goes, in the vocabulary of Stat's `trendDirection`. */
export type SparklineTrend = 'up' | 'down' | 'neutral';
/** A point the `markers` prop can mark. */
export type SparklineMarker = 'min' | 'max' | 'first' | 'last';

/** The side of the box, in the SVG's own units. */
export const SPARKLINE_BOX = 100;

/**
 * The values the scale runs between. Bars stand on zero, so their scale always reaches it; the
 * other variants follow the data. `min` and `max` fix either end, to compare several sparklines.
 */
export const sparklineDomain = (
	data: readonly number[],
	variant: SparklineVariant,
	min?: number,
	max?: number
): [number, number] => {
	const finite = data.filter(Number.isFinite);
	let low = min ?? (finite.length ? Math.min(...finite) : 0);
	let high = max ?? (finite.length ? Math.max(...finite) : 0);
	if (variant === 'bar') {
		if (min === undefined) low = Math.min(low, 0);
		if (max === undefined) high = Math.max(high, 0);
	}
	return high < low ? [high, low] : [low, high];
};

/**
 * Where each value sits, from the top of the box (0) to its bottom (100). A flat series, whose
 * scale has no height, sits in the middle; a value outside a fixed scale is held at its edge.
 */
export const sparklineYs = (data: readonly number[], [low, high]: [number, number]) => {
	const range = high - low;
	return data.map((value) => {
		if (!Number.isFinite(value)) return SPARKLINE_BOX / 2;
		if (range === 0) return SPARKLINE_BOX / 2;
		const share = Math.min(1, Math.max(0, (value - low) / range));
		return SPARKLINE_BOX * (1 - share);
	});
};

/** Where zero sits on the scale: the line bars stand on, at an edge when zero is outside it. */
export const sparklineBaseline = ([low, high]: [number, number]) => {
	const range = high - low;
	if (range === 0) return SPARKLINE_BOX;
	const share = Math.min(1, Math.max(0, (0 - low) / range));
	return SPARKLINE_BOX * (1 - share);
};

/**
 * Where each value sits across the box. Lines and dots run from edge to edge, a single value in
 * the middle; bars take one slot each and sit in its centre.
 */
export const sparklineXs = (count: number, variant: SparklineVariant) => {
	if (variant === 'bar') {
		const slot = SPARKLINE_BOX / Math.max(count, 1);
		return Array.from({ length: count }, (_, index) => slot * (index + 0.5));
	}
	if (count === 1) return [SPARKLINE_BOX / 2];
	return Array.from({ length: count }, (_, index) => (SPARKLINE_BOX * index) / (count - 1));
};

const round = (value: number) => Math.round(value * 1000) / 1000;

const sign = (value: number) => (value < 0 ? -1 : 1);

/**
 * The slope of the curve at each value: zero at a peak or a trough, and never so steep that the
 * curve would rise past the next value. At either end, the slope that reaches its neighbour.
 */
const monotoneSlopes = (xs: readonly number[], ys: readonly number[]) => {
	const count = xs.length;
	const secants = Array.from(
		{ length: count - 1 },
		(_, index) => (ys[index + 1] - ys[index]) / (xs[index + 1] - xs[index] || 1)
	);
	const slopes = new Array<number>(count).fill(0);
	for (let index = 1; index < count - 1; index++) {
		const before = secants[index - 1];
		const after = secants[index];
		const left = xs[index] - xs[index - 1];
		const right = xs[index + 1] - xs[index];
		const blend = (before * right + after * left) / (left + right || 1);
		slopes[index] =
			(sign(before) + sign(after)) *
				Math.min(Math.abs(before), Math.abs(after), 0.5 * Math.abs(blend)) || 0;
	}
	if (count === 2) {
		slopes[0] = secants[0];
		slopes[1] = secants[0];
	} else {
		slopes[0] = (3 * secants[0] - slopes[1]) / 2;
		slopes[count - 1] = (3 * secants[count - 2] - slopes[count - 2]) / 2;
	}
	return slopes;
};

/**
 * The line through the points: straight segments, or a smooth curve that rises and falls only
 * where the values do, so it never overshoots one.
 */
export const sparklineLinePath = (
	xs: readonly number[],
	ys: readonly number[],
	curved: boolean
) => {
	if (xs.length === 0) return '';
	if (xs.length === 1) {
		// One value: a level stroke across the box, at its height.
		return `M0,${round(ys[0])} L${SPARKLINE_BOX},${round(ys[0])}`;
	}
	const slopes = curved ? monotoneSlopes(xs, ys) : [];
	let path = `M${round(xs[0])},${round(ys[0])}`;
	for (let index = 1; index < xs.length; index++) {
		const x = round(xs[index]);
		const y = round(ys[index]);
		if (curved) {
			const third = (xs[index] - xs[index - 1]) / 3;
			const from = `${round(xs[index - 1] + third)},${round(ys[index - 1] + slopes[index - 1] * third)}`;
			const to = `${round(xs[index] - third)},${round(ys[index] - slopes[index] * third)}`;
			path += ` C${from} ${to} ${x},${y}`;
		} else {
			path += ` L${x},${y}`;
		}
	}
	return path;
};

/**
 * The surface under the line, closed along the bottom of the box. `reach` carries it that far
 * past the box on either side and below it (in the box's units), to the edges of the root the
 * box is inset in: the fill then meets them, where the line stops short by half its stroke.
 */
export const sparklineAreaPath = (
	xs: readonly number[],
	ys: readonly number[],
	curved: boolean,
	reach: { x: number; y: number } = { x: 0, y: 0 }
) => {
	if (xs.length === 0) return '';
	const line = sparklineLinePath(xs, ys, curved);
	const bottom = round(SPARKLINE_BOX + reach.y);
	if (reach.x > 0) {
		const left = round(-reach.x);
		const right = round(SPARKLINE_BOX + reach.x);
		const [first, last] = [round(ys[0]), round(ys[ys.length - 1])];
		return `M${left},${first} L${line.slice(1)} L${right},${last} L${right},${bottom} L${left},${bottom} Z`;
	}
	const first = xs.length === 1 ? 0 : round(xs[0]);
	const last = xs.length === 1 ? SPARKLINE_BOX : round(xs[xs.length - 1]);
	return `${line} L${last},${bottom} L${first},${bottom} Z`;
};

/**
 * A dot on each of the given values: a stroke of no length, drawn with round ends, so it stays
 * round however the box stretches.
 */
export const sparklineDotPath = (
	xs: readonly number[],
	ys: readonly number[],
	indices: readonly number[]
) => indices.map((index) => `M${round(xs[index])},${round(ys[index])} h0`).join(' ');

/**
 * One rectangle per value, standing on zero: upwards for a positive value, downwards below. When
 * zero is the bottom (or the top) of the box, `reach` carries the bars that far past it (in the
 * box's units), to the edge of the root the box is inset in.
 */
export const sparklineBars = (
	ys: readonly number[],
	baseline: number,
	gap: number,
	reach = 0
): { x: number; y: number; width: number; height: number }[] => {
	const slot = SPARKLINE_BOX / Math.max(ys.length, 1);
	const share = Math.min(0.9, Math.max(0, gap));
	const width = slot * (1 - share);
	const below = baseline >= SPARKLINE_BOX ? reach : 0;
	const above = baseline <= 0 ? reach : 0;
	return ys.map((y, index) => {
		const top = Math.min(y, baseline);
		const bottom = Math.max(y, baseline);
		const height = bottom - top;
		// A bar of no height stays empty: the reach is not a value.
		const extra =
			height > 0
				? { top: y < baseline ? 0 : above, bottom: y < baseline ? below : 0 }
				: { top: 0, bottom: 0 };
		return {
			x: round(slot * index + (slot - width) / 2),
			y: round(top - extra.top),
			width: round(width),
			height: round(height + extra.top + extra.bottom)
		};
	});
};

/** The indices of the lowest and the highest value; the first one wins a tie. */
export const sparklineExtremes = (data: readonly number[]) => {
	let min = -1;
	let max = -1;
	data.forEach((value, index) => {
		if (!Number.isFinite(value)) return;
		if (min === -1 || value < data[min]) min = index;
		if (max === -1 || value > data[max]) max = index;
	});
	return { min, max };
};

/** The index a marker names, or -1 when the series has no such point. */
export const sparklineMarkerIndex = (data: readonly number[], marker: SparklineMarker) => {
	if (data.length === 0) return -1;
	if (marker === 'first') return 0;
	if (marker === 'last') return data.length - 1;
	return sparklineExtremes(data)[marker];
};

/**
 * Which way the series goes: from its first value to its last, ignoring a change smaller than
 * a twentieth of its range.
 */
export const sparklineTrend = (data: readonly number[]): SparklineTrend => {
	const finite = data.filter(Number.isFinite);
	if (finite.length < 2) return 'neutral';
	const first = finite[0];
	const last = finite[finite.length - 1];
	const threshold = (Math.max(...finite) - Math.min(...finite)) * 0.05;
	if (last - first > threshold) return 'up';
	if (first - last > threshold) return 'down';
	return 'neutral';
};

/**
 * Where the trend arrow goes on the last value. On the side the line does not come from, so it
 * stays clear of it: over a value the line rises to, under one it falls to. When that side has
 * less than a third of the box, on the other side, `crowded`: the line passes near there, so the
 * arrow keeps further from it. Over a bar, always: under its top would be inside it.
 */
export const sparklineTrendPlacement = (
	ys: readonly number[],
	variant: SparklineVariant,
	baseline: number
): { placement: 'above' | 'below'; y: number; crowded: boolean } | null => {
	const last = ys.length - 1;
	if (last < 0) return null;
	if (variant === 'bar')
		return { placement: 'above', y: Math.min(ys[last], baseline), crowded: false };
	const y = ys[last];
	const previous = last > 0 ? ys[last - 1] : y;
	const room = { above: y, below: SPARKLINE_BOX - y };
	const free: 'above' | 'below' =
		previous > y ? 'above' : previous < y ? 'below' : room.above >= room.below ? 'above' : 'below';
	if (room[free] >= SPARKLINE_BOX / 3) return { placement: free, y, crowded: false };
	const other = free === 'above' ? 'below' : 'above';
	return room[other] > room[free]
		? { placement: other, y, crowded: true }
		: { placement: free, y, crowded: false };
};

/** The value nearest to a place across the box, given as a share of its width (0 to 1). */
export const sparklineNearestIndex = (share: number, count: number, variant: SparklineVariant) => {
	if (count <= 0) return -1;
	const clamped = Math.min(1, Math.max(0, share));
	const index = variant === 'bar' ? Math.floor(clamped * count) : Math.round(clamped * (count - 1));
	return Math.min(count - 1, Math.max(0, index));
};
