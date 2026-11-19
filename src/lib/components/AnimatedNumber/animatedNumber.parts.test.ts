// How a formatted number is cut into keyed pieces, and how far each digit wheel turns.
import { describe, expect, test } from 'vitest';
import {
	continuousStart,
	digitDelta,
	isRightToLeftLocale,
	resolveTrend,
	toAnimatedNumberParts,
	type AnimatedNumberPart
} from './animatedNumber.parts.js';

const parts = (
	value: number | bigint,
	locale = 'en-US',
	format?: Intl.NumberFormatOptions,
	prefix?: string,
	suffix?: string
) => toAnimatedNumberParts(value, new Intl.NumberFormat(locale, format), prefix, suffix);

const keys = (list: AnimatedNumberPart[]) => list.map((part) => `${part.key}=${part.value}`);

describe('cutting a number into pieces', () => {
	test('integer digits and group separators are counted from the decimal point outwards', () => {
		const number = parts(1234567);

		expect(number.text).toBe('1,234,567');
		expect(keys(number.integer)).toEqual([
			'integer:6=1',
			'group:1=,',
			'integer:5=2',
			'integer:4=3',
			'integer:3=4',
			'group:0=,',
			'integer:2=5',
			'integer:1=6',
			'integer:0=7'
		]);
		expect(number.pre).toEqual([]);
		expect(number.fraction).toEqual([]);
		expect(number.post).toEqual([]);
	});

	test('the units keep their key when the number gains a digit', () => {
		const before = parts(987);
		const after = parts(1987);

		expect(keys(before.integer)).toEqual(['integer:2=9', 'integer:1=8', 'integer:0=7']);
		expect(keys(after.integer).slice(-3)).toEqual(keys(before.integer));
		expect(keys(after.integer).slice(0, 2)).toEqual(['integer:3=1', 'group:0=,']);
	});

	test('a digit knows the power of ten it counts', () => {
		const number = parts(120.45);
		const positions = [...number.integer, ...number.fraction]
			.filter((part) => part.kind === 'digit')
			.map((part) => (part.kind === 'digit' ? [part.value, part.pos] : []));

		expect(positions).toEqual([
			[1, 2],
			[2, 1],
			[0, 0],
			[4, -1],
			[5, -2]
		]);
	});

	test('the decimal point opens the fraction, whose digits are counted from it', () => {
		const number = parts(3.14);

		expect(keys(number.integer)).toEqual(['integer:0=3']);
		expect(keys(number.fraction)).toEqual(['decimal:0=.', 'fraction:0=1', 'fraction:1=4']);
	});

	test('what stands before the number is one run and what follows it another', () => {
		const price = parts(-12.5, 'en-US', { style: 'currency', currency: 'USD' });
		expect(price.text).toBe('-$12.50');
		expect(keys(price.pre)).toEqual(['sign:0=-', 'currency:0=$']);
		expect(price.post).toEqual([]);

		const share = parts(0.25, 'en-US', { style: 'percent' });
		expect(keys(share.post)).toEqual(['percentSign:0=%']);

		const compact = parts(18200, 'en-US', { notation: 'compact' });
		expect(compact.text).toBe('18K');
		expect(keys(compact.post)).toEqual(['compact:0=K']);
	});

	test('a plus sign and a minus sign are the same piece', () => {
		const up = parts(5, 'en-US', { signDisplay: 'always' });
		const down = parts(-5, 'en-US', { signDisplay: 'always' });

		expect(up.pre[0].key).toBe('sign:0');
		expect(down.pre[0].key).toBe('sign:0');
		expect(up.pre[0].value).not.toBe(down.pre[0].value);
	});

	test('prefix and suffix are pieces of their own, and part of the text', () => {
		const number = parts(42, 'en-US', undefined, '~', ' items');

		expect(number.text).toBe('~42 items');
		expect(keys(number.pre)).toEqual(['prefix:0=~']);
		expect(keys(number.post)).toEqual(['suffix:0= items']);
	});

	test('digits of another numbering system are read as the digits they are', () => {
		const number = parts(1203, 'ar-EG', { useGrouping: false });

		expect(number.glyphs).toEqual(['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']);
		expect(number.integer.map((part) => (part.kind === 'digit' ? part.value : part.value))).toEqual(
			[1, 2, 0, 3]
		);
		expect(number.rtl).toBe(true);
	});

	test('a big integer is cut as a number is', () => {
		const number = parts(12345678901234567890n);

		expect(number.text).toBe('12,345,678,901,234,567,890');
		expect(number.integer.filter((part) => part.kind === 'digit')).toHaveLength(20);
	});

	test('a value that is not a number is a symbol', () => {
		const number = parts(Number.NaN);

		expect(number.text).toBe('NaN');
		expect([...number.pre, ...number.integer, ...number.fraction, ...number.post]).toEqual([
			{ kind: 'symbol', key: 'nan:0', type: 'nan', value: 'NaN' }
		]);
	});

	test('two cuts that draw the same thing have the same signature', () => {
		expect(parts(1234).signature).toBe(parts(1234).signature);
		expect(parts(1234).signature).not.toBe(parts(1235).signature);
		expect(parts(1234).signature).not.toBe(parts(1234, 'de-DE').signature);
		expect(parts(5).signature).not.toBe(parts(5, 'en-US', undefined, '~').signature);
	});
});

describe('reading direction of a locale', () => {
	test('follows the script the locale is written in', () => {
		expect(isRightToLeftLocale('ar')).toBe(true);
		expect(isRightToLeftLocale('he-IL')).toBe(true);
		expect(isRightToLeftLocale('fa')).toBe(true);
		expect(isRightToLeftLocale('en-US')).toBe(false);
		expect(isRightToLeftLocale('ja')).toBe(false);
		expect(isRightToLeftLocale('pa-Arab')).toBe(true);
		expect(isRightToLeftLocale('pa')).toBe(false);
		expect(isRightToLeftLocale('not a locale')).toBe(false);
	});
});

describe('the way digits travel', () => {
	test('auto follows the number', () => {
		expect(resolveTrend('auto', 10, 11)).toBe(1);
		expect(resolveTrend('auto', 10, 9)).toBe(-1);
		expect(resolveTrend('auto', 10, 10)).toBe(0);
		expect(resolveTrend('auto', 10n, 11n)).toBe(1);
	});

	test('up, down and nearest hold whatever the values', () => {
		expect(resolveTrend('up', 10, 9)).toBe(1);
		expect(resolveTrend('down', 10, 11)).toBe(-1);
		expect(resolveTrend('nearest', 10, 11)).toBe(0);
	});

	test('a wheel never turns back under a direction', () => {
		// 19 to 20: the units go from 9 to 0, one step up and not nine down.
		expect(digitDelta(0, 9, 1)).toBe(1);
		// 20 to 19: one step down.
		expect(digitDelta(9, 0, -1)).toBe(-1);
		expect(digitDelta(7, 2, 1)).toBe(5);
		expect(digitDelta(2, 7, 1)).toBe(5);
		expect(digitDelta(2, 7, -1)).toBe(-5);
		expect(digitDelta(7, 2, -1)).toBe(-5);
	});

	test('without a direction each wheel goes straight to its digit', () => {
		expect(digitDelta(0, 9, 0)).toBe(-9);
		expect(digitDelta(9, 0, 0)).toBe(9);
		expect(digitDelta(4, 4, 0)).toBe(0);
	});

	test('a digit that stays the same makes a whole turn only when asked to', () => {
		expect(digitDelta(4, 4, 1)).toBe(0);
		expect(digitDelta(4, 4, 1, true)).toBe(10);
		expect(digitDelta(4, 4, -1, true)).toBe(-10);
	});
});

describe('a continuous change', () => {
	test('starts at the highest position that changed', () => {
		// 120 to 220: the hundreds changed, so the tens and the units turn too.
		expect(continuousStart(parts(120), parts(220))).toBe(2);
		expect(continuousStart(parts(120), parts(121))).toBe(0);
		expect(continuousStart(parts(1.25), parts(1.35))).toBe(-1);
	});

	test('counts a digit that joined or left the number', () => {
		expect(continuousStart(parts(999), parts(1000))).toBe(3);
		expect(continuousStart(parts(1000), parts(999))).toBe(3);
	});

	test('is nothing when no digit changed', () => {
		expect(continuousStart(parts(120), parts(120))).toBeUndefined();
	});
});
