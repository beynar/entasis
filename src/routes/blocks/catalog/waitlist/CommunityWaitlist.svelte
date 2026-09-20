<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { AvatarGroup } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	let email = $state('');
</script>

<section class="gap-xl p-xl mx-auto flex max-w-2xl flex-col">
	<div class="gap-xl flex flex-col items-center text-center">
		<Chip variant="outline">Something thoughtful is taking shape</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">Be there for the next beginning.</Heading
		>
		<p class="text-neutral/70 text-lg">
			A calmer workspace for the plans, people, and ideas you want to move forward.
		</p>
		<div class="gap-md flex flex-wrap items-center justify-center">
			<AvatarGroup
				size="small"
				items={[
					{ name: 'Maya Chen' },
					{ name: 'Theo Park' },
					{ name: 'Nora Ellis' },
					{ name: 'Ari Costa' }
				]}
			/>
			<p class="text-neutral/70 text-sm">Made for curious, thoughtful teams.</p>
		</div>
	</div>
	<Card variant="outline"
		><Stack gap="lg"
			><Form
				inputs={{ email: { type: 'email', label: 'Your email', required: true } }}
				onSubmit={(values) => (email = values.email ?? '')}
				actions={[
					{
						children: 'Review early-access request',
						fullWidth: true,
						onAction: (form) => form.submit()
					}
				]}
			/>
			<p class="text-neutral/65 text-center text-xs">
				This preview keeps your request local. Nothing is sent.
			</p>
			{#if email}<p class="bg-primary-muted p-md rounded-lg text-sm" role="status">
					Early-access request draft for <strong>{email}</strong>.
				</p>{/if}</Stack
		></Card
	>
</section>
