<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl flex flex-wrap items-center justify-between">
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Your account
			</p>
			<Heading size="h2" weight="bold">Address book.</Heading>
			<p class="text-neutral/65 max-w-2xl">Keep your usual delivery addresses close.</p>
		</header>
		<Button variant="outline" onclick={() => (editing = 'new')}>Add address +</Button>
	</div>
	{#if editing === 'new'}<div class="border-neutral/15 p-xl rounded-lg border">
			{@render addressEditor()}
		</div>{/if}
	<div class="gap-xl flex flex-col">
		{#each addresses as address (address.id)}<article
				class="border-neutral/15 p-xl rounded-lg border"
			>
				{#if editing === address.id}{@render addressEditor()}{:else}<div
						class="gap-xl flex flex-wrap items-start justify-between"
					>
						<div class="gap-lg flex flex-col">
							<div class="gap-lg flex items-center">
								<h3 class="text-lg font-semibold">{address.label}</h3>
								{#if preferred === address.id}<Chip size="small" variant="soft">Default</Chip>{/if}
							</div>
							<address class="text-neutral/65 text-sm leading-relaxed not-italic">
								{address.name}<br />{address.street}<br />{address.postal}
								{address.city}<br />{address.country}
							</address>
						</div>
						<div class="gap-md flex flex-wrap">
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
	<p class="text-neutral/65 text-xs">Address changes are kept in this preview.</p>
</section>
