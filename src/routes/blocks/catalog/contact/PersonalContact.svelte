<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	let draft = $state('');
</script>

<section class="mx-auto grid max-w-4xl gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col items-start justify-center gap-xl">
		<Avatar size="large" user={{ name: 'Nora Ellis' }} />
		<div>
			<Heading as="h2" size="h2" weight="bold">Hi, I'm Nora.</Heading>
			<p class="mt-lg text-neutral/70">
				I help turn early questions into a clear product direction. Tell me where you are stuck.
			</p>
		</div>
		<Chip color="success" variant="soft">Open for conversations</Chip>
		<div class="flex flex-col gap-sm text-sm text-neutral/60">
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
			<p class="text-xs text-neutral/50">Local example. No email is sent.</p>
			{#if draft}<blockquote class="rounded-lg bg-primary-muted p-lg" role="status">
					{draft}
				</blockquote>{/if}</Stack
		></Card
	>
</section>
