import { describe, expect, test } from 'vitest';
import {
	sparklineAreaPath,
	sparklineBars,
	sparklineBaseline,
	sparklineDomain,
	sparklineDotPath,
	sparklineLinePath,
	sparklineMarkerIndex,
	sparklineNearestIndex,
	sparklineTrend,
	sparklineTrendPlacement,
	sparklineXs,
	sparklineYs
} from './sparkline.geometry.js';

describe('the scale', () => {
	test('follows the data, and reaches zero for bars', () => {
		expect(sparklineDomain([3, 8, 5], 'line')).toEqual([3, 8]);
		expect(sparklineDomain([3, 8, 5], 'bar')).toEqual([0, 8]);
		expect(sparklineDomain([-3, -8], 'bar')).toEqual([-8, 0]);
	});

	test('min and max fix either end', () => {
		expect(sparklineDomain([3, 8], 'line', 0)).toEqual([0, 8]);
		expect(sparklineDomain([3, 8], 'line', undefined, 10)).toEqual([3, 10]);
		expect(sparklineDomain([3, 8], 'bar', 2, 10)).toEqual([2, 10]);
	});

	test('an empty series has a scale of nothing', () => {
		expect(sparklineDomain([], 'line')).toEqual([0, 0]);
		expect(sparklineDomain([Number.NaN], 'line')).toEqual([0, 0]);
	});
});

describe('where values sit', () => {
	test('from the top of the box for the highest to its bottom for the lowest', () => {
		expect(sparklineYs([0, 5, 10], [0, 10])).toEqual([100, 50, 0]);
	});

	test('a flat series sits in the middle, and a value off a fixed scale at its edge', () => {
		expect(sparklineYs([4, 4], [4, 4])).toEqual([50, 50]);
		expect(sparklineYs([-5, 15], [0, 10])).toEqual([100, 0]);
	});

	test('zero sits on the scale, or at the edge nearest to it', () => {
		expect(sparklineBaseline([-2, 4])).toBeCloseTo(66.667, 3);
		expect(sparklineBaseline([3, 8])).toBe(100);
		expect(sparklineBaseline([-8, -3])).toBe(0);
	});

	test('across the box: edge to edge for a line, in the middle of each slot for bars', () => {
		expect(sparklineXs(3, 'line')).toEqual([0, 50, 100]);
		expect(sparklineXs(1, 'dot')).toEqual([50]);
		expect(sparklineXs(4, 'bar')).toEqual([12.5, 37.5, 62.5, 87.5]);
	});
});

describe('the paths', () => {
	test('a straight line and a curve that never overshoots', () => {
		expect(sparklineLinePath([0, 50, 100], [100, 0, 50], false)).toBe('M0,100 L50,0 L100,50');
		// Two values: the curve is the straight line between them.
		expect(sparklineLinePath([0, 100], [100, 0], true)).toBe(
			'M0,100 C33.333,66.667 66.667,33.333 100,0'
		);
		// A peak is level at its top, and the curve stays between the values it joins.
		const peak = sparklineLinePath([0, 50, 100], [100, 0, 100], true);
		expect(peak).toBe('M0,100 C16.667,50 33.333,0 50,0 C66.667,0 83.333,50 100,100');
		const ys = [...peak.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((match) => Number(match[1]));
		expect(Math.min(...ys)).toBe(0);
		expect(Math.max(...ys)).toBe(100);
	});

	test('one value is a level stroke across the box', () => {
		expect(sparklineLinePath([50], [30], false)).toBe('M0,30 L100,30');
	});

	test('the area closes along the bottom of the box', () => {
		expect(sparklineAreaPath([0, 100], [100, 0], false)).toBe('M0,100 L100,0 L100,100 L0,100 Z');
	});

	test('reach carries the area past the box, to the edges of the root', () => {
		expect(sparklineAreaPath([0, 100], [100, 0], false, { x: 2, y: 4 })).toBe(
			'M-2,100 L0,100 L100,0 L102,0 L102,104 L-2,104 Z'
		);
	});

	test('a dot is a stroke of no length on each value it marks', () => {
		expect(sparklineDotPath([0, 100 / 3, 100], [10, 20, 30], [1, 2])).toBe(
			'M33.333,20 h0 M100,30 h0'
		);
	});

	test('bars stand on zero, and leave the gap between them', () => {
		const [up, down] = sparklineBars([0, 100], 50, 0.2);
		expect(up).toEqual({ x: 5, y: 0, width: 40, height: 50 });
		expect(down).toEqual({ x: 55, y: 50, width: 40, height: 50 });
	});

	test('reach carries bars past the edge of the box they stand on, and only that edge', () => {
		expect(sparklineBars([60, 100], 100, 0, 3)).toEqual([
			{ x: 0, y: 60, width: 50, height: 43 },
			{ x: 50, y: 100, width: 50, height: 0 }
		]);
		expect(sparklineBars([40], 0, 0, 3)).toEqual([{ x: 0, y: -3, width: 100, height: 43 }]);
		expect(sparklineBars([0, 100], 50, 0, 3)[0]).toEqual({ x: 0, y: 0, width: 50, height: 50 });
	});
});

describe('reading the series', () => {
	test('markers name the lowest, the highest, the first and the last value', () => {
		const data = [3, 1, 8, 1, 8, 5];
		expect(sparklineMarkerIndex(data, 'min')).toBe(1);
		expect(sparklineMarkerIndex(data, 'max')).toBe(2);
		expect(sparklineMarkerIndex(data, 'first')).toBe(0);
		expect(sparklineMarkerIndex(data, 'last')).toBe(5);
		expect(sparklineMarkerIndex([], 'last')).toBe(-1);
	});

	test('the trend ignores a change under a twentieth of the range', () => {
		expect(sparklineTrend([1, 5, 3, 6])).toBe('up');
		expect(sparklineTrend([6, 5, 3, 1])).toBe('down');
		expect(sparklineTrend([10, 0, 10.2])).toBe('neutral');
		expect(sparklineTrend([4])).toBe('neutral');
	});

	test('the trend arrow goes on the side the line does not come from, when it has room', () => {
		// Rising to the middle: over the value, away from the line under it.
		expect(sparklineTrendPlacement([90, 50], 'line', 100)).toEqual({
			placement: 'above',
			y: 50,
			crowded: false
		});
		// Falling to the middle: under it.
		expect(sparklineTrendPlacement([10, 50], 'area', 100)?.placement).toBe('below');
		// Rising to the top: no room over it, so under it, kept further from the line.
		expect(sparklineTrendPlacement([90, 5], 'line', 100)).toEqual({
			placement: 'below',
			y: 5,
			crowded: true
		});
		// Level: on the side with more room.
		expect(sparklineTrendPlacement([80, 80], 'line', 100)?.placement).toBe('above');
		// A bar: always over its top.
		expect(sparklineTrendPlacement([10, 0], 'bar', 100)).toEqual({
			placement: 'above',
			y: 0,
			crowded: false
		});
		expect(sparklineTrendPlacement([], 'line', 100)).toBeNull();
	});

	test('the pointer reads the nearest value, or the bar it is over', () => {
		expect(sparklineNearestIndex(0.3, 3, 'line')).toBe(1);
		expect(sparklineNearestIndex(0.2, 3, 'line')).toBe(0);
		expect(sparklineNearestIndex(0.3, 4, 'bar')).toBe(1);
		expect(sparklineNearestIndex(1, 4, 'bar')).toBe(3);
		expect(sparklineNearestIndex(-1, 4, 'line')).toBe(0);
		expect(sparklineNearestIndex(0.5, 0, 'line')).toBe(-1);
	});
});
