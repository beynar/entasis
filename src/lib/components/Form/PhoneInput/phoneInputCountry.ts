import { createListFilter } from '$lib/utils/listFilter.js';
import type { PhoneCountry } from './phoneInput-cdn.js';

export type PhoneCountryOption = {
	iso2: string;
	name: string;
	dialCode: string;
	flag: string;
};

const getDisplayNames = (locale: string) => {
	if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
		return null;
	}

	try {
		return new Intl.DisplayNames(locale, { type: 'region' });
	} catch {
		return null;
	}
};

const getCollator = (locale: string) => {
	try {
		return new Intl.Collator(locale);
	} catch {
		return new Intl.Collator();
	}
};

const getCountryName = (iso2: string, displayNames: Intl.DisplayNames | null) =>
	displayNames?.of(iso2.toUpperCase()) || iso2.toUpperCase();

const getCountryFlag = (iso2: string) =>
	iso2.toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));

/**
 * The country list with names written in `locale` and sorted by that locale's alphabet.
 */
export const createPhoneCountryOptions = (
	countries: PhoneCountry[],
	locale = 'en'
): PhoneCountryOption[] => {
	const displayNames = getDisplayNames(locale);
	const collator = getCollator(locale);

	return countries
		.map((country) => ({
			iso2: country.iso2,
			name: getCountryName(country.iso2, displayNames),
			dialCode: country.dialCode,
			flag: getCountryFlag(country.iso2)
		}))
		.sort((firstCountry, secondCountry) => collator.compare(firstCountry.name, secondCountry.name));
};

/**
 * The countries whose name, ISO code or dial code (`+33`) contains the search text, ignoring case
 * and accents in `locale`.
 */
export const filterPhoneCountryOptions = (
	countries: PhoneCountryOption[],
	searchQuery: string,
	locale = 'en'
) => {
	const query = searchQuery.trim();

	if (!query) {
		return countries;
	}

	return createListFilter({ locale }).filter(countries, query, {
		text: (country) => [country.name, country.iso2, `+${country.dialCode}`]
	});
};

export const getPhoneCountryOption = (countries: PhoneCountryOption[], iso2?: string | null) => {
	if (!iso2) {
		return null;
	}

	const normalizedIso2 = iso2.toLowerCase();
	return countries.find((country) => country.iso2 === normalizedIso2) ?? null;
};
