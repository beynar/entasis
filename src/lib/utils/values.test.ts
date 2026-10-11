import { describe, expect, test } from 'vitest';
import { deepEqual, isEmptyValue, valuesEqual } from './values.js';

describe('isEmptyValue', () => {
	test('null, undefined, an empty string and an array without values are empty', () => {
		expect(isEmptyValue(null)).toBe(true);
		expect(isEmptyValue(undefined)).toBe(true);
		expect(isEmptyValue('')).toBe(true);
		expect(isEmptyValue([])).toBe(true);
		expect(isEmptyValue([null, null])).toBe(true);
	});

	test('zero, false, whitespace and partial ranges hold a value', () => {
		expect(isEmptyValue(0)).toBe(false);
		expect(isEmptyValue(false)).toBe(false);
		expect(isEmptyValue(' ')).toBe(false);
		expect(isEmptyValue([new Date(0), null])).toBe(false);
		expect(isEmptyValue({})).toBe(false);
	});
});

describe('valuesEqual', () => {
	test('empty values are equal whatever their shape', () => {
		expect(valuesEqual(null, '')).toBe(true);
		expect(valuesEqual('', [])).toBe(true);
		expect(valuesEqual(undefined, [null, null])).toBe(true);
		expect(valuesEqual(null, 0)).toBe(false);
		expect(valuesEqual(null, false)).toBe(false);
	});

	test('dates compare by time, arrays by item and plain objects by key', () => {
		expect(valuesEqual(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(true);
		expect(valuesEqual(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
		expect(valuesEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
		expect(valuesEqual(['a', 'b'], ['a', 'b'])).toBe(true);
		expect(valuesEqual(['a', 'b'], ['b', 'a'])).toBe(false);
		expect(
			valuesEqual([{ key: 'env', value: 'prod' }], [{ key: 'env', value: 'prod' }])
		).toBe(true);
		expect(valuesEqual({ amount: 1, currency: 'EUR' }, { amount: 1 })).toBe(false);
		expect(valuesEqual([new Date(0), null], [new Date(0), null])).toBe(true);
	});

	test('files, blobs and class instances compare by identity', () => {
		const file = new Blob(['a']);
		expect(valuesEqual(file, file)).toBe(true);
		expect(valuesEqual(new Blob(['a']), new Blob(['a']))).toBe(false);
		class Point {
			constructor(readonly x: number) {}
		}
		expect(deepEqual(new Point(1), new Point(1))).toBe(false);
		expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
	});
});
