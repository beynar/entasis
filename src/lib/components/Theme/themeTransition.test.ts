import { describe, expect, test } from 'vitest';
import { resolveThemeTransition } from './themeTransition.js';

describe('theme transition input', () => {
	test('a variation name keeps its own timing', () => {
		expect(resolveThemeTransition('radial-top-right')).toEqual({ type: 'radial-top-right' });
	});

	test('the options form carries a duration and an easing', () => {
		expect(resolveThemeTransition({ type: 'line-left', duration: 300, easing: 'linear' })).toEqual({
			type: 'line-left',
			duration: 300,
			easing: 'linear'
		});
	});

	test('no transition stays an instant change', () => {
		expect(resolveThemeTransition(undefined)).toBeUndefined();
	});
});
