import { describe, expect, it } from 'vitest';
import { rubberBand } from './rubberBand.js';

describe('rubberBand', () => {
	it('follows less and less the further it is pulled, never past its extent', () => {
		const near = rubberBand(20, 48);
		const far = rubberBand(200, 48);
		const farther = rubberBand(2000, 48);
		expect(near).toBeGreaterThan(0);
		expect(near).toBeLessThan(20);
		expect(far - near).toBeLessThan(200 - 20);
		expect(farther).toBeGreaterThan(far);
		expect(farther).toBeLessThan(48);
	});

	it('keeps the sign of the pull and rests at zero', () => {
		expect(rubberBand(-60, 48)).toBe(-rubberBand(60, 48));
		expect(rubberBand(0, 48)).toBe(0);
		expect(rubberBand(60, 0)).toBe(0);
	});
});
