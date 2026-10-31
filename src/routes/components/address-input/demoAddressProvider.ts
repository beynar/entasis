import type { AddressProvider, AddressValue } from '$lib/components/Address/index.js';

// A handful of real addresses, for the public docs: the dev server searches Google instead.
const addresses: AddressValue[] = [
	{ line1: '12 Rue de Rivoli', postalCode: '75004', city: 'Paris', region: 'Île-de-France', country: 'France', countryCode: 'FR', location: { lat: 48.8556, lng: 2.36 } },
	{ line1: '8 Place Bellecour', postalCode: '69002', city: 'Lyon', region: 'Auvergne-Rhône-Alpes', country: 'France', countryCode: 'FR', location: { lat: 45.7578, lng: 4.832 } },
	{ line1: '1600 Amphitheatre Parkway', postalCode: '94043', city: 'Mountain View', region: 'CA', country: 'United States', countryCode: 'US', location: { lat: 37.422, lng: -122.0841 } },
	{ line1: 'Friedrichstraße 43', postalCode: '10969', city: 'Berlin', region: 'Berlin', country: 'Germany', countryCode: 'DE', location: { lat: 52.5067, lng: 13.3909 } },
	{ line1: '10 Downing Street', postalCode: 'SW1A 2AA', city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', location: { lat: 51.5034, lng: -0.1276 } },
	{ line1: 'Carrer de Mallorca 401', postalCode: '08013', city: 'Barcelona', region: 'Catalonia', country: 'Spain', countryCode: 'ES', location: { lat: 41.4036, lng: 2.1744 } },
	{ line1: '1 Infinite Loop', postalCode: '95014', city: 'Cupertino', region: 'CA', country: 'United States', countryCode: 'US', location: { lat: 37.3318, lng: -122.0312 } }
]; // prettier-ignore

const fold = (value: string) =>
	value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();

export const demoAddressProvider: AddressProvider = {
	async search(query) {
		const words = fold(query).split(/\s+/).filter(Boolean);
		return addresses
			.map((address, index) => ({ address, index }))
			.filter(({ address }) => {
				const haystack = fold(Object.values(address).join(' '));
				return words.every((word) => haystack.includes(word));
			})
			.map(({ address, index }) => ({
				id: String(index),
				label: address.line1 ?? '',
				description: [address.city, address.country].filter(Boolean).join(', ')
			}));
	},
	async resolve(id) {
		const address = addresses[Number(id)];
		return address
			? {
					...address,
					formatted: [address.line1, address.city, address.country].join(', '),
					placeId: `demo-${id}`
				}
			: null;
	}
};
