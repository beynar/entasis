<script lang="ts">
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	import { envelopeSimpleIcon } from 'svelai/icons/envelopeSimple';
	let email = $state('');
</script>

<section class="mx-auto flex max-w-2xl flex-col gap-xl p-xl">
	<div class="text-center">
		<div
			class="mx-auto mb-xl flex size-16 items-center justify-center rounded-full bg-primary-muted text-primary"
		>
			{@render envelopeSimpleIcon({ size: 28 })}
		</div>
		<Heading as="h2" size="h2" weight="bold">A good idea, every now and then.</Heading>
		<p class="mt-lg text-neutral/70">
			A short note about product, design, and the details that make useful things feel good.
		</p>
	</div>
	<Form
		inputs={{
			email: {
				type: 'email',
				label: 'Email address',
				placeholder: 'you@company.com',
				required: true
			}
		}}
		onSubmit={(values) => (email = values.email ?? '')}
		actions={[
			{ children: 'Review subscription', fullWidth: true, onAction: (form) => form.submit() }
		]}
	/>
	<p class="text-center text-xs text-neutral/50">
		This example prepares a local draft and sends no email.
	</p>
	{#if email}<Card variant="soft" color="primary"
			><p role="status">Subscription draft for <strong>{email}</strong>.</p></Card
		>{/if}
</section>
