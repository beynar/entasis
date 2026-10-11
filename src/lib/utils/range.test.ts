import { describe, expect, test } from 'vitest';
import {
	clampRange,
	formatRangeValue,
	rangeAriaAttributes,
	rangeAriaValueText,
	resolveRangeValue,
	toPercent
} from './range.js';

describe('clampRange and toPercent', () => {
	test('clamp into the range', () => {
		expect(clampRange(120)).toBe(100);
		expect(clampRange(-5)).toBe(0);
		expect(clampRange(15, 10, 20)).toBe(15);
		expect(clampRange(Number.NaN, 10, 20)).toBe(10);
		expect(clampRange(15, 20, 10)).toBe(20);
	});

	test('measure the percentage between min and max', () => {
		expect(toPercent(25)).toBe(25);
		expect(toPercent(15, 10, 20)).toBe(50);
		expect(toPercent(30, 10, 20)).toBe(100);
		expect(toPercent(5, 10, 20)).toBe(0);
		expect(toPercent(Number.NaN)).toBe(0);
		expect(toPercent(10, 10, 10)).toBe(100);
		expect(toPercent(9, 10, 10)).toBe(0);
	});
});

describe('resolveRangeValue', () => {
	test('formats the percentage of the range in the locale by default', () => {
		expect(formatRangeValue({ value: 45, locale: 'en-US' })).toBe('45%');
		expect(formatRangeValue({ value: 45, locale: 'fr' })).toBe(
			new Intl.NumberFormat('fr', { style: 'percent' }).format(0.45)
		);
		expect(formatRangeValue({ value: 45, locale: 'fr' })).toMatch(/^45\s%$/u);
		expect(formatRangeValue({ value: 15, min: 10, max: 20, locale: 'en-US' })).toBe('50%');
		expect(formatRangeValue({ value: 120, locale: 'en-US' })).toBe('100%');
	});

	test('formats the clamped value itself with a format', () => {
		const format = { style: 'unit', unit: 'megabyte' } as const;
		expect(formatRangeValue({ value: 750, max: 512, format, locale: 'en-US' })).toBe('512 MB');
		expect(formatRangeValue({ value: 1234.5, max: 2000, format: {}, locale: 'de' })).toBe(
			'1.234,5'
		);
	});

	test('reports status and indeterminate values', () => {
		expect(resolveRangeValue({ value: 100 }).status).toBe('complete');
		expect(resolveRangeValue({ value: 140 }).status).toBe('complete');
		expect(resolveRangeValue({ value: 40 }).status).toBe('progressing');
		expect(resolveRangeValue({ value: null })).toEqual({
			value: null,
			percent: null,
			formatted: '',
			status: 'indeterminate'
		});
		expect(resolveRangeValue({ value: Number.NaN }).status).toBe('indeterminate');
	});
});

describe('ARIA value text and attributes', () => {
	test('value text defaults to the formatted value', () => {
		expect(rangeAriaValueText({ value: 30, locale: 'en-US' })).toBe('30%');
		expect(rangeAriaValueText({ value: null })).toBeUndefined();
		expect(rangeAriaValueText({ value: null, indeterminateText: 'Loading' })).toBe('Loading');
	});

	test('getAriaValueText receives the formatted and the raw value', () => {
		const text = rangeAriaValueText({
			value: 130,
			locale: 'en-US',
			getAriaValueText: (formatted, raw) => `${formatted} of ${raw}`
		});
		expect(text).toBe('100% of 130');
	});

	test('attributes clamp aria-valuenow and drop it while indeterminate', () => {
		expect(rangeAriaAttributes({ value: 130, min: 0, max: 120, locale: 'en-US' })).toEqual({
			'aria-valuemin': 0,
			'aria-valuemax': 120,
			'aria-valuenow': 120,
			'aria-valuetext': '100%'
		});
		expect(rangeAriaAttributes({ value: null })['aria-valuenow']).toBeUndefined();
	});
});
