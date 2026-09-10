<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	let draft = $state('');
</script>

<section class="mx-auto grid max-w-5xl gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col items-start gap-xl">
		<Chip variant="outline">The Field Notes</Chip><Heading as="h2" size="h1" weight="bold"
			>Useful things,<br />worth your time.</Heading
		>
		<ul class="flex flex-col gap-lg">
			{#each ['One practical product idea', 'A pattern you can put to work', 'Something small worth noticing'] as promise (promise)}<li
					class="flex items-center gap-md"
				>
					<span class="text-primary">{@render checkCircleIcon()}</span>{promise}
				</li>{/each}
		</ul>
		<p class="text-sm text-neutral/60">Written with care. Read at your own pace.</p>
	</div>
	<Card
		class="self-center"
		variant="soft"
		color="primary"
		title="Make room for a little inspiration"
		><Stack gap="lg"
			><Form
				inputs={{
					name: { type: 'text', label: 'First name', required: true },
					email: { type: 'email', label: 'Email address', required: true }
				}}
				onSubmit={(values) => (draft = `${values.name} · ${values.email}`)}
				actions={[{ children: 'Review your subscription', onAction: (form) => form.submit() }]}
			/>
			<p class="text-xs text-neutral/60">Local preview. No subscription is sent.</p>
			{#if draft}<div class="rounded-lg bg-surface p-lg" role="status">
					<strong>Your subscription draft</strong>
					<p class="mt-sm break-words text-sm">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
