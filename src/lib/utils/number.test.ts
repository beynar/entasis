import { describe, expect, test } from 'vitest';
import {
	cleanFloatingPoint,
	formatNumber,
	getNumberCharacters,
	getNumberFormatter,
	getNumberSymbols,
	hasRoundingOptions,
	isDigitCharacter,
	isNumberText,
	normalizeDigits,
	parseNumber,
	roundToFormat,
	stripBidiMarks
} from './number.js';

describe('normalizeDigits', () => {
	test('reads Arabic-Indic, Persian, full-width and Han digits as ASCII', () => {
		expect(normalizeDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
		expect(normalizeDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
		expect(normalizeDigits('１２３')).toBe('123');
		expect(normalizeDigits('二〇二六')).toBe('2026');
		expect(normalizeDigits('零七')).toBe('07');
		expect(normalizeDigits('१२३ ১২৩ ๑๒๓')).toBe('123 123 123');
	});

	test('leaves other characters alone', () => {
		expect(normalizeDigits('a-1,5 十')).toBe('a-1,5 十');
	});

	test('isDigitCharacter accepts one digit of any supported system', () => {
		expect(['7', '٧', '۷', '７', '七'].every(isDigitCharacter)).toBe(true);
		expect(['a', '.', '十', '77'].some(isDigitCharacter)).toBe(false);
	});
});

describe('stripBidiMarks', () => {
	test('removes direction marks and isolates', () => {
		expect(stripBidiMarks('\u200e-\u200f12\u061c%\u2066x\u2069')).toBe('-12%x');
	});
});

describe('formatNumber', () => {
	test('formats by locale and caches the formatter per locale and options', () => {
		expect(formatNumber(1234.5, 'en-US')).toBe('1,234.5');
		expect(formatNumber(null, 'en-US')).toBe('');
		expect(getNumberFormatter('de', { style: 'percent' })).toBe(
			getNumberFormatter('de', { style: 'percent' })
		);
		expect(getNumberFormatter('de')).not.toBe(getNumberFormatter('fr'));
	});

	test('symbols keep the locale decimal for integer formats', () => {
		expect(getNumberSymbols('de', { maximumFractionDigits: 0 }).decimal).toBe(',');
		expect(getNumberSymbols('en-US', { style: 'currency', currency: 'EUR' }).currency).toBe('€');
	});
});

describe('parseNumber', () => {
	test('reads each locale separators', () => {
		expect(parseNumber('1,234.5', 'en-US')).toBe(1234.5);
		expect(parseNumber('1.234,5', 'de')).toBe(1234.5);
		expect(parseNumber("1'234.5", 'de-CH')).toBe(1234.5);
		expect(parseNumber('1\u2019234.5', 'de-CH')).toBe(1234.5);
	});

	test('space-grouping locales accept any space, including a typed plain space', () => {
		expect(parseNumber(formatNumber(1234.5, 'fr'), 'fr')).toBe(1234.5);
		expect(parseNumber('1 234,5', 'fr')).toBe(1234.5);
		expect(parseNumber('1\u00a0234,5', 'fr')).toBe(1234.5);
		// A period still reads as the decimal point where it is not the group separator.
		expect(parseNumber('1.5', 'fr')).toBe(1.5);
	});

	test('reads Arabic, Persian, full-width and Han digits', () => {
		expect(parseNumber('١٢٣٫٤٥', 'ar')).toBe(123.45);
		expect(parseNumber('١٬٢٣٤٫٥')).toBe(1234.5);
		expect(parseNumber('۱۲۳٫۴', 'fa')).toBe(123.4);
		expect(parseNumber('１２３．５', 'ja')).toBe(123.5);
		expect(parseNumber('一二三')).toBe(123);
		expect(parseNumber(formatNumber(-1234.5, 'ar'), 'ar')).toBe(-1234.5);
		expect(parseNumber(formatNumber(-1234.5, 'fa'), 'fa')).toBe(-1234.5);
	});

	test('strips bidi marks and reads every minus sign', () => {
		expect(parseNumber('\u200e-5', 'ar')).toBe(-5);
		expect(parseNumber('−5')).toBe(-5);
		expect(parseNumber('－5')).toBe(-5);
		expect(parseNumber('5-')).toBe(-5);
		expect(parseNumber('+5')).toBe(5);
	});

	test('ignores currency and units and reads accounting negatives', () => {
		const brl = { style: 'currency', currency: 'BRL' } as const;
		expect(parseNumber('R$ 1.234,56', 'pt-BR', brl)).toBe(1234.56);
		expect(parseNumber(formatNumber(-1234.56, 'pt-BR', brl), 'pt-BR', brl)).toBe(-1234.56);
		const accounting = { style: 'currency', currency: 'USD', currencySign: 'accounting' } as const;
		expect(parseNumber('($1,234.50)', 'en-US', accounting)).toBe(-1234.5);
		const speed = { style: 'unit', unit: 'kilometer-per-hour' } as const;
		expect(parseNumber('50 km/h', 'en-US', speed)).toBe(50);
	});

	test('divides percent and per-mille text', () => {
		expect(parseNumber('12%', 'en-US')).toBe(0.12);
		expect(parseNumber('12', 'en-US', { style: 'percent' })).toBe(0.12);
		expect(parseNumber(formatNumber(0.5, 'fr', { style: 'percent' }), 'fr')).toBe(0.5);
		expect(parseNumber('5\u2030', 'en-US')).toBe(0.005);
		expect(parseNumber('12%', 'en-US', { style: 'unit', unit: 'percent' })).toBe(12);
	});

	test('reads exponents', () => {
		expect(parseNumber('1.5E3', 'en-US', { notation: 'scientific' })).toBe(1500);
		expect(parseNumber('2e-3')).toBe(0.002);
	});

	test('returns null for partial or invalid text', () => {
		for (const text of ['', ' ', '-', '1e', '.', 'abc', '1a', '--5', 'Infinity', '∞', null]) {
			expect(parseNumber(text, 'en-US')).toBeNull();
		}
	});

	test('keeps the last point as the decimal point in mixed input', () => {
		expect(parseNumber('1.234.5', 'en-US')).toBe(1234.5);
		expect(parseNumber('1.', 'en-US')).toBe(1);
		expect(parseNumber('.5', 'en-US')).toBe(0.5);
	});

	test('never returns negative zero', () => {
		expect(Object.is(parseNumber('-0'), 0)).toBe(true);
	});
});

describe('allowed characters', () => {
	test('come from formatToParts per character', () => {
		const fr = getNumberCharacters('fr');
		expect(fr.has(',')).toBe(true);
		expect(fr.has(' ')).toBe(true);
		expect(fr.has('\u202f')).toBe(true);
		expect(fr.has('-')).toBe(true);
		expect(fr.has('a')).toBe(false);

		const brl = getNumberCharacters('pt-BR', { style: 'currency', currency: 'BRL' });
		expect(brl.has('R')).toBe(true);
		expect(brl.has('$')).toBe(true);

		expect(getNumberCharacters('en-US', undefined, { allowNegative: false }).has('-')).toBe(false);
		expect(getNumberCharacters('en-US').has('%')).toBe(false);
		expect(getNumberCharacters('en-US', { style: 'percent' }).has('٪')).toBe(true);
	});

	test('isNumberText accepts partial entries, digits of any system and bidi marks', () => {
		expect(isNumberText('-1 234,', 'fr')).toBe(true);
		expect(isNumberText('\u200e١٢٣٫', 'ar')).toBe(true);
		expect(isNumberText('12a', 'en-US')).toBe(false);
		expect(isNumberText('-5', 'en-US', undefined, { allowNegative: false })).toBe(false);
	});
});

describe('commit rounding', () => {
	test('keeps full precision without rounding options', () => {
		expect(hasRoundingOptions({ style: 'percent' })).toBe(false);
		expect(roundToFormat(1.23456789)).toBe(1.23456789);
		expect(roundToFormat(1.23456789, { style: 'currency', currency: 'USD' })).toBe(1.23456789);
	});

	test('rounds as Intl displays the value', () => {
		expect(roundToFormat(1.236, { maximumFractionDigits: 2 })).toBe(1.24);
		expect(roundToFormat(1234.5678, { maximumSignificantDigits: 3 })).toBe(1230);
		expect(roundToFormat(0.12345, { style: 'percent', maximumFractionDigits: 1 })).toBe(0.123);
		expect(
			roundToFormat(-1.005, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
		).toBe(-1.01);
	});

	test('cleans floating-point noise only', () => {
		expect(cleanFloatingPoint(0.1 + 0.2)).toBe(0.3);
		expect(cleanFloatingPoint(0.7 + 0.1)).toBe(0.8);
		expect(cleanFloatingPoint(1.0000000001)).toBe(1.0000000001);
	});
});
