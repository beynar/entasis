/**
 * Fitting a layout to its plot. Tree, network and sankey layouts place nodes along an axis at a
 * fraction of the available length, and polar charts draw their angle labels a fixed distance
 * outside the circle; either way the labels hang off the geometry by a known amount. Sizing the
 * geometry to those extents fills the plot instead of reserving guessed margins.
 */

/** Space kept between the outermost node or label and the plot edge, in px. */
export const CHART_FIT_MARGIN = 2;

/**
 * How far a label's line box reaches above and below its anchor, as shares of the font size, for
 * each SVG baseline the charts use.
 */
export const LABEL_LINE_BOX = {
	middle: { above: 0.65, below: 0.55 },
	auto: { above: 0.95, below: 0.25 },
	hanging: { above: 0.15, below: 1.05 }
} as const;

export type RelationAxisItem = {
	/** Position along the axis, 0 at the start of the span and 1 at its end. */
	fraction: number;
	/** Extent drawn before the node's anchor: its radius, or a label on that side. */
	before: number;
	/** Extent drawn after the node's anchor. */
	after: number;
};

export type RelationAxisFit = {
	/** Where fraction 0 lands. */
	start: number;
	/** Length covered by fractions 0 to 1. */
	span: number;
};

/**
 * The largest span whose items, with their extents, stay within `[margin, length - margin]`.
 * Any two items bound it: the distance from the earlier item's leading extent to the later
 * item's trailing extent must fit the plot.
 */
export function fitAxis(
	items: readonly RelationAxisItem[],
	length: number,
	margin = CHART_FIT_MARGIN
): RelationAxisFit {
	const room = Math.max(1, length - margin * 2);
	if (items.length === 0) return { start: margin, span: room };
	// Items sharing a fraction only ever contribute their largest extents.
	const byFraction = new Map<number, { before: number; after: number }>();
	for (const item of items) {
		const current = byFraction.get(item.fraction);
		byFraction.set(item.fraction, {
			before: Math.max(current?.before ?? 0, item.before),
			after: Math.max(current?.after ?? 0, item.after)
		});
	}
	const stops = [...byFraction].map(([fraction, extent]) => ({ fraction, ...extent }));
	let span = room;
	for (const earlier of stops) {
		for (const later of stops) {
			const distance = later.fraction - earlier.fraction;
			if (distance <= 0) continue;
			span = Math.min(span, (room - earlier.before - later.after) / distance);
		}
	}
	// Labels wider than the plot cannot fit at any span; keep the layout visible regardless.
	span = Math.max(1, span);
	const start = Math.max(...stops.map((stop) => margin + stop.before - stop.fraction * span));
	// A span limited by two items touches both edges. One that is not (a single position, or
	// extents too small to matter) leaves room at the end; split it so the layout stays centred.
	const end = Math.max(...stops.map((stop) => start + stop.fraction * span + stop.after));
	return { start: start + Math.max(0, length - margin - end) / 2, span };
}

/** `value` within `[min, max]` as a 0–1 fraction; a single position sits in the middle. */
export function axisFraction(value: number, min: number, max: number): number {
	return max > min ? (value - min) / (max - min) : 0.5;
}

/**
 * A deterministic width estimate for a chart label, so layouts match between the server and
 * the browser. Per-character advances approximate a UI sans-serif and err on the wide side.
 */
export function estimateLabelWidth(label: string, fontSize: number, fontWeight: number): number {
	let width = 0;
	for (const character of label) {
		if (/[ilj.,:;'!|()[\]\s]/.test(character)) width += 0.3;
		else if (/[ftr"-]/.test(character)) width += 0.4;
		else if (/[mwMW@%]/.test(character)) width += 0.88;
		else if (/[A-Z]/.test(character)) width += 0.68;
		else if (/[0-9]/.test(character)) width += 0.6;
		else if (/[a-z]/.test(character)) width += 0.56;
		else width += 0.8;
	}
	return width * fontSize * (fontWeight >= 600 ? 1.06 : 1);
}
