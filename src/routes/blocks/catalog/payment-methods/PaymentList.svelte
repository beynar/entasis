<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	let methods = $state([
		{ id: 'visa', brand: 'Visa', last4: '4242', name: 'Personal card', expiry: '12/2028' },
		{ id: 'mastercard', brand: 'Mastercard', last4: '8210', name: 'Studio card', expiry: '08/2027' }
	]);
	let preferred = $state('visa');
	let editing = $state<string | null>(null);
	const selected = $derived(methods.find((method) => method.id === editing));
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Your account</p>
		<Heading size="h2" weight="bold">Payment methods.</Heading>
		<p class="max-w-2xl text-neutral/65">Manage the display details of your saved sample cards.</p>
	</header>
	<div class="flex flex-col gap-xl">
		{#each methods as method (method.id)}<article class="rounded-lg border border-neutral/15 p-xl">
				{#if editing === method.id}{#key editing}<Form
							inputs={{
								name: {
									type: 'text',
									label: 'Card nickname',
									required: true,
									defaultValue: selected?.name ?? ''
								},
								expiry: {
									type: 'text',
									label: 'Expiry label',
									required: true,
									defaultValue: selected?.expiry ?? '',
									placeholder: 'MM/YYYY'
								}
							}}
							onSubmit={(values) => {
								methods = methods.map((method) =>
									method.id === editing
										? { ...method, name: values.name ?? '', expiry: values.expiry ?? '' }
										: method
								);
								editing = null;
							}}
							actions={[
								{ children: 'Save changes', onAction: (form) => form.submit() },
								{ children: 'Cancel', variant: 'ghost', onAction: () => (editing = null) }
							]}
						/>{/key}{:else}<div class="flex gap-xl items-center justify-between flex-wrap">
						<div class="flex gap-xl items-center">
							<span
								class="grid h-12 w-20 place-items-center rounded-lg bg-surface-recessed text-sm font-semibold"
								>{method.brand}</span
							>
							<div>
								<div class="flex gap-md items-center flex-wrap">
									<h3 class="font-semibold">{method.name} ···· {method.last4}</h3>
									{#if preferred === method.id}<Chip size="small" variant="soft">Default</Chip>{/if}
								</div>
								<p class="mt-md text-sm text-neutral/55">Expires {method.expiry}</p>
							</div>
						</div>
						<div class="flex gap-md">
							<Button variant="outline" size="small" onclick={() => (editing = method.id)}
								>Edit details</Button
							><Button
								variant="ghost"
								size="small"
								disabled={preferred === method.id}
								onclick={() => (preferred = method.id)}>Set default</Button
							>
						</div>
					</div>{/if}
			</article>{/each}
	</div>
</section>
