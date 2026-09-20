<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	let draft = $state('');
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-5xl md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">The Field Notes</Chip><Heading as="h2" size="h1" weight="bold"
			>Useful things,<br />worth your time.</Heading
		>
		<ul class="gap-lg flex flex-col">
			{#each ['One practical product idea', 'A pattern you can put to work', 'Something small worth noticing'] as promise (promise)}<li
					class="gap-md flex items-center"
				>
					<span class="text-primary-readable">{@render checkCircleIcon()}</span>{promise}
				</li>{/each}
		</ul>
		<p class="text-neutral/70 text-sm">Written with care. Read at your own pace.</p>
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
			<p class="text-neutral/70 text-xs">Local preview. No subscription is sent.</p>
			{#if draft}<div class="bg-surface p-lg rounded-lg" role="status">
					<strong>Your subscription draft</strong>
					<p class="mt-sm text-sm break-words">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
