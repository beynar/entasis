// Drawer snap points: turning the `snapPoints` a consumer writes into pixel heights, and picking
// where a released drag comes to rest. Pure functions, so the rules are testable without a DOM.
import type { DialogSnapPoint } from './dialog.props.js';

/** A snap point and how much of the drawer shows when it rests there, in px. */
export type ResolvedSnapPoint = {
	/** The point as the consumer wrote it; this is what `snapPoint` and `onSnapPointChange` carry. */
	point: DialogSnapPoint;
	/** Height of the drawer that shows at this point, in px. */
	height: number;
};

/** What a snap point is measured against. */
export type SnapContext = {
	/** Height in px the drawer may use: the positioner's content box. */
	available: number;
	/** Height of the viewport in px, for `vh` lengths. */
	viewport: number;
	/** Font size of the root element in px, for `rem` and `em` lengths. */
	rem: number;
};

const LENGTH = /^\s*(\d*\.?\d+)\s*(px|rem|em|%|vh|dvh|svh|lvh)?\s*$/i;

/** Release speed in px/ms from which a drag is a flick, the same rule as dismissing a drawer. */
export const FLICK_SPEED = 0.4;

/**
 * The visible height of a snap point in px, `NaN` when it is not valid. A number is a fraction of
 * the available height (above 0, at most 1); a string is a CSS length: `px`, `rem`, `em`, `%` (of
 * the available height) or `vh`.
 */
export function snapPointHeight(point: DialogSnapPoint, context: SnapContext): number {
	if (typeof point === 'number') {
		return point > 0 && point <= 1 ? point * context.available : Number.NaN;
	}
	const match = LENGTH.exec(point);
	if (!match) return Number.NaN;
	const value = parseFloat(match[1]);
	const unit = (match[2] ?? 'px').toLowerCase();
	if (unit === 'px') return value;
	if (unit === 'rem' || unit === 'em') return value * context.rem;
	if (unit === '%') return (value / 100) * context.available;
	return (value / 100) * context.viewport;
}

/**
 * The snap points as px heights, from the lowest to the highest. Invalid points are dropped, a
 * point taller than the available room is clamped to it, and points that land on the same pixel
 * keep the first one written.
 */
export function resolveSnapPoints(
	points: readonly DialogSnapPoint[] | undefined,
	context: SnapContext
): ResolvedSnapPoint[] {
	if (!points?.length || !(context.available > 0)) return [];
	const resolved: ResolvedSnapPoint[] = [];
	for (const point of points) {
		const height = Math.min(snapPointHeight(point, context), context.available);
		if (!Number.isFinite(height) || height <= 0) continue;
		if (resolved.some((other) => Math.abs(other.height - height) < 0.5)) continue;
		resolved.push({ point, height });
	}
	return resolved.sort((a, b) => a.height - b.height);
}

/**
 * Where a released drag rests. `height` is how much of the drawer shows when the pointer lifts and
 * `velocity` its speed toward dismissal in px/ms (positive shrinks the drawer). A flick (at least
 * `FLICK_SPEED`) carries the drawer to the next point in the direction it was thrown, past the
 * lowest one to closed; a slower release rests at the nearest point, closed counting as a point
 * with a height of 0. Without `allowClose`, closed is never the answer. Returns the index into
 * `heights` (ascending), or `-1` to close. A tie keeps the drawer open and as large as possible.
 */
export function settleSnapIndex(
	heights: readonly number[],
	height: number,
	velocity: number,
	allowClose: boolean
): number {
	if (Math.abs(velocity) >= FLICK_SPEED) {
		if (velocity > 0) {
			for (let index = heights.length - 1; index >= 0; index -= 1) {
				if (heights[index] < height - 0.5) return index;
			}
			return allowClose ? -1 : 0;
		}
		for (let index = 0; index < heights.length; index += 1) {
			if (heights[index] > height + 0.5) return index;
		}
		return heights.length - 1;
	}
	let best = -1;
	let bestDistance = allowClose ? Math.abs(height) : Number.POSITIVE_INFINITY;
	for (let index = 0; index < heights.length; index += 1) {
		const distance = Math.abs(height - heights[index]);
		if (distance <= bestDistance) {
			best = index;
			bestDistance = distance;
		}
	}
	return best;
}
