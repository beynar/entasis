import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GOOGLE_PLACE_API_KEY: {
		description:
			'Google Places API (New) key for the AddressInput docs. Read only by the dev server proxy in src/routes/api/places; optional.',
		schema: (value) => value || undefined
	}
});
