import { describe, expect, test } from 'vitest';
import {
	TOUR_AUTO_RADIUS,
	clipRect,
	interpolateSpotlight,
	resolveSpotlightRadius,
	roundedRectPath,
	sameSpotlight,
	spotlightFor,
	spotlightPath
} from './tour.geometry.js';

const viewport = { width: 800, height: 600 };

describe('spotlightPath', () => {
	test('is the viewport alone without a spotlight', () => {
		expect(spotlightPath(viewport, null)).toBe('M0 0H800V600H0Z');
	});

	test('cuts a square hole as a second sub-path', () => {
		const path = spotlightPath(viewport, { x: 10, y: 20, width: 100, height: 50, radius: 0 });
		expect(path).toBe('M0 0H800V600H0ZM10 20H110V70H10Z');
	});

	test('draws a rounded hole with four arcs', () => {
		const path = roundedRectPath({ x: 10, y: 20, width: 100, height: 50, radius: 8 });
		expect(path).toBe(
			'M18 20H102A8 8 0 0 1 110 28V62A8 8 0 0 1 102 70H18A8 8 0 0 1 10 62V28A8 8 0 0 1 18 20Z'
		);
		expect(path.match(/A/g)).toHaveLength(4);
	});

	test('never rounds more than half the shorter side', () => {
		const path = roundedRectPath({ x: 0, y: 0, width: 40, height: 20, radius: 50 });
		expect(path.startsWith('M10 0H30A10 10')).toBe(true);
	});

	test('ignores an empty hole', () => {
		expect(spotlightPath(viewport, { x: 5, y: 5, width: 0, height: 10, radius: 0 })).toBe(
			'M0 0H800V600H0Z'
		);
	});

	test('rounds coordinates to hundredths', () => {
		const path = spotlightPath(viewport, { x: 1.23456, y: 2, width: 3, height: 4, radius: 0 });
		expect(path).toContain('M1.23 2');
	});
});

describe('clipRect', () => {
	test('intersects every clip', () => {
		expect(
			clipRect({ x: 0, y: 0, width: 100, height: 100 }, [
				{ x: 20, y: -10, width: 200, height: 200 },
				{ x: -10, y: 30, width: 200, height: 40 }
			])
		).toEqual({ x: 20, y: 30, width: 80, height: 40 });
	});

	test('is null when nothing is left', () => {
		expect(
			clipRect({ x: 0, y: 0, width: 10, height: 10 }, [{ x: 20, y: 0, width: 10, height: 10 }])
		).toBeNull();
	});
});

describe('spotlightFor', () => {
	test('grows the target by padding and clips it by the viewport', () => {
		expect(
			spotlightFor(
				{ x: 2, y: 100, width: 50, height: 20 },
				{ padding: 8, radius: 4, targetRadius: 0, clips: [{ x: 0, y: 0, ...viewport }] }
			)
		).toEqual({ x: 0, y: 92, width: 60, height: 36, radius: 4 });
	});

	test('is null for a target scrolled out of its scroller', () => {
		expect(
			spotlightFor(
				{ x: 0, y: 500, width: 50, height: 20 },
				{
					padding: 4,
					radius: 'auto',
					targetRadius: 0,
					clips: [
						{ x: 0, y: 0, width: 300, height: 200 },
						{ x: 0, y: 0, ...viewport }
					]
				}
			)
		).toBeNull();
	});
});

describe('resolveSpotlightRadius', () => {
	const size = { width: 100, height: 40 };
	test('follows the target radius, grown by padding, under auto', () => {
		expect(resolveSpotlightRadius('auto', 6, 4, size)).toBe(10);
	});
	test('gives a square target the md radius under auto', () => {
		expect(resolveSpotlightRadius('auto', 0, 4, size)).toBe(TOUR_AUTO_RADIUS);
	});
	test('uses a number as given, capped at half the shorter side', () => {
		expect(resolveSpotlightRadius(12, 0, 4, size)).toBe(12);
		expect(resolveSpotlightRadius(99, 0, 4, size)).toBe(20);
	});
});

describe('interpolateSpotlight', () => {
	const a = { x: 0, y: 0, width: 100, height: 100, radius: 0 };
	const b = { x: 100, y: 200, width: 50, height: 20, radius: 10 };

	test('moves every edge and the radius', () => {
		expect(interpolateSpotlight(a, b, 0.5)).toEqual({
			x: 50,
			y: 100,
			width: 75,
			height: 60,
			radius: 5
		});
	});

	test('ends on the destination', () => {
		expect(interpolateSpotlight(a, b, 1)).toBe(b);
	});

	test('grows a new hole from its centre', () => {
		expect(interpolateSpotlight(null, b, 0)).toEqual({
			x: 125,
			y: 210,
			width: 0,
			height: 0,
			radius: 0
		});
	});

	test('shrinks a hole that goes away to its centre', () => {
		expect(interpolateSpotlight(a, null, 0.5)).toEqual({
			x: 25,
			y: 25,
			width: 50,
			height: 50,
			radius: 0
		});
		expect(interpolateSpotlight(a, null, 1)).toBeNull();
	});
});

test('sameSpotlight tolerates half a pixel', () => {
	const a = { x: 0, y: 0, width: 10, height: 10, radius: 2 };
	expect(sameSpotlight(a, { ...a, x: 0.4 })).toBe(true);
	expect(sameSpotlight(a, { ...a, x: 0.6 })).toBe(false);
	expect(sameSpotlight(null, null)).toBe(true);
	expect(sameSpotlight(a, null)).toBe(false);
});
