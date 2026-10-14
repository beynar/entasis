import { describe, expect, test } from 'vitest';
import { resolveSnapPoints, settleSnapIndex, snapPointHeight } from './dialog.snap.js';

const context = { available: 800, viewport: 900, rem: 16 };

describe('snapPointHeight', () => {
	test('a number is a fraction of the available height', () => {
		expect(snapPointHeight(0.5, context)).toBe(400);
		expect(snapPointHeight(1, context)).toBe(800);
	});

	test('lengths: px, rem, em, % of the available height and vh of the viewport', () => {
		expect(snapPointHeight('148px', context)).toBe(148);
		expect(snapPointHeight('148', context)).toBe(148);
		expect(snapPointHeight('20rem', context)).toBe(320);
		expect(snapPointHeight('2.5em', context)).toBe(40);
		expect(snapPointHeight('40%', context)).toBe(320);
		expect(snapPointHeight('50vh', context)).toBe(450);
		expect(snapPointHeight('50dvh', context)).toBe(450);
	});

	test('anything else is not a height', () => {
		expect(snapPointHeight(0, context)).toBeNaN();
		expect(snapPointHeight(1.5, context)).toBeNaN();
		expect(snapPointHeight(-0.2, context)).toBeNaN();
		expect(snapPointHeight('auto', context)).toBeNaN();
		expect(snapPointHeight('10 px', context)).toBe(10);
		expect(snapPointHeight('', context)).toBeNaN();
	});
});

describe('resolveSnapPoints', () => {
	test('sorts from the lowest to the highest and keeps the written point', () => {
		expect(resolveSnapPoints([1, '148px', 0.5], context)).toEqual([
			{ point: '148px', height: 148 },
			{ point: 0.5, height: 400 },
			{ point: 1, height: 800 }
		]);
	});

	test('drops invalid points and duplicates, and clamps to the available room', () => {
		expect(resolveSnapPoints([0.5, 'nope', 400, '50%', '2000px'], context)).toEqual([
			{ point: 0.5, height: 400 },
			{ point: '2000px', height: 800 }
		]);
	});

	test('resolves to nothing until the drawer has room', () => {
		expect(resolveSnapPoints([0.5, 1], { ...context, available: 0 })).toEqual([]);
		expect(resolveSnapPoints(undefined, context)).toEqual([]);
	});
});

describe('settleSnapIndex', () => {
	const heights = [200, 400, 800];

	test('rests at the nearest point to where the drag was released', () => {
		expect(settleSnapIndex(heights, 780, 0, true)).toBe(2);
		expect(settleSnapIndex(heights, 560, 0, true)).toBe(1);
		expect(settleSnapIndex(heights, 610, 0, true)).toBe(2);
		expect(settleSnapIndex(heights, 330, 0, true)).toBe(1);
	});

	test('a flick carries the drawer on to the next point in the direction it was thrown', () => {
		// Thrown down from 700 (just short of the top point): the next point below it.
		expect(settleSnapIndex(heights, 700, 1, true)).toBe(1);
		expect(settleSnapIndex(heights, 790, 0.5, true)).toBe(1);
		// Thrown up from 500: the next point above it, even though 400 is nearer.
		expect(settleSnapIndex(heights, 450, -1, true)).toBe(2);
		expect(settleSnapIndex(heights, 100, -1, true)).toBe(0);
	});

	test('a flick down from the lowest point dismisses, or stays at it when it may not', () => {
		expect(settleSnapIndex(heights, 150, 1, true)).toBe(-1);
		expect(settleSnapIndex(heights, 150, 1, false)).toBe(0);
		expect(settleSnapIndex(heights, 800, -1, true)).toBe(2);
	});

	test('dismisses when released nearer to closed than to the lowest point', () => {
		expect(settleSnapIndex(heights, 80, 0, true)).toBe(-1);
		expect(settleSnapIndex(heights, 80, 0, false)).toBe(0);
	});

	test('a tie keeps the drawer open and as large as possible', () => {
		expect(settleSnapIndex(heights, 100, 0, true)).toBe(0);
		expect(settleSnapIndex(heights, 300, 0, true)).toBe(1);
	});
});
