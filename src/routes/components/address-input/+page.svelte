<script lang="ts">
	import { DEV } from 'esm-env';
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import AddressInput from '$lib/components/Form/AddressInput/AddressInput.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { Address, setAddressProvider, type AddressValue } from '$lib/components/Address/index.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { demoAddressProvider } from './demoAddressProvider.js';
	import {
		customLayoutCode,
		getUsageCode,
		proxyRouteCode,
		usageEditableFields,
		usageFields
	} from './codeSnippets.js';

	// AddressInput searches Google Places through /api/places by itself: the dev server serves
	// that route. The public docs do not, so they search a few sample addresses instead.
	if (!DEV) setAddressProvider(demoAddressProvider);

	let address = $state<AddressValue | null>(null);
	let shipping = $state<AddressValue | null>(null);
	const controls = createComponentControls([
		{ name: 'size', type: 'segmented', label: 'Size', value: 'normal', options: sizes },
		{ name: 'density', type: 'segmented', label: 'Density', value: 'normal', options: densities },
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{
			name: 'layout',
			type: 'segmented',
			label: 'Layout',
			value: 'fields',
			options: ['fields', 'search']
		},
		{
			name: 'rows',
			type: 'segmented',
			label: 'Rows',
			value: 'paired',
			options: ['paired', 'stacked']
		},
		{
			name: 'cityWidth',
			type: 'slider',
			label: 'City width',
			value: 2,
			min: 1,
			max: 4,
			step: 1,
			showValue: true,
			visible: (values) => values.rows === 'paired'
		},
		{
			name: 'editable',
			type: 'segmented',
			label: 'Editable',
			value: 'all',
			options: ['all', 'search only']
		},
		{ name: 'line2', type: 'switch', label: 'Line 2', value: true },
		{ name: 'region', type: 'switch', label: 'Region', value: false },
		{ name: 'country', type: 'switch', label: 'Country', value: true },
		{ name: 'required', type: 'switch', label: 'Required', value: true },
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);
</script>

<DocPage
	title="Address input"
	subtitle="A postal address field: pick the parts it shows and lets people edit, and plug in Google Places (or any address search) to fill them from a suggestion."
	component="AddressInput"
	features={[
		'Choose the parts shown, editable and required',
		'Google Places (New) search with session billing',
		'Country-aware street line and line order',
		'Country list named in the active locale',
		'Form, ask() and native form submission'
	]}
>
	<ComponentCard
		{controls}
		description={DEV
			? 'Type an address: on the dev server the search runs against Google Places.'
			: 'Type an address: try "rivoli", "berlin" or "amphitheatre".'}
		code={getUsageCode(controls.value)}
	>
		<div class="grid w-full max-w-xl gap-4">
			<AddressInput
				label="Delivery address"
				layout={controls.value.layout}
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				required={controls.value.required}
				disabled={controls.value.disabled}
				readOnly={controls.value.readOnly}
				defaultCountry="FR"
				fields={usageFields(controls.value)}
				editableFields={usageEditableFields(controls.value)}
				bind:value={address}
			/>
			{#if address}
				<div class="border-neutral-muted grid gap-2 rounded-md border p-3">
					<Address {address} size="small" />
					<pre class="text-neutral/70 overflow-x-auto text-xs">{JSON.stringify(
							address,
							null,
							2
						)}</pre>
				</div>
			{/if}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Setup"
			description="AddressInput searches Google Places by itself, through your app's /api/places route. In Google Cloud, enable Places API (New) on a project with billing, create a key and restrict it to that API (no website restriction: only your server calls Google). Then put the key in your server environment and add the route: it forwards only the address search and the place lookup, so the key never reaches the page. Without the route the search turns itself off and the parts are typed by hand."
			code={proxyRouteCode}
		>
			<ol class="text-neutral/70 grid list-decimal gap-1 ps-5 text-sm">
				<li>Enable Places API (New), with billing, and create a key restricted to it.</li>
				<li>Put the key in the server environment as GOOGLE_PLACE_API_KEY.</li>
				<li>Add the /api/places route with createGooglePlacesProxy.</li>
				<li>Use AddressInput: no provider to build.</li>
			</ol>
		</ComponentCard>

		<ComponentCard
			title="Custom layout"
			description="Each entry of fields is a row: a part, or several side by side. A part can carry its own width (a share of its row), label and placeholder."
			code={customLayoutCode}
		>
			<div class="w-full max-w-xl">
				<AddressInput
					label="Office"
					fields={[
						[
							{ field: 'line1', width: 3 },
							{ field: 'line2', label: 'Building', placeholder: 'Bldg B, floor 3' }
						],
						[
							{ field: 'postalCode', width: 1 },
							{ field: 'city', width: 2 }
						],
						['region', 'country']
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Only some parts"
			description="fields picks the parts and their order: here the city and the country only."
			code={`<AddressInput label="Where are you based?" fields={['city', 'country']} />`}
		>
			<div class="w-full max-w-xl">
				<AddressInput label="Where are you based?" fields={['city', 'country']} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Search fills, people complete"
			description="editableFields keeps the searched parts read-only: only the street line (to search) and the second line can be typed."
			code={`<AddressInput
	label="Shipping address"
	fields={['line1', 'line2', 'postalCode', 'city', 'region', 'country']}
	editableFields={['line1', 'line2']}
	requiredFields={['line1', 'postalCode', 'city', 'country']}
/>`}
		>
			<div class="w-full max-w-xl">
				<AddressInput
					label="Shipping address"
					fields={['line1', 'line2', 'postalCode', 'city', 'region', 'country']}
					editableFields={['line1', 'line2']}
					requiredFields={['line1', 'postalCode', 'city', 'country']}
					bind:value={shipping}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="One search input"
			description="layout=&quot;search&quot; shows the chosen address on one line, with a button to enter it by hand."
			code="<AddressInput label=&quot;Office&quot; layout=&quot;search&quot; />"
		>
			<div class="w-full max-w-xl">
				<AddressInput label="Office" layout="search" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Without the search"
			description="provider=&#123;null&#125; turns the search off: every part is typed by hand, with the browser's address autofill."
			code={`<AddressInput label="Billing address" provider={null} defaultCountry="DE" />`}
		>
			<div class="w-full max-w-xl">
				<AddressInput label="Billing address" provider={null} defaultCountry="DE" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="In a Form"
			description="Use type: 'address' in Form inputs or ask()."
			code={`<Form
	inputs={{
		name: { type: 'text', label: 'Company', required: true },
		address: { type: 'address', label: 'Head office', required: true }
	}}
	onSubmit={(data) => save(data)}
/>`}
		>
			<div class="w-full max-w-xl">
				<Form
					inputs={{
						name: { type: 'text', label: 'Company', required: true },
						address: { type: 'address', label: 'Head office', required: true }
					}}
					onSubmit={(data: unknown) => console.log('Form submitted:', data)}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
