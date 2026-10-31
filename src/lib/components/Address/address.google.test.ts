// Parsing and the two Places API (New) calls, against responses recorded from the real API.
import { describe, expect, test, vi } from 'vitest';
import fixtures from './address.google.fixtures.json' with { type: 'json' };
import {
	createGooglePlacesProvider,
	parseGooglePlace,
	type GooglePlace
} from './address.google.js';

const place = (key: keyof typeof fixtures) => fixtures[key].place as GooglePlace;

describe('parseGooglePlace', () => {
	test('France: number before the street, the locality as the city', () => {
		expect(parseGooglePlace(place('paris'))).toMatchObject({
			line1: '12 Rue de Rivoli',
			line2: null,
			postalCode: '75004',
			city: 'Paris',
			region: 'Île-de-France',
			country: 'France',
			countryCode: 'FR',
			streetNumber: '12',
			street: 'Rue de Rivoli',
			formatted: '12 Rue de Rivoli, 75004 Paris, France'
		});
		expect(parseGooglePlace(place('paris')).location).toEqual({
			lat: expect.any(Number),
			lng: expect.any(Number)
		});
		expect(parseGooglePlace(place('paris')).placeId).toBe(place('paris').id);
	});

	test('United States: the short state', () => {
		expect(parseGooglePlace(place('mountainView'))).toMatchObject({
			line1: '1600 Amphitheatre Parkway',
			city: 'Mountain View',
			region: 'CA',
			postalCode: '94043',
			countryCode: 'US'
		});
	});

	test('Germany: number after the street, the city over its district', () => {
		expect(parseGooglePlace(place('berlin'))).toMatchObject({
			line1: 'Friedrichstraße 43',
			city: 'Berlin',
			postalCode: '10969',
			countryCode: 'DE'
		});
	});

	test('United Kingdom: the postal town as the city', () => {
		expect(parseGooglePlace(place('london'))).toMatchObject({
			line1: '10 Downing Street',
			city: 'London',
			postalCode: 'SW1A 2AA',
			countryCode: 'GB'
		});
	});

	test('a place without a street keeps its premise as the street line', () => {
		expect(
			parseGooglePlace({
				addressComponents: [
					{ longText: 'Tour Eiffel', types: ['premise'] },
					{ longText: 'Paris', types: ['locality'] },
					{ longText: 'France', shortText: 'FR', types: ['country'] }
				]
			})
		).toMatchObject({ line1: 'Tour Eiffel', line2: null, city: 'Paris', location: null });
	});
});

describe('createGooglePlacesProvider', () => {
	const respond = (body: unknown, status = 200) =>
		new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

	test('search posts the query under the session and maps the predictions', async () => {
		const fetch = vi.fn(async () => respond(fixtures.paris.autocomplete));
		const provider = createGooglePlacesProvider({ apiKey: 'key', fetch });
		const suggestions = await provider.search('12 rue de rivoli', {
			session: 'session-1',
			language: 'fr',
			countries: ['FR', 'BE']
		});

		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
		expect(init.method).toBe('POST');
		expect(new Headers(init.headers).get('X-Goog-Api-Key')).toBe('key');
		expect(JSON.parse(init.body as string)).toEqual({
			input: '12 rue de rivoli',
			sessionToken: 'session-1',
			languageCode: 'fr',
			includedRegionCodes: ['fr', 'be'],
			includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route']
		});
		expect(suggestions[0]).toEqual({
			id: fixtures.paris.autocomplete.suggestions[0]!.placePrediction.placeId,
			label: '12 Rue de Rivoli',
			description: 'Paris, France'
		});
	});

	test('an empty query asks nothing', async () => {
		const fetch = vi.fn();
		const provider = createGooglePlacesProvider({ fetch });
		expect(await provider.search('  ', { session: 's' })).toEqual([]);
		expect(fetch).not.toHaveBeenCalled();
	});

	test('resolve gets the place with its field mask, under the same session', async () => {
		const fetch = vi.fn(async () => respond(fixtures.berlin.place));
		const provider = createGooglePlacesProvider({ endpoint: '/api/places/', fetch, types: [] });
		const address = await provider.resolve('abc', { session: 'session-1', language: 'de' });

		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('/api/places/places/abc?sessionToken=session-1&languageCode=de');
		const headers = new Headers(init.headers);
		expect(headers.get('X-Goog-FieldMask')).toBe('id,formattedAddress,addressComponents,location');
		// A proxy endpoint adds the key on the server.
		expect(headers.has('X-Goog-Api-Key')).toBe(false);
		expect(address?.line1).toBe('Friedrichstraße 43');
	});

	test('a failed request rejects with Google’s message', async () => {
		const fetch = vi.fn(async () =>
			respond({ error: { code: 403, message: 'Requests from referer <empty> are blocked.' } }, 403)
		);
		const provider = createGooglePlacesProvider({ apiKey: 'key', fetch });
		await expect(provider.search('rivoli', { session: 's' })).rejects.toThrow(
			'Google Places: Requests from referer <empty> are blocked.'
		);
	});
});
