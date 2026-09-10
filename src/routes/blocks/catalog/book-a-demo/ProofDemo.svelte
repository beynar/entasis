<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	let draft = $state('');
</script>

<section class="grid gap-xl bg-surface-recessed p-lg md:grid-cols-2 md:p-xl">
	<Card
		title="Find your team's next gear"
		description="Start with a conversation, not a sales deck."
		><Stack gap="lg"
			><Form
				inputs={{
					email: { type: 'email', label: 'Work email', required: true },
					team: {
						type: 'text',
						label: 'Team size',
						placeholder: 'For example, 12 people',
						required: true
					},
					goal: { type: 'textarea', label: 'What would you like to explore?', required: true }
				}}
				onSubmit={(values) => (draft = `${values.team}: ${values.goal}`)}
				actions={[{ children: 'Review conversation request', onAction: (form) => form.submit() }]}
			/>
			<p class="text-xs text-neutral/60">
				This example prepares a local draft and sends no message.
			</p>
			{#if draft}<p class="rounded-lg bg-primary-muted p-md text-sm" role="status">
					Draft agenda: {draft}
				</p>{/if}</Stack
		></Card
	>
	<div class="flex flex-col justify-center gap-lg">
		<Chip class="self-start" variant="outline">A better way to work</Chip><Heading as="h2" size="h2"
			>Built around real teams.</Heading
		><Card variant="outline"
			><Stack gap="lg"
				><blockquote class="text-lg">
					“The best part was seeing our own process become simpler, right there in the first
					conversation.”
				</blockquote>
				<div class="mt-lg flex items-center gap-md">
					<Avatar user={{ name: 'Maya Chen' }} />
					<div>
						<strong class="text-sm">Maya Chen</strong>
						<p class="text-xs text-neutral/60">Product lead · Fieldwork</p>
					</div>
				</div></Stack
			></Card
		><Card color="primary" variant="soft"
			><Stack gap="lg"
				><blockquote>
					“We left with a clear plan and enough context to make the decision ourselves.”
				</blockquote>
				<p class="mt-md text-sm">Jules Bernard · Studio North</p></Stack
			></Card
		>
		<p class="text-xs text-neutral/50">Illustrative customer stories for this component example.</p>
	</div>
</section>
