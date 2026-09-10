<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { AvatarGroup } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	let draft = $state('');
</script>

<section class="mx-auto grid max-w-6xl gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col gap-xl">
		<Chip class="self-start">A guided first look</Chip><Heading as="h2" size="h1" weight="bold"
			>See what your team could do next.</Heading
		>
		<p class="text-neutral/70">A focused, 30-minute tour built around the way you work.</p>
		<ul class="flex flex-col gap-lg">
			{#each ['Walk through your real workflow', 'Explore the tools that matter to your team', 'Leave with a practical starting point'] as benefit (benefit)}<li
					class="flex items-center gap-md"
				>
					<span class="text-success">{@render checkCircleIcon()}</span>{benefit}
				</li>{/each}
		</ul>
		<div class="flex items-center gap-md">
			<AvatarGroup items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]} />
			<p class="text-sm text-neutral/60">Talk with the people who build the product.</p>
		</div>
	</div>
	<Card
		variant="outline"
		title="Tell us a little about your team"
		description="Preview a request. Nothing is sent from this example."
		><Stack gap="lg"
			><Form
				inputs={{
					name: { type: 'text', label: 'Full name', required: true },
					email: { type: 'email', label: 'Work email', required: true },
					company: { type: 'text', label: 'Company', required: true }
				}}
				onSubmit={(values) => (draft = `${values.name} · ${values.company} · ${values.email}`)}
				actions={[{ children: 'Review demo request', onAction: (form) => form.submit() }]}
			/>{#if draft}<div class="rounded-lg bg-primary-muted p-md" role="status">
					<strong>Request draft</strong>
					<p class="mt-sm break-words text-sm">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
