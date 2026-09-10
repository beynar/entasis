<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Your wallet</p>
		<Heading size="h2" weight="bold">A card for every day.</Heading>
	</header>
	<div class="grid gap-xl sm:grid-cols-2">
		{#each methods as method, i (method.id)}<article class="flex flex-col gap-xl">
				<div
					class={i === 0
						? 'flex flex-col gap-xl rounded-xl bg-primary p-xl text-primary-contrast'
						: 'flex flex-col gap-xl rounded-xl bg-neutral p-xl text-neutral-contrast'}
				>
					<div class="flex gap-xl justify-between">
						<span class="text-xl font-semibold">{method.brand}</span
						>{#if preferred === method.id}<Chip color="neutral" size="small" variant="soft"
								>Default</Chip
							>{/if}
					</div>
					<div class="my-lg h-8 w-11 rounded-md border border-current opacity-50"></div>
					<p class="text-2xl tracking-widest">•••• •••• •••• {method.last4}</p>
					<div class="flex gap-lg justify-between text-xs uppercase tracking-widest">
						<span>{method.name}</span><span>{method.expiry}</span>
					</div>
				</div>
				<div class="flex gap-lg justify-between">
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
	<p class="text-xs text-neutral/45">
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
