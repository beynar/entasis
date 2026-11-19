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
		// Towards the bottom left: between 180deg (down) and 270deg (left), here as -153.43deg.
		expect(glint.mask(0.5, true)).toMatch(/^linear-gradient\(-153\.43deg, #000 /);
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

describe('arc', () => {
	// A wide button along the bottom: 100 × 20, centred at (100, 90).
	const button = { x: 50, y: 80, width: 100, height: 20 };

	test('starts as the source itself: a stadium around it, flattened along its long side', () => {
		const arc = shapeGeometry('arc', 'ltr', 7, box, [0, 0], button);
		expect(arc.arc).toMatchObject({ center: [100, 90], sideways: false, spine: 40 });
		// Straight top and bottom 80px apart (40 / 1.35 each side), ends 10px tall and 7.41 wide.
		expect(arc.clip(arc.position(0))).toBe(
			"path('M 70.37 80 L 129.63 80 A 7.41 10 0 0 1 129.63 100 L 70.37 100 A 7.41 10 0 0 1 70.37 80 Z')"
		);
	});

	test('opens into a dome that covers every corner by the end', () => {
		const arc = shapeGeometry('arc', 'ltr', 7, box, [0, 0], button);
		const frame = arc.arc!;
		expect(arc.position(1)).toBe(1);
		for (const [x, y] of [
			[0, 0],
			[200, 0],
			[0, 100],
			[200, 100]
		]) {
			expect(Math.hypot((x - 100) * frame.squash, y - 90)).toBeLessThan(frame.scale);
		}
		// Once open it has no straight part: its top is right above the source's centre.
		const [x, y] = arc.point(0.8, 0.75);
		expect(x).toBeCloseTo(100);
		expect(y).toBeCloseTo(90 - 0.8 * frame.scale);
	});

	test('a tall source sends it sideways, and without one it leaves the side the direction starts from', () => {
		const tab = shapeGeometry('arc', 'ltr', 7, box, [0, 0], { x: 0, y: 20, width: 8, height: 60 });
		expect(tab.arc?.sideways).toBe(true);
		expect(tab.clip(tab.position(0))).toMatch(/^path\('M 8 /);
		expect(shapeGeometry('arc', 'btt', 7, box, [0, 0]).arc?.center).toEqual([100, 100]);
		expect(shapeGeometry('arc', 'ltr', 7, box, [0, 0]).arc).toMatchObject({
			center: [0, 50],
			sideways: true
		});
	});

	test('its halo is an ellipse around the front, clear behind and ahead of it', () => {
		const arc = shapeGeometry('arc', 'ltr', 7, box, [0, 0], button);
		expect(arc.halo(0.5, 0.1, 0.2, 0.8)).toMatch(
			/^radial-gradient\(ellipse [\d.]+px [\d.]+px at 100px 90px, transparent 60%, rgba\(0, 0, 0, 0\.8\) 100%, transparent 120%\)$/
		);
	});
});

describe('points on the band', () => {
	test('follow its shape, from where it is', () => {
		expect(shapeGeometry('line', 'ltr', 16, box, [0, 0]).point(0.25, 0.5)).toEqual([50, 50]);
		expect(shapeGeometry('line', 'rtl', 16, box, [0, 0]).point(0.25, 0.5)).toEqual([150, 50]);
		const [x, y] = shapeGeometry('ring', 'ltr', 11, box, [50, 50]).point(0.5, 0);
		expect(y).toBeCloseTo(50);
		expect(x).toBeGreaterThan(50);
		// A glint's points lie on the line u + v = 2 × position from its corner.
		const [gx, gy] = shapeGeometry('glint', 'ltr', 22, box, [0, 0]).point(0.25, 0.5);
		expect(gx / 200 + gy / 100).toBeCloseTo(0.5);
	});
});

describe('the content, not the padding', () => {
	// 200 × 100 with 20px of padding left and right and 10px top and bottom.
	const content = { x: 20, y: 10, width: 160, height: 80 };

	test('a line crosses the content: its cut moves at the pace of the content', () => {
		const line = shapeGeometry('line', 'ltr', 16, box, [0, 0], undefined, content);
		// Halfway across the content is halfway across the element here (symmetric padding)…
		expect(line.clip(0.5)).toBe('inset(0% 50% 0% 0%)');
		// …but a quarter in is 20 + 40 = 60px, 30% of the element.
		expect(line.clip(0.25)).toBe('inset(0% 70% 0% 0%)');
		expect(line.point(0, 0)).toEqual([20, 10]);
		expect(line.area).toEqual(content);
	});

	test('a ring reaches the farthest corner of the content', () => {
		const ring = shapeGeometry('ring', 'ltr', 11, box, [100, 50], undefined, content);
		expect(ring.ringRadius).toBeCloseTo(Math.hypot(80, 40));
	});

	test('cuts that start at the edge of the content reach the edge of the element', () => {
		const split = shapeGeometry('split', 'ltr', 14, box, [0, 0], undefined, content);
		expect(split.clip(1)).toBe('inset(0% 0% 0% 0%)');
		const glint = shapeGeometry('glint', 'ltr', 22, box, [0, 0], undefined, content);
		expect(glint.clip(0.25)).toMatch(/^polygon\(0% 0%, /);
	});
});
