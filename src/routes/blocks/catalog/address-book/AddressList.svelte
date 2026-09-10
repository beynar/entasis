<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
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

{#snippet addressEditor()}
	{#key editing}<Form
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
				city: { type: 'text', label: 'City', required: true, defaultValue: selected?.city ?? '' },
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
		/>{/key}
{/snippet}

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="flex gap-xl items-center justify-between flex-wrap">
		<header class="flex flex-col gap-lg">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">Your account</p>
			<Heading size="h2" weight="bold">Address book.</Heading>
			<p class="max-w-2xl text-neutral/65">Keep your usual delivery addresses close.</p>
		</header>
		<Button variant="outline" onclick={() => (editing = 'new')}>Add address +</Button>
	</div>
	{#if editing === 'new'}<div class="rounded-lg border border-neutral/15 p-xl">
			{@render addressEditor()}
		</div>{/if}
	<div class="flex flex-col gap-xl">
		{#each addresses as address (address.id)}<article
				class="rounded-lg border border-neutral/15 p-xl"
			>
				{#if editing === address.id}{@render addressEditor()}{:else}<div
						class="flex gap-xl items-start justify-between flex-wrap"
					>
						<div class="flex flex-col gap-lg">
							<div class="flex gap-lg items-center">
								<h3 class="text-lg font-semibold">{address.label}</h3>
								{#if preferred === address.id}<Chip size="small" variant="soft">Default</Chip>{/if}
							</div>
							<address class="text-sm not-italic leading-relaxed text-neutral/65">
								{address.name}<br />{address.street}<br />{address.postal}
								{address.city}<br />{address.country}
							</address>
						</div>
						<div class="flex gap-md flex-wrap">
							<Button variant="outline" size="small" onclick={() => (editing = address.id)}
								>Edit</Button
							>{#if preferred !== address.id}<Button
									variant="ghost"
									size="small"
									onclick={() => (preferred = address.id)}>Make default</Button
								>{/if}
						</div>
					</div>{/if}
			</article>{/each}
	</div>
	<p class="text-xs text-neutral/45">Address changes are kept in this preview.</p>
</section>
