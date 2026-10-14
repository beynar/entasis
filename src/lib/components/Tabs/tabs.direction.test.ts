import { describe, expect, test } from 'vitest';
import { getActivationDirection } from './tabs.direction.svelte.js';

describe('getActivationDirection', () => {
	test('a horizontal list reports left or right', () => {
		expect(getActivationDirection(0, 2, 'horizontal', 'ltr')).toBe('right');
		expect(getActivationDirection(2, 0, 'horizontal', 'ltr')).toBe('left');
	});

	test('a right-to-left document mirrors left and right', () => {
		expect(getActivationDirection(0, 2, 'horizontal', 'rtl')).toBe('left');
		expect(getActivationDirection(2, 0, 'horizontal', 'rtl')).toBe('right');
	});

	test('a vertical list reports up or down in both directions of writing', () => {
		expect(getActivationDirection(0, 1, 'vertical', 'ltr')).toBe('down');
		expect(getActivationDirection(1, 0, 'vertical', 'rtl')).toBe('up');
	});

	test('no previous tab, no selected tab or no change reports none', () => {
		expect(getActivationDirection(-1, 1, 'horizontal', 'ltr')).toBe('none');
		expect(getActivationDirection(1, -1, 'horizontal', 'ltr')).toBe('none');
		expect(getActivationDirection(1, 1, 'horizontal', 'ltr')).toBe('none');
	});
});
