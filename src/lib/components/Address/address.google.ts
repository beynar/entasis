/**
 * Google Places (Places API "New", REST) as an `AddressProvider`. No SDK is loaded: the search
 * and the place details are two `fetch` calls, grouped under the field's session token so
 * Google bills one autocomplete session per chosen address.
 */
import type { Address, AddressProvider, AddressSuggestion } from './address.js';
import { composeStreetLine } from './address.js';

/** One entry of a Place's `addressComponents`. */
export type GooglePlaceAddressComponent = {
	longText?: string;
	shortText?: string;
	types?: string[];
	languageCode?: string;
};

/** The Place fields `parseGooglePlace` reads. */
export type GooglePlace = {
	id?: string;
	formattedAddress?: string;
	addressComponents?: GooglePlaceAddressComponent[];
	location?: { latitude?: number; longitude?: number };
};

export type GooglePlacesProviderOptions = {
	/**
	 * Browser API key, sent as `X-Goog-Api-Key`. Restrict it to your sites and to Places API
	 * (New) in the Google Cloud console. Omit it when `endpoint` is your own proxy that adds the
	 * key on the server.
	 */
	apiKey?: string;
	/**
	 * Base URL of the Places API, or of a proxy that forwards `POST {endpoint}/places:autocomplete`
	 * and `GET {endpoint}/places/{id}` to it. Defaults to `https://places.googleapis.com/v1`.
	 */
	endpoint?: string;
	/** Language of the results when the field does not pass one. */
	language?: string;
	/** CLDR region code that biases the results and formats them ("fr"). */
	region?: string;
	/**
	 * Primary place types the search is limited to (up to 5). Defaults to addresses only
	 * (`street_address`, `premise`, `subpremise`, `route`), so shops and landmarks stay out;
	 * pass `[]` to search every place.
	 */
	types?: readonly string[];
	/** Fetch implementation, for a server or a test. Defaults to the global `fetch`. */
	fetch?: typeof fetch;
};

const DEFAULT_ENDPOINT = 'https://places.googleapis.com/v1';
const DETAILS_FIELD_MASK = 'id,formattedAddress,addressComponents,location';
const ADDRESS_TYPES = ['street_address', 'premise', 'subpremise', 'route'];

type AutocompleteResponse = {
	suggestions?: {
		placePrediction?: {
			placeId?: string;
			text?: { text?: string };
			structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
		};
	}[];
};

/** The first component of `place` carrying one of `types`, in the order of `types`. */
const component = (place: GooglePlace, ...types: string[]) => {
	for (const type of types) {
		const found = place.addressComponents?.find((entry) => entry.types?.includes(type));
		if (found) return found;
	}
	return undefined;
};

/**
 * An `Address` from a Google Place: the street line in the country's order, the postal town
 * or the nearest locality as the city, the first administrative level as the region (its short
 * form in the United States, Canada and Australia, where it is written "CA" or "NSW").
 */
export function parseGooglePlace(place: GooglePlace): Address {
	const countryCode = component(place, 'country')?.shortText?.toUpperCase() ?? null;
	const streetNumber = component(place, 'street_number')?.longText ?? null;
	const street = component(place, 'route')?.longText ?? null;
	const region = component(place, 'administrative_area_level_1');
	const shortRegion = countryCode === 'US' || countryCode === 'CA' || countryCode === 'AU';
	const premise = component(place, 'subpremise', 'premise')?.longText ?? null;
	const latitude = place.location?.latitude;
	const longitude = place.location?.longitude;

	return {
		line1: composeStreetLine(streetNumber, street, countryCode) ?? premise,
		line2: composeStreetLine(streetNumber, street, countryCode) ? premise : null,
		postalCode: component(place, 'postal_code')?.longText ?? null,
		city:
			component(
				place,
				'locality',
				'postal_town',
				'sublocality_level_1',
				'sublocality',
				'administrative_area_level_3',
				'administrative_area_level_2'
			)?.longText ?? null,
		region: (shortRegion ? region?.shortText : region?.longText) ?? null,
		country: component(place, 'country')?.longText ?? null,
		countryCode,
		streetNumber,
		street,
		formatted: place.formattedAddress ?? null,
		placeId: place.id ?? null,
		location:
			typeof latitude === 'number' && typeof longitude === 'number'
				? { lat: latitude, lng: longitude }
				: null
	};
}

/** A Places request that failed, with its HTTP status. */
export class GooglePlacesError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'GooglePlacesError';
	}
}

async function failure(response: Response): Promise<GooglePlacesError> {
	let message = `Google Places request failed (${response.status})`;
	try {
		const body = (await response.json()) as { error?: { message?: string } };
		if (body.error?.message) message = `Google Places: ${body.error.message}`;
	} catch {
		// Not JSON: keep the status.
	}
	return new GooglePlacesError(response.status, message);
}

/**
 * An `AddressProvider` backed by Google Places (Places API "New"). Pass a browser `apiKey`, or an
 * `endpoint` on your server that adds the key, so it never reaches the page.
 */
export function createGooglePlacesProvider(
	options: GooglePlacesProviderOptions = {}
): AddressProvider {
	const endpoint = (options.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
	const types = options.types ?? ADDRESS_TYPES;
	const request = (input: string, init: RequestInit) => {
		const headers = new Headers(init.headers);
		if (options.apiKey) headers.set('X-Goog-Api-Key', options.apiKey);
		return (options.fetch ?? fetch)(`${endpoint}${input}`, { ...init, headers });
	};

	return {
		async search(query, { signal, session, language, countries }) {
			const input = query.trim();
			if (!input) return [];
			const response = await request('/places:autocomplete', {
				method: 'POST',
				signal,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					input,
					sessionToken: session,
					languageCode: language ?? options.language,
					regionCode: options.region,
					includedRegionCodes: countries?.length
						? countries.map((code) => code.toLowerCase())
						: undefined,
					includedPrimaryTypes: types.length ? types : undefined
				})
			});
			if (!response.ok) throw await failure(response);
			const body = (await response.json()) as AutocompleteResponse;
			return (body.suggestions ?? []).flatMap((suggestion): AddressSuggestion[] => {
				const prediction = suggestion.placePrediction;
				if (!prediction?.placeId) return [];
				const main = prediction.structuredFormat?.mainText?.text;
				return [
					{
						id: prediction.placeId,
						label: main ?? prediction.text?.text ?? '',
						description: main ? prediction.structuredFormat?.secondaryText?.text : undefined
					}
				];
			});
		},

		async resolve(id, { signal, session, language }) {
			const params = new URLSearchParams({ sessionToken: session });
			const languageCode = language ?? options.language;
			if (languageCode) params.set('languageCode', languageCode);
			if (options.region) params.set('regionCode', options.region);
			const response = await request(`/places/${encodeURIComponent(id)}?${params}`, {
				method: 'GET',
				signal,
				headers: { 'X-Goog-FieldMask': DETAILS_FIELD_MASK }
			});
			if (!response.ok) throw await failure(response);
			return parseGooglePlace((await response.json()) as GooglePlace);
		}
	};
}

export type GooglePlacesProxyOptions = {
	/** Server-side Places API (New) key. It stays on the server: the page never sees it. */
	apiKey: string | undefined;
	/** Fetch implementation. Defaults to the global `fetch`. */
	fetch?: typeof fetch;
};

type ProxyEvent = { request: Request };

const AUTOCOMPLETE_PATH = /\/places:autocomplete$/;
const PLACE_PATH = /\/places\/([\w-]+)$/;

/**
 * Server handlers for the route `AddressInput` searches through by default
 * (`/api/places/[...path]`): they forward the two Places calls to Google with the server's key.
 * Nothing else passes: any other path or method answers 404, so the route is not an open proxy.
 *
 * ```ts
 * // src/routes/api/places/[...path]/+server.ts
 * import { createGooglePlacesProxy } from 'entasis/address';
 * export const { GET, POST } = createGooglePlacesProxy({ apiKey: GOOGLE_PLACE_API_KEY });
 * ```
 */
export function createGooglePlacesProxy({ apiKey, fetch: fetchImpl }: GooglePlacesProxyOptions) {
	const notFound = () => new Response('Not found', { status: 404 });
	const forward = async (path: string, init: RequestInit, search = '') => {
		if (!apiKey) return notFound();
		const headers = new Headers(init.headers);
		headers.set('X-Goog-Api-Key', apiKey);
		const response = await (fetchImpl ?? fetch)(`${DEFAULT_ENDPOINT}${path}${search}`, {
			...init,
			headers
		});
		return new Response(response.body, {
			status: response.status,
			headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' }
		});
	};

	return {
		POST: async ({ request }: ProxyEvent) => {
			if (!AUTOCOMPLETE_PATH.test(new URL(request.url).pathname)) return notFound();
			return forward('/places:autocomplete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: await request.text()
			});
		},
		GET: async ({ request }: ProxyEvent) => {
			const url = new URL(request.url);
			const id = PLACE_PATH.exec(url.pathname)?.[1];
			if (!id) return notFound();
			return forward(
				`/places/${id}`,
				{
					method: 'GET',
					headers: { 'X-Goog-FieldMask': DETAILS_FIELD_MASK }
				},
				url.search
			);
		}
	};
}
