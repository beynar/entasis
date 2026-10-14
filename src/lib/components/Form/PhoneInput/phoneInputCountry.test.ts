import { describe, expect, test } from 'vitest';
import {
	createPhoneCountryOptions,
	filterPhoneCountryOptions,
	getPhoneCountryOption
} from './phoneInputCountry.js';

const raw = [
	{ iso2: 'de', dialCode: '49' },
	{ iso2: 'fr', dialCode: '33' },
	{ iso2: 'ci', dialCode: '225' },
	{ iso2: 'es', dialCode: '34' }
];

describe('createPhoneCountryOptions', () => {
	test('names follow the locale and are sorted in its alphabet', () => {
		expect(createPhoneCountryOptions(raw, 'en').map((country) => country.name)).toEqual([
			'Côte d’Ivoire',
			'France',
			'Germany',
			'Spain'
		]);
		expect(createPhoneCountryOptions(raw, 'fr').map((country) => country.name)).toEqual([
			'Allemagne',
			'Côte d’Ivoire',
			'Espagne',
			'France'
		]);
		expect(createPhoneCountryOptions(raw, 'de').map((country) => country.name)).toContain(
			'Deutschland'
		);
	});

	test('falls back to the ISO code when the locale is not valid', () => {
		expect(createPhoneCountryOptions(raw, 'not a locale').length).toBe(4);
	});
});

describe('filterPhoneCountryOptions', () => {
	const fr = createPhoneCountryOptions(raw, 'fr');

	test('matches names ignoring case and accents', () => {
		expect(filterPhoneCountryOptions(fr, 'COTE', 'fr').map((c) => c.iso2)).toEqual(['ci']);
		expect(filterPhoneCountryOptions(fr, 'ESPAGNE', 'fr').map((c) => c.iso2)).toEqual(['es']);
	});

	test('matches the ISO code and the dial code, with or without the plus', () => {
		expect(filterPhoneCountryOptions(fr, '+33', 'fr').map((c) => c.iso2)).toEqual(['fr']);
		expect(filterPhoneCountryOptions(fr, '225', 'fr').map((c) => c.iso2)).toEqual(['ci']);
		expect(filterPhoneCountryOptions(fr, 'de', 'fr').map((c) => c.iso2)).toContain('de');
	});

	test('an empty search lists every country', () => {
		expect(filterPhoneCountryOptions(fr, '  ', 'fr')).toBe(fr);
	});
});

describe('getPhoneCountryOption', () => {
	test('looks a country up by ISO code, in any case', () => {
		const options = createPhoneCountryOptions(raw, 'en');
		expect(getPhoneCountryOption(options, 'FR')?.name).toBe('France');
		expect(getPhoneCountryOption(options, null)).toBeNull();
	});
});
