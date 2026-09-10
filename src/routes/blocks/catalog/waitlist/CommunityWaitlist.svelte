<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { AvatarGroup } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	let email = $state('');
</script>

<section class="mx-auto flex max-w-2xl flex-col gap-xl p-xl">
	<div class="flex flex-col items-center gap-xl text-center">
		<Chip variant="outline">Something thoughtful is taking shape</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">Be there for the next beginning.</Heading
		>
		<p class="text-lg text-neutral/70">
			A calmer workspace for the plans, people, and ideas you want to move forward.
		</p>
		<div class="flex flex-wrap items-center justify-center gap-md">
			<AvatarGroup
				size="small"
				items={[
					{ name: 'Maya Chen' },
					{ name: 'Theo Park' },
					{ name: 'Nora Ellis' },
					{ name: 'Ari Costa' }
				]}
			/>
			<p class="text-sm text-neutral/60">Made for curious, thoughtful teams.</p>
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
			<p class="text-center text-xs text-neutral/50">
				This preview keeps your request local. Nothing is sent.
			</p>
			{#if email}<p class="rounded-lg bg-primary-muted p-md text-sm" role="status">
					Early-access request draft for <strong>{email}</strong>.
				</p>{/if}</Stack
		></Card
	>
</section>
