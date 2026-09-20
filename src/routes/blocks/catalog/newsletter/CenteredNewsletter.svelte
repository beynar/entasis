<script lang="ts">
	import { Card } from 'entasis/card';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	import { envelopeSimpleIcon } from 'entasis/icons/envelopeSimple';
	let email = $state('');
</script>

<section class="gap-xl p-xl mx-auto flex max-w-2xl flex-col">
	<div class="text-center">
		<div
			class="mb-xl bg-primary-muted text-primary-muted-readable mx-auto flex size-16 items-center justify-center rounded-full"
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
	<p class="text-neutral/65 text-center text-xs">
		This example prepares a local draft and sends no email.
	</p>
	{#if email}<Card variant="soft" color="primary"
			><p role="status">Subscription draft for <strong>{email}</strong>.</p></Card
		>{/if}
</section>
