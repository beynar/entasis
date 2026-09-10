import type { PhoneCountry } from './phoneInput-cdn.js';

export type PhoneCountryOption = {
	iso2: string;
	name: string;
	dialCode: string;
	flag: string;
	searchText: string;
};

const normalizeSearchText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

const getDisplayNames = () => {
	if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
		return null;
	}

	try {
		return new Intl.DisplayNames('en', { type: 'region' });
	} catch {
		return null;
	}
};

const getCountryName = (iso2: string, displayNames: Intl.DisplayNames | null) =>
	displayNames?.of(iso2.toUpperCase()) || iso2.toUpperCase();

const getCountryFlag = (iso2: string) =>
	iso2.toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));

export const createPhoneCountryOptions = (countries: PhoneCountry[]): PhoneCountryOption[] => {
	const displayNames = getDisplayNames();

	return countries
		.map((country) => {
			const name = getCountryName(country.iso2, displayNames);
			const dialCode = `+${country.dialCode}`;

			return {
				iso2: country.iso2,
				name,
				dialCode: country.dialCode,
				flag: getCountryFlag(country.iso2),
				searchText: normalizeSearchText(`${name} ${country.iso2} ${dialCode}`)
			};
		})
		.sort((firstCountry, secondCountry) => firstCountry.name.localeCompare(secondCountry.name));
};

export const filterPhoneCountryOptions = (countries: PhoneCountryOption[], searchQuery: string) => {
	const normalizedQuery = normalizeSearchText(searchQuery.trim());

	if (!normalizedQuery) {
		return countries;
	}

	return countries.filter((country) => country.searchText.includes(normalizedQuery));
};

export const getPhoneCountryOption = (countries: PhoneCountryOption[], iso2?: string | null) => {
	if (!iso2) {
		return null;
	}

	const normalizedIso2 = iso2.toLowerCase();
	return countries.find((country) => country.iso2 === normalizedIso2) ?? null;
};
