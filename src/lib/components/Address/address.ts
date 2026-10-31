/**
 * A postal address as entasis stores, edits and displays it, the order its lines take in each
 * country, and the provider contract an address search plugs into.
 */

/** A part of an address a field can show and edit. */
export type AddressField = 'line1' | 'line2' | 'postalCode' | 'city' | 'region' | 'country';

/** Every address part, in the order a form usually asks for them. */
export const ADDRESS_FIELDS: readonly AddressField[] = [
	'line1',
	'line2',
	'postalCode',
	'city',
	'region',
	'country'
];

export type AddressLocation = { lat: number; lng: number };

/**
 * A postal address. Every part is optional: a field shows and fills the parts it asks for, and
 * a provider fills what it knows.
 */
export type Address = {
	/** Street line: the number and the street, in the country's order ("12 Rue de Rivoli"). */
	line1?: string | null;
	/** Second line: apartment, suite, building, floor. */
	line2?: string | null;
	postalCode?: string | null;
	/** City, town or postal town. */
	city?: string | null;
	/** State, province or region (first administrative level). */
	region?: string | null;
	/** Country name, as the provider or the field wrote it. */
	country?: string | null;
	/** ISO 3166-1 alpha-2 country code ("FR"). It decides the line order. */
	countryCode?: string | null;
	/** Street number alone, when a provider resolved it. Cleared by a manual edit of `line1`. */
	streetNumber?: string | null;
	/** Street name alone, when a provider resolved it. Cleared by a manual edit of `line1`. */
	street?: string | null;
	/** The provider's own one-line address. Cleared by any manual edit. */
	formatted?: string | null;
	/** The provider's place id. Cleared by any manual edit. */
	placeId?: string | null;
	/** Coordinates of the place. Cleared by any manual edit. */
	location?: AddressLocation | null;
};

/** One search suggestion. */
export type AddressSuggestion = {
	/** Provider id passed back to `resolve`. */
	id: string;
	/** Main text: the street line or the place name. */
	label: string;
	/** Secondary text: the city, region and country. */
	description?: string;
};

/** What an address search sends with each call. */
export type AddressProviderRequest = {
	/** Aborted when a newer query replaces this one, or the field is destroyed. */
	signal?: AbortSignal;
	/**
	 * One id per search, from the first keystroke to the chosen suggestion. Providers that bill
	 * by session (Google Places) group the calls under it.
	 */
	session: string;
	/** BCP 47 language the results should be written in: the active I18n locale. */
	language?: string;
	/** ISO 3166-1 alpha-2 codes the search is limited to. */
	countries?: readonly string[];
};

/**
 * An address search: suggestions for typed text, and the full address for a chosen suggestion.
 * `createGooglePlacesProvider` is one; any service can implement it.
 */
export type AddressProvider = {
	search: (query: string, request: AddressProviderRequest) => Promise<AddressSuggestion[]>;
	resolve: (id: string, request: AddressProviderRequest) => Promise<Address | null>;
};

const text = (value: string | null | undefined) => (value ?? '').trim();

/** True when no part a person reads (lines, postal code, city, region, country) is filled. */
export function isAddressEmpty(address: Address | null | undefined): boolean {
	if (!address) return true;
	return ADDRESS_FIELDS.every((field) => text(address[field]) === '');
}

// Countries that write the street number after the street name ("Hauptstraße 12").
const NUMBER_AFTER_STREET = new Set([
	'AR', 'AT', 'BA', 'BE', 'BG', 'BO', 'BR', 'CH', 'CL', 'CO', 'CR', 'CZ', 'DE', 'DK', 'EE', 'ES',
	'FI', 'GR', 'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LV', 'MX', 'NL', 'NO', 'PE', 'PL', 'PT', 'RO',
	'RS', 'SE', 'SI', 'SK', 'TR', 'UY', 'VE'
]); // prettier-ignore

/** The street line for a number and a street, in the order `countryCode` writes them. */
export function composeStreetLine(
	streetNumber: string | null | undefined,
	street: string | null | undefined,
	countryCode?: string | null
): string | null {
	const number = text(streetNumber);
	const name = text(street);
	if (!number || !name) return name || number || null;
	return NUMBER_AFTER_STREET.has((countryCode ?? '').toUpperCase())
		? `${name} ${number}`
		: `${number} ${name}`;
}

// Countries whose locality line reads "City, REGION POSTAL" (North America, Australia).
const CITY_REGION_POSTAL = new Set(['US', 'CA', 'AU', 'PR', 'GU', 'VI', 'AS', 'MP']);
// Countries that put the postal code on its own line after the city (UK and Ireland).
const POSTAL_OWN_LINE = new Set(['GB', 'IE', 'IM', 'JE', 'GG']);

export type FormatAddressOptions = {
	/** Parts to include, in any order. Defaults to every part. */
	fields?: readonly AddressField[];
	/**
	 * Locale the country name is written in when only `countryCode` is set. Defaults to the
	 * runtime's locale.
	 */
	locale?: string;
};

/** The country name for `address`: its own `country`, or `countryCode` written in `locale`. */
export function addressCountryName(address: Address, locale?: string): string {
	const name = text(address.country);
	if (name) return name;
	const code = text(address.countryCode).toUpperCase();
	return code ? countryName(code, locale) : '';
}

/**
 * The lines of an address as the country writes them: street lines, then the locality line
 * (postal code and city, in the country's order, with the region where it belongs), then the
 * country. Empty parts and empty lines are left out.
 */
export function formatAddress(
	address: Address | null | undefined,
	{ fields = ADDRESS_FIELDS, locale }: FormatAddressOptions = {}
): string[] {
	if (!address) return [];
	const has = new Set(fields);
	const part = (field: AddressField) => (has.has(field) ? text(address[field]) : '');
	const code = text(address.countryCode).toUpperCase();
	const postal = part('postalCode');
	const city = part('city');
	const region = part('region');
	const lines = [part('line1'), part('line2')];

	if (CITY_REGION_POSTAL.has(code)) {
		const regionPostal = [region, postal].filter(Boolean).join(' ');
		lines.push([city, regionPostal].filter(Boolean).join(', '));
	} else if (POSTAL_OWN_LINE.has(code)) {
		lines.push(city, region, postal);
	} else {
		lines.push([postal, city].filter(Boolean).join(' '), region);
	}
	if (has.has('country')) lines.push(addressCountryName(address, locale));
	return lines.filter(Boolean);
}

/** The address on one line, its lines joined by ", ". */
export const formatAddressLine = (
	address: Address | null | undefined,
	options?: FormatAddressOptions
) => formatAddress(address, options).join(', ');

/** ISO 3166-1 alpha-2 codes of every country and territory a postal address can be in. */
export const COUNTRY_CODES: readonly string[] = (
	'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR ' +
	'BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ ' +
	'EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW ' +
	'GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY ' +
	'KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV ' +
	'MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY ' +
	'QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG ' +
	'TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ' +
	'ZM ZW'
).split(' ');

const displayNames = new Map<string, Intl.DisplayNames | null>();

/** The name of the country `code` in `locale`, or the code itself when Intl cannot name it. */
export function countryName(code: string, locale?: string): string {
	const key = locale ?? '';
	if (!displayNames.has(key)) {
		try {
			displayNames.set(
				key,
				new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'region' })
			);
		} catch {
			displayNames.set(key, null);
		}
	}
	const upper = code.toUpperCase();
	try {
		return displayNames.get(key)?.of(upper) ?? upper;
	} catch {
		return upper;
	}
}
