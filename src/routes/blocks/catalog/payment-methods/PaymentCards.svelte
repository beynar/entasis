<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Dialog } from 'entasis/dialog';
	import { Form } from 'entasis/form';
	let methods = $state([
		{ id: 'visa', brand: 'Visa', last4: '4242', name: 'Personal card', expiry: '12/2028' },
		{ id: 'mastercard', brand: 'Mastercard', last4: '8210', name: 'Studio card', expiry: '08/2027' }
	]);
	let preferred = $state('visa');
	let editing = $state<string | null>(null);
	const selected = $derived(methods.find((method) => method.id === editing));
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">Your wallet</p>
		<Heading size="h2" weight="bold">A card for every day.</Heading>
	</header>
	<div class="gap-xl grid sm:grid-cols-2">
		{#each methods as method, i (method.id)}<article class="gap-xl flex flex-col">
				<div
					class={i === 0
						? 'gap-xl bg-primary p-xl text-primary-contrast flex flex-col rounded-xl'
						: 'gap-xl bg-neutral p-xl text-neutral-contrast flex flex-col rounded-xl'}
				>
					<div class="gap-xl flex justify-between">
						<span class="text-xl font-semibold">{method.brand}</span
						>{#if preferred === method.id}<Chip color="neutral" size="small" variant="soft"
								>Default</Chip
							>{/if}
					</div>
					<div class="my-lg h-8 w-11 rounded-md border border-current opacity-50"></div>
					<p class="text-2xl tracking-widest">•••• •••• •••• {method.last4}</p>
					<div class="gap-lg flex justify-between text-xs tracking-widest uppercase">
						<span>{method.name}</span><span>{method.expiry}</span>
					</div>
				</div>
				<div class="gap-lg flex justify-between">
					<Button variant="outline" size="small" onclick={() => (editing = method.id)}
						>Edit nickname</Button
					><Button
						variant="ghost"
						size="small"
						onclick={() => (preferred = method.id)}
						disabled={preferred === method.id}
						>{preferred === method.id ? 'Default card' : 'Make default'}</Button
					>
				</div>
			</article>{/each}
	</div>
	<p class="text-neutral/65 text-xs">
		Illustrative payment methods. No payment details are collected.
	</p>
	<Dialog
		open={editing !== null}
		onOpenChange={(open) => {
			if (!open) editing = null;
		}}
		title="Edit card display"
		description="Update this sample card’s nickname and expiry label."
		>{#key editing}<Form
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
			/>{/key}</Dialog
	>
</section>
