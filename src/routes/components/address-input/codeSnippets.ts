import type { AddressFieldRow } from '$lib/components/Form/AddressInput/index.js';

/** The Usage card's layout choices. */
export type AddressLayoutControls = {
	rows: string;
	cityWidth: number;
	line2: boolean;
	region: boolean;
	country: boolean;
	editable: string;
};

/** The `fields` rows the Usage card's controls describe. */
export function usageFields(values: AddressLayoutControls): AddressFieldRow[] {
	const paired = values.rows === 'paired';
	const rows: AddressFieldRow[] = ['line1'];
	if (values.line2) rows.push('line2');
	if (paired)
		rows.push([
			{ field: 'postalCode', width: 1 },
			{ field: 'city', width: values.cityWidth }
		]);
	else rows.push('postalCode', 'city');
	const last = [values.region && 'region', values.country && 'country'].filter(
		(part): part is 'region' | 'country' => !!part
	);
	if (paired && last.length > 1) rows.push(last);
	else rows.push(...last);
	return rows;
}

/** `editableFields` for the Usage card: everything, or the street lines the search starts from. */
export const usageEditableFields = (values: AddressLayoutControls) =>
	values.editable === 'search only'
		? (['line1', 'line2'] as const).filter((part) => part === 'line1' || values.line2)
		: undefined;

const item = (part: AddressFieldRow): string =>
	typeof part === 'string'
		? `'${part}'`
		: Array.isArray(part)
			? `[${part.map((entry) => item(entry as AddressFieldRow)).join(', ')}]`
			: `{ field: '${(part as { field: string }).field}', width: ${(part as { width?: number }).width ?? 1} }`;

// Kept out of the page: a literal closing script tag inside the page's markup ends its parse.
export function getUsageCode(
	values: AddressLayoutControls & {
		layout: string;
		size: string;
		density: string;
		labelPosition: string;
		required: boolean;
		disabled: boolean;
		readOnly: boolean;
	}
): string {
	const editable = usageEditableFields(values);
	return [
		'<script lang="ts">',
		"\timport { AddressInput } from 'entasis/address-input';",
		"\timport type { AddressValue } from 'entasis/address';",
		'',
		'\tlet address = $state<AddressValue | null>(null);',
		'</' + 'script>',
		'',
		'<AddressInput',
		'\tlabel="Delivery address"',
		`\tlayout="${values.layout}"`,
		`\tsize="${values.size}"`,
		`\tdensity="${values.density}"`,
		`\tlabelPosition="${values.labelPosition}"`,
		`\trequired={${values.required}}`,
		`\tdisabled={${values.disabled}}`,
		`\treadOnly={${values.readOnly}}`,
		'\tdefaultCountry="FR"',
		'\tfields={[',
		...usageFields(values).map((row) => `\t\t${item(row)},`),
		'\t]}',
		...(editable ? [`\teditableFields={[${editable.map((part) => `'${part}'`).join(', ')}]}`] : []),
		'\tbind:value={address}',
		'/>'
	].join('\n');
}

/** Everything an app adds so AddressInput searches Google Places with the server's key. */
export const proxyRouteCode = [
	'# .env (in production, a secret of your host: wrangler secret put GOOGLE_PLACE_API_KEY)',
	'GOOGLE_PLACE_API_KEY=your-places-api-new-key',
	'',
	'// src/env.ts (SvelteKit 3; SvelteKit 2 reads $env/dynamic/private instead)',
	"import { defineEnvVars } from '@sveltejs/kit/env';",
	'',
	'export const variables = defineEnvVars({',
	'\tGOOGLE_PLACE_API_KEY: {}',
	'});',
	'',
	'// src/routes/api/places/[...path]/+server.ts',
	"import { createGooglePlacesProxy } from 'entasis/address';",
	"import { GOOGLE_PLACE_API_KEY } from '$app/env/private';",
	'',
	'export const { GET, POST } = createGooglePlacesProxy({ apiKey: GOOGLE_PLACE_API_KEY });'
].join('\n');

export const customLayoutCode = [
	'<AddressInput',
	'\tlabel="Office"',
	'\tfields={[',
	"\t\t[{ field: 'line1', width: 3 }, { field: 'line2', label: 'Building', placeholder: 'Bldg B, floor 3' }],",
	"\t\t[{ field: 'postalCode', width: 1 }, { field: 'city', width: 2 }],",
	"\t\t['region', 'country']",
	'\t]}',
	'/>'
].join('\n');
