import { describe, expect, test } from 'vitest';
import {
	composeStreetLine,
	countryName,
	formatAddress,
	formatAddressLine,
	isAddressEmpty,
	type Address
} from './address.js';

const paris: Address = {
	line1: '12 Rue de Rivoli',
	line2: '3e étage',
	postalCode: '75004',
	city: 'Paris',
	region: 'Île-de-France',
	countryCode: 'FR'
};

describe('address', () => {
	test('the street number comes first, or after the street where the country writes it so', () => {
		expect(composeStreetLine('12', 'Rue de Rivoli', 'FR')).toBe('12 Rue de Rivoli');
		expect(composeStreetLine('43', 'Friedrichstraße', 'DE')).toBe('Friedrichstraße 43');
		expect(composeStreetLine('1600', 'Amphitheatre Parkway', 'us')).toBe(
			'1600 Amphitheatre Parkway'
		);
		expect(composeStreetLine(null, 'Rue de Rivoli', 'FR')).toBe('Rue de Rivoli');
		expect(composeStreetLine('12', undefined, 'FR')).toBe('12');
		expect(composeStreetLine(null, null)).toBeNull();
	});

	test('most of Europe writes the postal code before the city, and the region on its own line', () => {
		expect(formatAddress(paris, { locale: 'fr' })).toEqual([
			'12 Rue de Rivoli',
			'3e étage',
			'75004 Paris',
			'Île-de-France',
			'France'
		]);
	});

	test('the US, Canada and Australia write "City, REGION POSTAL"', () => {
		expect(
			formatAddress(
				{
					line1: '1600 Amphitheatre Parkway',
					city: 'Mountain View',
					region: 'CA',
					postalCode: '94043',
					countryCode: 'US'
				},
				{ locale: 'en' }
			)
		).toEqual(['1600 Amphitheatre Parkway', 'Mountain View, CA 94043', 'United States']);
	});

	test('the UK puts the city and the postcode on their own lines', () => {
		expect(
			formatAddress(
				{ line1: '10 Downing Street', city: 'London', postalCode: 'SW1A 2AA', countryCode: 'GB' },
				{ locale: 'en' }
			)
		).toEqual(['10 Downing Street', 'London', 'SW1A 2AA', 'United Kingdom']);
	});

	test('fields pick the parts; empty parts and lines are left out', () => {
		expect(formatAddress(paris, { fields: ['city', 'country'], locale: 'en' })).toEqual([
			'Paris',
			'France'
		]);
		expect(formatAddressLine(paris, { fields: ['line1', 'postalCode', 'city'] })).toBe(
			'12 Rue de Rivoli, 75004 Paris'
		);
		expect(formatAddress({ city: 'Lyon' })).toEqual(['Lyon']);
		expect(formatAddress(null)).toEqual([]);
	});

	test('a country name the value carries wins over its code', () => {
		expect(
			formatAddress({ city: 'Paris', country: 'République française', countryCode: 'FR' })
		).toEqual(['Paris', 'République française']);
		expect(countryName('de', 'fr')).toBe('Allemagne');
		expect(countryName('de', 'ja')).toBe('ドイツ');
	});

	test('an address with no readable part is empty, whatever ids it carries', () => {
		expect(isAddressEmpty(null)).toBe(true);
		expect(isAddressEmpty({ placeId: 'x', countryCode: 'FR', line1: ' ' })).toBe(true);
		expect(isAddressEmpty({ city: 'Paris' })).toBe(false);
	});
});
