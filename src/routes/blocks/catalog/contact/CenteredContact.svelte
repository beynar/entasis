<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	let draft = $state('');
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-2xl flex-col">
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
			<p class="text-neutral/70 text-xs">This example prepares a draft; no message is sent.</p>
			{#if draft}<div class="bg-primary-muted p-lg rounded-lg" role="status">
					<strong>Message draft</strong>
					<p class="mt-sm whitespace-pre-wrap">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
