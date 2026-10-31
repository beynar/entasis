export const addressDescription = `
# Address

\`entasis/address\` holds the address model, the line order of each country, an \`<Address>\` display component, and the Google Places search \`AddressInput\` uses by default (with the server route that serves it).

## Display

\`\`\`svelte
<script lang="ts">
  import { Address, type AddressValue } from 'entasis/address';

  const office: AddressValue = {
    line1: '12 Rue de Rivoli',
    postalCode: '75004',
    city: 'Paris',
    countryCode: 'FR'
  };
</script>

<Address address={office} />
<Address address={office} layout="inline" fields={['line1', 'city']} />
\`\`\`

Props:

- **address**: \`AddressValue | null\` — the address to display.
- **fields**: \`AddressField[]\` — parts to show (\`line1\`, \`line2\`, \`postalCode\`, \`city\`, \`region\`, \`country\`). Defaults to every part. The order on screen follows the country, not this list.
- **layout**: \`'block' | 'inline'\` (default \`'block'\`) — one line per row, or every line joined by ", ".
- **size**: \`'small' | 'normal' | 'large'\` — text size.
- **empty**: \`string | Snippet\` — shown when nothing is left to display.
- **ref**, **class**, **theme** (parts \`root\`, \`line\`, \`empty\`), and native attributes of the root \`<address>\`.

## The address value

\`\`\`ts
type AddressValue = {
  line1?: string | null;       // "12 Rue de Rivoli", "Friedrichstraße 43"
  line2?: string | null;       // apartment, suite, building
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;      // state, province ("CA" in the US, Canada and Australia)
  country?: string | null;     // country name
  countryCode?: string | null; // ISO 3166-1 alpha-2, decides the line order
  streetNumber?: string | null;
  street?: string | null;
  formatted?: string | null;   // the provider's one-line address
  placeId?: string | null;
  location?: { lat: number; lng: number } | null;
};
\`\`\`

\`streetNumber\`, \`street\`, \`formatted\`, \`placeId\` and \`location\` come from a provider and are cleared by a manual edit that no longer matches them.

## Formatting

- \`formatAddress(value, { fields?, locale? })\` returns the lines in the country's order: street lines, then "75004 Paris" in most of Europe and Latin America, "Mountain View, CA 94043" in the US, Canada and Australia, the city and the postcode on their own lines in the UK and Ireland, then the country (named in \`locale\` when only \`countryCode\` is set).
- \`formatAddressLine(value, options)\` joins them with ", ".
- \`composeStreetLine(number, street, countryCode)\` writes the number before the street, or after it in Germany, the Netherlands, Italy, Spain, Scandinavia, Latin America and the rest of continental Europe.
- \`isAddressEmpty(value)\`, \`countryName(code, locale)\`, \`addressCountryName(value, locale)\`, \`COUNTRY_CODES\`, \`ADDRESS_FIELDS\`.

## Providers

An \`AddressProvider\` is two functions: \`search(query, request)\` returns \`{ id, label, description? }\` suggestions, and \`resolve(id, request)\` returns the full address. \`request\` carries \`signal\`, a \`session\` id shared by the searches and the resolve of one chosen address, \`language\` and \`countries\`.

### Google Places, built in

AddressInput searches Google Places by itself, through the app's \`/api/places\` route. That route is the whole setup:

\`\`\`ts nocheck
// src/routes/api/places/[...path]/+server.ts
import { createGooglePlacesProxy } from 'entasis/address';
import { GOOGLE_PLACE_API_KEY } from '$app/env/private';

export const { GET, POST } = createGooglePlacesProxy({ apiKey: GOOGLE_PLACE_API_KEY });
\`\`\`

- \`createGooglePlacesProxy({ apiKey, fetch? })\` returns \`GET\` and \`POST\` request handlers (\`({ request }) => Response\`, so SvelteKit and any Fetch-API server take them). They forward exactly two calls to Places API (New) with the server's key: \`POST …/places:autocomplete\` and \`GET …/places/{id}\` (field mask \`id,formattedAddress,addressComponents,location\`). Anything else, or a missing key, answers 404: the route is not an open proxy, and the key never reaches the page. Restrict the key to Places API (New) in the Google Cloud console.
- Without the route (it answers 404), the search turns itself off for the page and the parts are typed by hand; the dev server warns once.
- \`DEFAULT_ADDRESS_ENDPOINT\` is \`'/api/places'\`.

### Another provider, or none

- \`setAddressProvider(provider)\` in a layout sets the search for every AddressInput below, such as \`createGooglePlacesProvider({ apiKey: PUBLIC_KEY })\` to call Google from the browser with a key restricted to your sites, or a provider for another service. \`setAddressProvider(null)\` turns the search off.
- An AddressInput's own \`provider\` prop wins over both; \`provider={null}\` turns its search off.

### createGooglePlacesProvider

\`\`\`ts
import { createGooglePlacesProvider } from 'entasis/address';

const fromBrowser = createGooglePlacesProvider({ apiKey: PUBLIC_GOOGLE_PLACES_KEY });
const throughAnotherRoute = createGooglePlacesProvider({ endpoint: '/geo/places' });
\`\`\`

- Uses Places API (New) over REST: \`POST {endpoint}/places:autocomplete\` and \`GET {endpoint}/places/{id}\`. No Google SDK is loaded.
- Options: \`apiKey\`, \`endpoint\` (default \`https://places.googleapis.com/v1\`), \`language\`, \`region\`, \`types\` (default \`street_address\`, \`premise\`, \`subpremise\`, \`route\`, so shops and landmarks stay out; \`[]\` for every place), \`fetch\`.
- The session token groups the autocomplete calls and the details call, so Google bills one session per chosen address.
- \`parseGooglePlace(place)\` turns a Place's \`addressComponents\` into an \`AddressValue\`: the street line in the country's order, \`locality\` (or \`postal_town\`, then the nearest sublocality or administrative level) as the city, the first administrative level as the region, and \`location\` as \`{ lat, lng }\`.
- A failed request rejects with a \`GooglePlacesError\` carrying Google's message and the HTTP \`status\`; AddressInput shows the search as failed and keeps the parts editable.
`;
