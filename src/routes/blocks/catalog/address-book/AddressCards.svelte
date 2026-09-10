<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Dialog } from 'svelai/dialog';
	import { Form } from 'svelai/form';
	const initialAddresses = [
		{
			id: 'home',
			label: 'Home',
			name: 'Alex Morgan',
			street: '18 Rue des Archives',
			city: 'Paris',
			postal: '75004',
			country: 'France'
		},
		{
			id: 'studio',
			label: 'Studio',
			name: 'Alex Morgan',
			street: '42 Avenue Parmentier',
			city: 'Paris',
			postal: '75011',
			country: 'France'
		}
	];
	let addresses = $state(initialAddresses.map((address) => ({ ...address })));
	let preferred = $state('home');
	let editing = $state<string | null>(null);
	const selected = $derived(addresses.find((address) => address.id === editing));

	let nextId = $state(1);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Delivery addresses</p>
		<Heading size="h2" weight="bold">A place for every good thing.</Heading>
	</header>
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
		{#each addresses as address (address.id)}<Card
				variant={preferred === address.id ? 'soft' : 'outline'}
				color={preferred === address.id ? 'primary' : 'neutral'}
				><div class="flex flex-col gap-xl">
					<div class="flex gap-lg justify-between">
						<h3 class="font-semibold">{address.label}</h3>
						{#if preferred === address.id}<Chip size="small" variant="soft">Default</Chip>{/if}
					</div>
					<address class="text-sm not-italic leading-relaxed text-neutral/65">
						{address.name}<br />{address.street}<br />{address.postal}
						{address.city}<br />{address.country}
					</address>
					<div class="flex gap-md">
						<Button size="small" variant="outline" onclick={() => (editing = address.id)}
							>Edit</Button
						><Button
							size="small"
							variant="ghost"
							disabled={preferred === address.id}
							onclick={() => (preferred = address.id)}>Use default</Button
						>
					</div>
				</div></Card
			>{/each}<Button
			variant="outline"
			class="min-h-48 border-dashed"
			onclick={() => (editing = 'new')}>+ Add a delivery address</Button
		>
	</div>
	<Dialog
		open={editing !== null}
		onOpenChange={(open) => {
			if (!open) editing = null;
		}}
		title={editing === 'new' ? 'Add address' : 'Edit address'}
		description="Changes apply to this local address book."
		>{#key editing}<Form
				inputs={{
					label: {
						type: 'text',
						label: 'Address label',
						required: true,
						defaultValue: selected?.label ?? ''
					},
					name: {
						type: 'text',
						label: 'Full name',
						required: true,
						defaultValue: selected?.name ?? ''
					},
					street: {
						type: 'text',
						label: 'Street address',
						required: true,
						defaultValue: selected?.street ?? ''
					},
					city: {
						type: 'text',
						label: 'City',
						required: true,
						defaultValue: selected?.city ?? ''
					},
					postal: {
						type: 'text',
						label: 'Postal code',
						required: true,
						defaultValue: selected?.postal ?? ''
					},
					country: {
						type: 'text',
						label: 'Country',
						required: true,
						defaultValue: selected?.country ?? 'France'
					}
				}}
				onSubmit={(values) => {
					const address = {
						id: editing === 'new' ? `address-${nextId++}` : (editing ?? 'home'),
						label: values.label ?? '',
						name: values.name ?? '',
						street: values.street ?? '',
						city: values.city ?? '',
						postal: values.postal ?? '',
						country: values.country ?? ''
					};
					addresses =
						editing === 'new'
							? [...addresses, address]
							: addresses.map((entry) => (entry.id === editing ? address : entry));
					editing = null;
				}}
				actions={[
					{ children: 'Save address', onAction: (form) => form.submit() },
					{ children: 'Cancel', variant: 'ghost', onAction: () => (editing = null) }
				]}
			/>{/key}</Dialog
	>
</section>
