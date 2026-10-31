// The built-in search: Google Places through the app's /api/places route, which turns itself off
// for the page when the app has no such route.
import { afterEach, describe, expect, test, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.resetModules();
});

describe('builtInAddressProvider', () => {
	test('a missing route turns the search off, with one warning', async () => {
		const fetch = vi.fn(async () => new Response('Not found', { status: 404 }));
		vi.stubGlobal('fetch', fetch);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { builtInAddressProvider } = await import('./address.provider.js');
		const provider = builtInAddressProvider();

		expect(await provider.search('12 rue de rivoli', { session: 's' })).toEqual([]);
		expect(await provider.search('12 rue de rivoli p', { session: 's' })).toEqual([]);
		expect(fetch).toHaveBeenCalledOnce();
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0]![0])).toContain('createGooglePlacesProxy');
	});

	test('any other failure is the search failing, not a missing route', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ error: { message: 'Quota exceeded' } }, { status: 429 }))
		);
		const { builtInAddressProvider } = await import('./address.provider.js');
		await expect(builtInAddressProvider().search('rivoli', { session: 's' })).rejects.toThrow(
			'Quota exceeded'
		);
	});
});
