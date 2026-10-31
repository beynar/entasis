<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { Address, type AddressValue } from '$lib/components/Address/index.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const addresses: { title: string; value: AddressValue }[] = [
		{
			title: 'France',
			value: { line1: '12 Rue de Rivoli', line2: '3e étage', postalCode: '75004', city: 'Paris', countryCode: 'FR' }
		},
		{
			title: 'United States',
			value: { line1: '1600 Amphitheatre Parkway', postalCode: '94043', city: 'Mountain View', region: 'CA', countryCode: 'US' }
		},
		{
			title: 'Germany',
			value: { line1: 'Friedrichstraße 43', postalCode: '10969', city: 'Berlin', countryCode: 'DE' }
		},
		{
			title: 'United Kingdom',
			value: { line1: '10 Downing Street', postalCode: 'SW1A 2AA', city: 'London', countryCode: 'GB' }
		}
	]; // prettier-ignore

	const controls = createComponentControls([
		{ name: 'size', type: 'segmented', label: 'Size', value: 'normal', options: sizes },
		{
			name: 'layout',
			type: 'segmented',
			label: 'Layout',
			value: 'block',
			options: ['block', 'inline']
		}
	]);
</script>

<DocPage
	title="Address"
	subtitle="Display a postal address the way its country writes it, and pick the parts to show."
	component="Address"
	features={[
		'Line order per country',
		'Country named in the active locale',
		'Choose the parts shown',
		'Block or inline layout'
	]}
>
	<ComponentCard
		{controls}
		description="Each country orders its lines its own way."
		code={`<Address
	address={address}
	size="${controls.value.size}"
	layout="${controls.value.layout}"
/>`}
	>
		<div class="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
			{#each addresses as entry (entry.title)}
				<div class="grid gap-1">
					<p class="text-neutral/70 text-xs font-medium">{entry.title}</p>
					<Address
						address={entry.value}
						size={controls.value.size}
						layout={controls.value.layout}
					/>
				</div>
			{/each}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Only some parts"
			description="fields picks the parts; their order still follows the country."
			code={`<Address {address} fields={['city', 'country']} layout="inline" />`}
		>
			<Address address={addresses[0]!.value} fields={['city', 'country']} layout="inline" />
		</ComponentCard>

		<ComponentCard
			title="Empty"
			description="Shown when there is nothing to display."
			code={`<Address address={null} empty="No address yet" />`}
		>
			<Address address={null} empty="No address yet" />
		</ComponentCard>
	{/snippet}
</DocPage>
