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
		expect(getNumberSymbols('en-US', { style: 'currency', currency: 'EUR' }).currencies).toEqual([
			'€'
		]);
	});

	test('symbols hold every plural form of unit labels and currency names', () => {
		const days = getNumberSymbols('en', { style: 'unit', unit: 'day', unitDisplay: 'long' });
		expect(days.units).toEqual(expect.arrayContaining(['day', 'days']));
		const dollars = getNumberSymbols('en', {
			style: 'currency',
			currency: 'USD',
			currencyDisplay: 'name',
			maximumFractionDigits: 0
		});
		expect(dollars.currencies).toEqual(expect.arrayContaining(['US dollar', 'US dollars']));
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

	test('reads back its own formatting in every plural form of a unit or currency name', () => {
		const cases: [Intl.LocalesArgument, Intl.NumberFormatOptions, number[]][] = [
			['en', { style: 'unit', unit: 'kilometer-per-hour', unitDisplay: 'long' }, [1, 1.5, 2]],
			['en', { style: 'unit', unit: 'liter', unitDisplay: 'long' }, [1, 1.5, 12]],
			['en', { style: 'unit', unit: 'day' }, [1, 5]],
			['fr', { style: 'unit', unit: 'liter', unitDisplay: 'long' }, [1, 1.5, 2]],
			['ru', { style: 'unit', unit: 'kilogram', unitDisplay: 'long' }, [1, 3, 5, 21]],
			['ar', { style: 'unit', unit: 'day', unitDisplay: 'long' }, [1, 2, 5, 11, 100]],
			[
				'en',
				{ style: 'currency', currency: 'USD', currencyDisplay: 'name', maximumFractionDigits: 0 },
				[1, 2]
			],
			['fr', { style: 'currency', currency: 'USD', currencyDisplay: 'name' }, [1, 1.5, 2]],
			['ar', { style: 'currency', currency: 'EGP', currencyDisplay: 'name' }, [1, 2, 5, 11]]
		];
		for (const [locale, options, values] of cases) {
			for (const value of values) {
				const text = formatNumber(value, locale, options);
				expect(parseNumber(text, locale, options), `${String(locale)} ${text}`).toBe(value);
				expect(isNumberText(text, locale, options), `${String(locale)} ${text}`).toBe(true);
			}
		}
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
		// Every space separator where the locale groups with a space, both apostrophes in de-CH.
		for (const space of [' ', '\u00a0', '\u2009', '\u202f']) expect(fr.has(space)).toBe(true);
		expect(getNumberCharacters('en-US').has('\u00a0')).toBe(false);
		const swiss = getNumberCharacters('de-CH');
		expect(swiss.has("'")).toBe(true);
		expect(swiss.has('\u2019')).toBe(true);
		expect(getNumberCharacters('en-US').has('%')).toBe(false);
		expect(getNumberCharacters('en-US', { style: 'percent' }).has('٪')).toBe(true);
	});

	test('isNumberText accepts partial entries, digits of any system and bidi marks', () => {
		expect(isNumberText('-1 234,', 'fr')).toBe(true);
		expect(isNumberText('\u200e١٢٣٫', 'ar')).toBe(true);
		expect(isNumberText('12a', 'en-US')).toBe(false);
		expect(isNumberText('-5', 'en-US', undefined, { allowNegative: false })).toBe(false);
	});

	test('isNumberText accepts every text the parser reads back from the formatter', () => {
		const accounting = { style: 'currency', currency: 'USD', currencySign: 'accounting' } as const;
		expect(formatNumber(-5, 'en-US', accounting)).toBe('($5.00)');
		expect(isNumberText('($5.00)', 'en-US', accounting)).toBe(true);
		expect(isNumberText('($5.00)', 'en-US', accounting, { allowNegative: false })).toBe(false);
		// A no-break space as Excel or Word paste it, or Option+Space types it on macOS.
		expect(isNumberText('1\u00a0234,5', 'fr')).toBe(true);
		expect(isNumberText('1\u2019234.5', 'de-CH')).toBe(true);
		expect(isNumberText("1'234.5", 'de-CH')).toBe(true);
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
		expect(roundToFormat(12345, { notation: 'scientific', maximumFractionDigits: 2 })).toBe(12300);
		expect(roundToFormat(-0.001, { maximumFractionDigits: 2 })).toBe(0);
		expect(Object.is(roundToFormat(-0.001, { maximumFractionDigits: 2 }), 0)).toBe(true);
	});

	test('rounds unit and currency formats whatever plural form the label takes', () => {
		const liters = {
			style: 'unit',
			unit: 'liter',
			unitDisplay: 'long',
			maximumFractionDigits: 2
		} as const;
		expect(roundToFormat(1.004, liters)).toBe(1);
		expect(roundToFormat(2.004, liters)).toBe(2);
		const dollars = {
			style: 'currency',
			currency: 'USD',
			currencyDisplay: 'name',
			maximumFractionDigits: 0
		} as const;
		expect(roundToFormat(0.96, dollars)).toBe(1);
		expect(roundToFormat(12.5, { style: 'unit', unit: 'percent', maximumFractionDigits: 0 })).toBe(
			13
		);
	});

	test('cleans floating-point noise only', () => {
		expect(cleanFloatingPoint(0.1 + 0.2)).toBe(0.3);
		expect(cleanFloatingPoint(0.7 + 0.1)).toBe(0.8);
		expect(cleanFloatingPoint(1.0000000001)).toBe(1.0000000001);
	});
});
