// The route AddressInput searches Google Places through by default, as an app would add it. Dev
// only: the public docs never spend the key, and search a few sample addresses instead.
import { DEV } from 'esm-env';
import { GOOGLE_PLACE_API_KEY } from '$app/env/private';
import { createGooglePlacesProxy } from '$lib/components/Address/index.js';

export const { GET, POST } = createGooglePlacesProxy({
	apiKey: DEV ? GOOGLE_PLACE_API_KEY : undefined
});
