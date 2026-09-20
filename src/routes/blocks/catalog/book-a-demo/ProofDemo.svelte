<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	let draft = $state('');
</script>

<section class="gap-xl bg-surface-recessed p-lg md:p-xl grid md:grid-cols-2">
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
			<p class="text-neutral/70 text-xs">
				This example prepares a local draft and sends no message.
			</p>
			{#if draft}<p class="bg-primary-muted p-md rounded-lg text-sm" role="status">
					Draft agenda: {draft}
				</p>{/if}</Stack
		></Card
	>
	<div class="gap-lg flex flex-col justify-center">
		<Chip class="self-start" variant="outline">A better way to work</Chip><Heading as="h2" size="h2"
			>Built around real teams.</Heading
		><Card variant="outline"
			><Stack gap="lg"
				><blockquote class="text-lg">
					“The best part was seeing our own process become simpler, right there in the first
					conversation.”
				</blockquote>
				<div class="mt-lg gap-md flex items-center">
					<Avatar name="Maya Chen" />
					<div>
						<strong class="text-sm">Maya Chen</strong>
						<p class="text-neutral/70 text-xs">Product lead · Fieldwork</p>
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
		<p class="text-neutral/65 text-xs">Illustrative customer stories for this component example.</p>
	</div>
</section>
