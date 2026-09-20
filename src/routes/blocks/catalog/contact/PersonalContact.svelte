<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	let draft = $state('');
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-4xl md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start justify-center">
		<Avatar size="large" name="Nora Ellis" />
		<div>
			<Heading as="h2" size="h2" weight="bold">Hi, I'm Nora.</Heading>
			<p class="mt-lg text-neutral/70">
				I help turn early questions into a clear product direction. Tell me where you are stuck.
			</p>
		</div>
		<Chip color="success" variant="soft">Open for conversations</Chip>
		<div class="gap-sm text-neutral/70 flex flex-col text-sm">
			<p>Product strategist · Northstar</p>
			<p>Based in Copenhagen</p>
		</div>
	</div>
	<Card title="A short note is enough" variant="outline"
		><Stack gap="lg"
			><Form
				inputs={{
					email: { type: 'email', label: 'Your email', required: true },
					question: { type: 'textarea', label: 'What is on your mind?', required: true }
				}}
				onSubmit={(values) => (draft = values.question ?? '')}
				actions={[{ children: 'Review your note', onAction: (form) => form.submit() }]}
			/>
			<p class="text-neutral/65 text-xs">Local example. No email is sent.</p>
			{#if draft}<blockquote class="bg-primary-muted p-lg rounded-lg" role="status">
					{draft}
				</blockquote>{/if}</Stack
		></Card
	>
</section>
