// The server route AddressInput searches through: it forwards the two Places calls with the
// server's key, and nothing else.
import { describe, expect, test, vi } from 'vitest';
import { createGooglePlacesProxy } from './address.google.js';

const event = (url: string, init?: RequestInit) => ({ request: new Request(url, init) });

describe('createGooglePlacesProxy', () => {
	test('forwards the search with the server key', async () => {
		const fetch = vi.fn(async () => Response.json({ suggestions: [] }));
		const { POST } = createGooglePlacesProxy({ apiKey: 'server-key', fetch });
		const response = await POST(
			event('https://app.test/api/places/places:autocomplete', {
				method: 'POST',
				body: JSON.stringify({ input: 'rivoli' })
			})
		);

		expect(response.status).toBe(200);
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
		expect(new Headers(init.headers).get('X-Goog-Api-Key')).toBe('server-key');
		expect(init.body).toBe('{"input":"rivoli"}');
	});

	test('forwards a place lookup with its query and the address field mask', async () => {
		const fetch = vi.fn(async () => Response.json({ id: 'abc' }));
		const { GET } = createGooglePlacesProxy({ apiKey: 'server-key', fetch });
		await GET(event('https://app.test/api/places/places/abc?sessionToken=s&languageCode=fr'));

		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://places.googleapis.com/v1/places/abc?sessionToken=s&languageCode=fr');
		expect(new Headers(init.headers).get('X-Goog-FieldMask')).toBe(
			'id,formattedAddress,addressComponents,location'
		);
	});

	test('anything else, or no key, answers 404 without calling Google', async () => {
		const fetch = vi.fn();
		const { GET, POST } = createGooglePlacesProxy({ apiKey: 'server-key', fetch });
		expect((await GET(event('https://app.test/api/places/places:searchText'))).status).toBe(404);
		expect(
			(await POST(event('https://app.test/api/places/places/abc', { method: 'POST' }))).status
		).toBe(404);
		// An id is letters, digits, _ and -: an encoded slash cannot reach another endpoint.
		expect((await GET(event('https://app.test/api/places/places/abc%2F..%2Fkeys'))).status).toBe(
			404
		);

		const keyless = createGooglePlacesProxy({ apiKey: undefined, fetch });
		expect((await keyless.GET(event('https://app.test/api/places/places/abc'))).status).toBe(404);
		expect(fetch).not.toHaveBeenCalled();
	});
});
