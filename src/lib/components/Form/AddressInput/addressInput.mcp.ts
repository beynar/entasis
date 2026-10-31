export const addressInputDescription = `
# AddressInput

A form field for a postal address. Its value is an \`AddressValue\` object (see \`entasis/address\`). Choose which parts it shows, which a person may edit and which are required. It searches Google Places by itself, and choosing a suggestion fills every part, with its coordinates (\`location: { lat, lng }\`).

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { AddressInput } from 'entasis/address-input';
  import type { AddressValue } from 'entasis/address';

  let address = $state<AddressValue | null>(null);
</script>

<AddressInput label="Delivery address" required defaultCountry="FR" bind:value={address} />
\`\`\`

## Setup

The search goes through the app's own \`/api/places\` route, so the Google key stays on the server. Four steps:

1. **A Google key.** In Google Cloud, enable **Places API (New)** on a project with billing, create an API key and restrict it to Places API (New). Give it no website (referrer) restriction: only your server calls Google, and a server request carries no referrer.
2. **The key in the server environment**, as \`GOOGLE_PLACE_API_KEY\`: in \`.env\` locally, and as a secret of your host in production (for example \`wrangler secret put GOOGLE_PLACE_API_KEY\` on Cloudflare). SvelteKit 3 reads declared variables only:

   \`\`\`ts
   // src/env.ts
   import { defineEnvVars } from '@sveltejs/kit/env';

   export const variables = defineEnvVars({
     GOOGLE_PLACE_API_KEY: {}
   });
   \`\`\`

   SvelteKit 2 needs no declaration: read \`env.GOOGLE_PLACE_API_KEY\` from \`$env/dynamic/private\`.
3. **The route**, one file:

   \`\`\`ts nocheck
   // src/routes/api/places/[...path]/+server.ts
   import { createGooglePlacesProxy } from 'entasis/address';
   import { GOOGLE_PLACE_API_KEY } from '$app/env/private';

   export const { GET, POST } = createGooglePlacesProxy({ apiKey: GOOGLE_PLACE_API_KEY });
   \`\`\`

   It forwards only the address search and the place lookup, with the key; any other path or method, or a missing key, answers 404.
4. **The field**: \`<AddressInput label="Address" />\`. No provider to build.

Without the route the search turns itself off (the dev server warns once) and the parts are typed by hand. To search elsewhere: \`setAddressProvider(createGooglePlacesProvider({ endpoint: '/my/route' }))\` in a layout, \`createGooglePlacesProvider({ apiKey })\` with a browser key restricted to your sites, or any \`{ search, resolve }\` provider. \`provider={null}\` turns one field's search off.

In a Form or \`ask()\`, use \`type: 'address'\` with the same props:

\`\`\`ts
const inputs = { address: { type: 'address', label: 'Address', required: true } } as const;
\`\`\`

## Props

Extends the shared Field props (\`label\`, \`description\`, \`helper\`, \`required\`, \`disabled\`, \`readOnly\`, \`name\`, \`size\`, \`density\`, \`labelPosition\`, \`messages\`, \`onValidate\`, \`errors\`, \`focused\`, \`visible\`) plus:

- **value** / **defaultValue**: \`AddressValue | null\` (bindable). \`null\` while nothing is entered.
- **onValueChange**: \`(value: AddressValue | null) => void\` — every edit of a part and every resolved suggestion.
- **provider**: \`AddressProvider | null\` — the search. Defaults to the one \`setAddressProvider\` set for the app, else to Google Places through \`/api/places\`. \`null\` turns the search off: every part is typed by hand.
- **fields**: \`AddressFieldRow[]\` — the parts shown and their layout. Each entry is a row: one part, or an array of parts side by side. A part is its name (\`'line1'\`, \`'line2'\`, \`'postalCode'\`, \`'city'\`, \`'region'\`, \`'country'\`) or its settings \`{ field, width?, label?, placeholder? }\`: \`width\` is its share of the row by proportion (default 1), \`label\` and \`placeholder\` replace the catalog's. Default \`['line1', 'line2', [{ field: 'postalCode', width: 1 }, { field: 'city', width: 2 }], 'country']\`. Under 28rem of the field's width every part takes its own row. A part listed twice throws.
- **editableFields**: \`AddressField[]\` (default: every shown part) — parts a person may type in. The others show what the search filled, read-only.
- **requiredFields**: \`AddressField[]\` — parts that must be filled once the address is started, or always when \`required\`. Defaults to the shown parts except \`line2\` and \`region\` when \`required\`, and to none otherwise. A missing part reads "Required: City" under the field and marks its input invalid.
- **countries**: \`string[]\` — ISO codes the search and the country list are limited to.
- **defaultCountry**: \`string\` — country code a new address starts in. A defaulted country alone does not make the address filled.
- **labelPosition**: \`'top' | 'left'\`. With \`left\`, every part has its label on the left, in one column the parts share, one part per row, under the address's legend. In the \`search\` layout the legend itself sits on the left of the search input.
- **layout**: \`'fields' | 'search'\` (default \`'fields'\`). \`fields\`: one input per part; the street line searches. \`search\`: one search input showing the chosen address on one line, with a button to enter or edit the parts by hand.
- **minSearchLength**: \`number\` (default 3) — characters typed before the search runs.
- **placeholder**: hint in the search input (the street line, unless its settings give one, or the single input of \`layout="search"\`).
- **onResolve**: \`(address: AddressValue) => void\` — the address a chosen suggestion resolved to, after the value changed.
- **i18n**, **theme** (parts \`parts\`, \`grid\`, \`row\`, \`part\`, \`search\`, \`partErrors\`, plus Field parts).

## Layout

\`\`\`svelte
<AddressInput
  label="Address"
  fields={[
    [{ field: 'line1', width: 3 }, { field: 'line2', label: 'Building', placeholder: 'Bldg B, floor 3' }],
    [{ field: 'postalCode', width: 1 }, { field: 'city', width: 2 }],
    ['region', 'country']
  ]}
/>
\`\`\`

\`editableFields\` and \`requiredFields\` name the parts, whatever row they sit in. The theme's \`grid\` part holds the rows, \`row\` lays one out through \`--address-row-columns\`, and \`part\` wraps each input.

## Behaviour

- Typing in the street line edits \`line1\` and searches. Choosing a suggestion resolves it and replaces the whole value (with \`line2\` from the provider, usually empty): \`streetNumber\`, \`street\`, \`formatted\`, \`placeId\` and \`location\` come with it.
- A manual edit clears \`formatted\`, \`placeId\` and \`location\`; editing \`line1\` also clears \`streetNumber\` and \`street\`.
- The country is a searchable list of countries named in the active locale; its value is \`countryCode\`, and \`country\` follows in the same locale.
- A failed resolve shows "This address could not be loaded. Fill it in by hand." and leaves the parts editable.
- One session id covers the searches and the resolve of each chosen address.

## Native forms and Form

- In a Form, only the address is an entry: the part inputs inside it are not Form fields.
- With a \`name\`, hidden inputs submit \`name[line1]\`, \`name[postalCode]\`… for each shown part, plus \`name[countryCode]\`.

## Accessibility

- The field is a \`<fieldset>\` whose legend is the label (or "Address" without one). Each part is a labelled input with its browser autofill hint (\`address-line1\`, \`postal-code\`, \`address-level2\`…; the street line turns the browser's off while a provider suggests).
- Required parts show the required marker. Errors are linked to the fieldset, and the missing parts' inputs are marked invalid.
- The search is an \`Autocomplete\`: a combobox with a listbox of suggestions.
- While a suggestion resolves, the parts have \`aria-busy="true"\`.
`;
