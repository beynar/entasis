// The field each shape draws: where the band is at a progress, and the part it has passed, which the
// change shows through. The band enters from outside the element and leaves past its far side.
import { describe, expect, test } from 'vitest';
import { shapeGeometry } from './glimm.shapes.js';

const box = { width: 200, height: 100 };

describe('ring', () => {
	const ring = shapeGeometry('ring', 'ltr', 11, box, [50, 50]);

	test('grows from its origin to the farthest corner', () => {
		expect(ring.clip(0)).toBe('circle(0px at 50px 50px)');
		// From (50, 50), the farthest corner is (200, 100): about 158px away.
		expect(ring.clip(1)).toMatch(/^circle\(158\.\d+px at 50px 50px\)$/);
		expect(ring.position(0)).toBeLessThan(0);
		expect(ring.position(1)).toBeGreaterThan(1);
	});

	test('its curtain is a radial mask at the same radius', () => {
		expect(ring.mask(0.5, true)).toMatch(/^radial-gradient\(circle at 50px 50px, #000 /);
	});
});

describe('glint', () => {
	test('cuts a triangle from its corner, then a pentagon past the middle', () => {
		const glint = shapeGeometry('glint', 'ltr', 22, box, [0, 0]);
		expect(glint.clip(0.25)).toBe('polygon(0% 0%, 50% 0%, 50% 0%, 0% 50%, 0% 50%)');
		expect(glint.clip(0.75)).toBe('polygon(0% 0%, 100% 0%, 100% 50%, 50% 100%, 0% 100%)');
	});

	test('starts from the top-right corner right to left', () => {
		const glint = shapeGeometry('glint', 'rtl', 22, box, [0, 0]);
		expect(glint.clip(0.25)).toBe('polygon(100% 0%, 50% 0%, 50% 0%, 100% 50%, 100% 50%)');
		expect(glint.mask(0.5, true)).toMatch(/^linear-gradient\(to bottom left/);
	});
});

describe('split', () => {
	test('opens from the middle towards both sides', () => {
		const split = shapeGeometry('split', 'ltr', 14, box, [0, 0]);
		expect(split.clip(0.5)).toBe('inset(0% 25% 0% 25%)');
		expect(split.clip(1)).toBe('inset(0% 0% 0% 0%)');
		expect(shapeGeometry('split', 'btt', 14, box, [0, 0]).clip(0.5)).toBe('inset(25% 0% 25% 0%)');
	});
});

describe('lines', () => {
	test('a line reveals from the side it leaves', () => {
		expect(shapeGeometry('line', 'ltr', 16, box, [0, 0]).clip(0.25)).toBe('inset(0% 75% 0% 0%)');
		expect(shapeGeometry('line', 'btt', 16, box, [0, 0]).clip(0.25)).toBe('inset(75% 0% 0% 0%)');
	});

	test('a double band reveals from both sides towards the middle', () => {
		const double = shapeGeometry('double', 'ltr', 9, box, [0, 0]);
		expect(double.clip(0.25)).toBe(
			'polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%, 75% 100%, 75% 0%, 0% 0%)'
		);
		// Past the middle, the two strips meet and cover the element.
		expect(double.clip(double.position(1))).toContain('50% 0%');
		expect(double.position(1)).toBeGreaterThan(0.5);
		// Top and bottom when the direction is vertical.
		expect(shapeGeometry('double', 'ttb', 9, box, [0, 0]).clip(0.25)).toMatch(
			/^polygon\(0% 0%, 0% 25%/
		);
	});
});
