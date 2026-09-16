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

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-2">
	<div class="gap-xl flex flex-col">
		<Chip class="self-start">A guided first look</Chip><Heading as="h2" size="h1" weight="bold"
			>See what your team could do next.</Heading
		>
		<p class="text-neutral/70">A focused, 30-minute tour built around the way you work.</p>
		<ul class="gap-lg flex flex-col">
			{#each ['Walk through your real workflow', 'Explore the tools that matter to your team', 'Leave with a practical starting point'] as benefit (benefit)}<li
					class="gap-md flex items-center"
				>
					<span class="text-success">{@render checkCircleIcon()}</span>{benefit}
				</li>{/each}
		</ul>
		<div class="gap-md flex items-center">
			<AvatarGroup items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]} />
			<p class="text-neutral/70 text-sm">Talk with the people who build the product.</p>
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
			/>{#if draft}<div class="bg-primary-muted p-md rounded-lg" role="status">
					<strong>Request draft</strong>
					<p class="mt-sm text-sm break-words">{draft}</p>
				</div>{/if}</Stack
		></Card
	>
</section>
