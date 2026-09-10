<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	let draft = $state('');
</script>

<section class="mx-auto flex max-w-2xl flex-col gap-xl p-lg md:p-xl">
	<div class="text-center">
		<Chip variant="outline">Say hello</Chip><Heading as="h2" size="h2" weight="bold" class="mt-xl"
			>What are you working on?</Heading
		>
		<p class="mt-lg text-neutral/70">Tell us a little about the idea. Start wherever you are.</p>
	</div>
	<Card variant="outline"
		><Stack gap="lg"
			><Form
				inputs={{
					name: { type: 'text', label: 'Your name', required: true },
					email: { type: 'email', label: 'Email address', required: true },
					message: {
						type: 'textarea',
						label: 'Your message',
						placeholder: 'A question, an idea, a good place to start…',
						required: true
					}
				}}
				onSubmit={(values) => (draft = `${values.name}: ${values.message}`)}
				actions={[
					{ children: 'Review message', fullWidth: true, onAction: (form) => form.submit() }
				]}
			/>
			<p class="text-xs text-neutral/60">This example prepares a draft; no message is sent.</p>
			{#if draft}<div class="rounded-lg bg-primary-muted p-lg" role="status">
					<strong>Message draft</strong>
					<p class="mt-sm whitespace-pre-wrap">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
