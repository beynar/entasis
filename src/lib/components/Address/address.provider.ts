/**
 * The address search a field uses when it is given none: Google Places through the app's own
 * `/api/places` route (see `createGooglePlacesProxy`), or the provider set for the subtree.
 */
import { DEV } from 'esm-env';
import { getContext, setContext } from 'svelte';
import type { AddressProvider } from './address.js';
import { createGooglePlacesProvider, GooglePlacesError } from './address.google.js';

/** The route the built-in provider searches through. */
export const DEFAULT_ADDRESS_ENDPOINT = '/api/places';

const CONTEXT = Symbol('entasis.addressProvider');

/**
 * Sets the address search every AddressInput below uses, unless it is given its own `provider`.
 * Call it in a layout, such as with `createGooglePlacesProvider({ apiKey })` for a browser key or
 * another endpoint. Pass `null` to turn the search off.
 */
export function setAddressProvider(provider: AddressProvider | null) {
	setContext(CONTEXT, { provider });
}

/** The provider set with `setAddressProvider` above this component, if any. */
export function getAddressProvider(): { provider: AddressProvider | null } | undefined {
	return getContext(CONTEXT);
}

let builtIn: AddressProvider | undefined;

/**
 * Google Places through `/api/places`. When the app has no such route (it answers 404), the
 * search turns itself off for the page: the fields stay, typed by hand, and the dev server says
 * once how to add the route.
 */
export function builtInAddressProvider(): AddressProvider {
	if (builtIn) return builtIn;
	const google = createGooglePlacesProvider({ endpoint: DEFAULT_ADDRESS_ENDPOINT });
	let available = true;
	const missing = (error: unknown) => {
		if (!(error instanceof GooglePlacesError) || error.status !== 404) return false;
		available = false;
		if (DEV)
			console.warn(
				`entasis: AddressInput searches Google Places through ${DEFAULT_ADDRESS_ENDPOINT}, which this app does not serve. Add src/routes/api/places/[...path]/+server.ts with \`export const { GET, POST } = createGooglePlacesProxy({ apiKey })\` from 'entasis/address', or pass a \`provider\`.`
			);
		return true;
	};
	builtIn = {
		async search(query, request) {
			if (!available) return [];
			try {
				return await google.search(query, request);
			} catch (error) {
				if (missing(error)) return [];
				throw error;
			}
		},
		async resolve(id, request) {
			if (!available) return null;
			try {
				return await google.resolve(id, request);
			} catch (error) {
				if (missing(error)) return null;
				throw error;
			}
		}
	};
	return builtIn;
}
