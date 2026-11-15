/**
 * How far something follows a drag past the end of its range: less and less the further it is
 * pulled, never more than `extent`, the way a native scroll view resists past its edge. Signed:
 * a negative distance gives a negative offset.
 */
export const rubberBand = (distance: number, extent: number, resistance = 0.55): number => {
	if (extent <= 0) return 0;
	const magnitude = (1 - 1 / ((Math.abs(distance) * resistance) / extent + 1)) * extent;
	return Math.sign(distance) * magnitude;
};
