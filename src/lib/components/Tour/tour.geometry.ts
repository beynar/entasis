// The pure geometry of the Tour spotlight: the even-odd path that dims the viewport around one
// rounded hole, the hole a target gets (padding, radius, clipping by the boxes that scroll it),
// and the interpolation between two holes while the spotlight moves to the next step. No DOM
// reads: the state measures and hands the numbers in.

/** A box in viewport coordinates, in px. */
export interface TourRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** The hole the backdrop leaves around a target: its box and its corner radius, in px. */
export interface TourSpotlight extends TourRect {
	radius: number;
}

/** The radius a square target gets under `radius: 'auto'`: the `md` radius token. */
export const TOUR_AUTO_RADIUS = 8;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The intersection of `rect` with every box in `clips` (the viewport and the scrolling ancestors
 * of the target), or `null` when nothing of it is left: a target scrolled out of its list shows
 * no hole rather than one over the list's neighbours.
 */
export function clipRect(rect: TourRect, clips: readonly TourRect[]): TourRect | null {
	let left = rect.x;
	let top = rect.y;
	let right = rect.x + rect.width;
	let bottom = rect.y + rect.height;
	for (const clip of clips) {
		left = Math.max(left, clip.x);
		top = Math.max(top, clip.y);
		right = Math.min(right, clip.x + clip.width);
		bottom = Math.min(bottom, clip.y + clip.height);
	}
	if (right <= left || bottom <= top) return null;
	return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * The radius of the hole: a number is used as given; `'auto'` follows the target's own corner
 * radius, grown by `padding` so the hole stays concentric with it, and a square target gets the
 * `md` radius. Never more than half the hole's shorter side.
 */
export function resolveSpotlightRadius(
	radius: number | 'auto',
	targetRadius: number,
	padding: number,
	size: { width: number; height: number }
): number {
	const wanted =
		radius === 'auto'
			? targetRadius > 0
				? targetRadius + Math.max(0, padding)
				: TOUR_AUTO_RADIUS
			: radius;
	return Math.max(0, Math.min(wanted, size.width / 2, size.height / 2));
}

/**
 * The hole for a target box: grown by `padding` on every side, then clipped by `clips`. `null`
 * when the target is entirely clipped away.
 */
export function spotlightFor(
	target: TourRect,
	{
		padding,
		radius,
		targetRadius,
		clips
	}: { padding: number; radius: number | 'auto'; targetRadius: number; clips: readonly TourRect[] }
): TourSpotlight | null {
	const grown = {
		x: target.x - padding,
		y: target.y - padding,
		width: target.width + padding * 2,
		height: target.height + padding * 2
	};
	const clipped = clipRect(grown, clips);
	if (!clipped) return null;
	return {
		...clipped,
		radius: resolveSpotlightRadius(radius, targetRadius, padding, clipped)
	};
}

/** The rounded rectangle `spotlight` as a closed sub-path, drawn clockwise. */
export function roundedRectPath({ x, y, width, height, radius }: TourSpotlight): string {
	const r = Math.max(0, Math.min(radius, width / 2, height / 2));
	const right = x + width;
	const bottom = y + height;
	if (r === 0) {
		return `M${round(x)} ${round(y)}H${round(right)}V${round(bottom)}H${round(x)}Z`;
	}
	const arc = (toX: number, toY: number) =>
		`A${round(r)} ${round(r)} 0 0 1 ${round(toX)} ${round(toY)}`;
	return [
		`M${round(x + r)} ${round(y)}`,
		`H${round(right - r)}`,
		arc(right, y + r),
		`V${round(bottom - r)}`,
		arc(right - r, bottom),
		`H${round(x + r)}`,
		arc(x, bottom - r),
		`V${round(y + r)}`,
		arc(x + r, y),
		'Z'
	].join('');
}

/**
 * The backdrop path: the whole viewport, with the spotlight cut out of it under
 * `fill-rule="evenodd"`. Without a spotlight (a centred step, a target scrolled away) it is the
 * viewport alone.
 */
export function spotlightPath(
	viewport: { width: number; height: number },
	spotlight: TourSpotlight | null
): string {
	const outer = `M0 0H${round(viewport.width)}V${round(viewport.height)}H0Z`;
	if (!spotlight || spotlight.width <= 0 || spotlight.height <= 0) return outer;
	return `${outer}${roundedRectPath(spotlight)}`;
}

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

/**
 * The spotlight `progress` of the way (0 → 1, already eased) from `from` to `to`. A hole that
 * appears or disappears grows from, or shrinks to, the centre of the other one.
 */
export function interpolateSpotlight(
	from: TourSpotlight | null,
	to: TourSpotlight | null,
	progress: number
): TourSpotlight | null {
	if (progress >= 1) return to;
	if (!from && !to) return null;
	const collapse = (spotlight: TourSpotlight): TourSpotlight => ({
		x: spotlight.x + spotlight.width / 2,
		y: spotlight.y + spotlight.height / 2,
		width: 0,
		height: 0,
		radius: 0
	});
	const start = from ?? collapse(to!);
	const end = to ?? collapse(from!);
	return {
		x: lerp(start.x, end.x, progress),
		y: lerp(start.y, end.y, progress),
		width: lerp(start.width, end.width, progress),
		height: lerp(start.height, end.height, progress),
		radius: lerp(start.radius, end.radius, progress)
	};
}

/** Whether two spotlights cover the same box to within half a pixel. */
export function sameSpotlight(a: TourSpotlight | null, b: TourSpotlight | null): boolean {
	if (!a || !b) return a === b;
	return (
		Math.abs(a.x - b.x) < 0.5 &&
		Math.abs(a.y - b.y) < 0.5 &&
		Math.abs(a.width - b.width) < 0.5 &&
		Math.abs(a.height - b.height) < 0.5 &&
		Math.abs(a.radius - b.radius) < 0.5
	);
}
