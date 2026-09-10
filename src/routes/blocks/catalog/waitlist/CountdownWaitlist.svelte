<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	import { onMount } from 'svelte';
	let email = $state('');
	let now = $state(Date.now());
	const launch = Date.parse('2026-12-01T09:00:00Z');
	const remaining = $derived(Math.max(0, Math.floor((launch - now) / 1000)));
	const countdown = $derived([
		{ label: 'Days', value: Math.floor(remaining / 86400) },
		{ label: 'Hours', value: Math.floor((remaining % 86400) / 3600) },
		{ label: 'Minutes', value: Math.floor((remaining % 3600) / 60) },
		{ label: 'Seconds', value: remaining % 60 }
	]);
	onMount(() => {
		const timer = window.setInterval(() => (now = Date.now()), 1000);
		return () => window.clearInterval(timer);
	});
</script>

<section class="flex flex-col items-center gap-xl bg-primary-muted p-xl text-center">
	<Chip variant="outline">Northstar · The next chapter</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		class="max-w-2xl">A new space for good work is on its way.</Heading
	>
	<p class="max-w-xl text-neutral/70">
		An illustrative launch, set for December 1, 2026. Be ready for a clearer place to begin.
	</p>
	<div class="grid w-full max-w-xl grid-cols-4 gap-sm" aria-label="Time until the example launch">
		{#each countdown as part (part.label)}<Card variant="outline" density="small"
				><Stack gap="sm"
					><strong class="text-3xl tabular-nums md:text-5xl"
						>{String(part.value).padStart(2, '0')}</strong
					><span class="text-xs text-neutral/60">{part.label}</span></Stack
				></Card
			>{/each}
	</div>
	<Card class="w-full max-w-md text-left" variant="outline"
		><Stack gap="lg"
			><Form
				inputs={{ email: { type: 'email', label: 'Email address', required: true } }}
				onSubmit={(values) => (email = values.email ?? '')}
				actions={[
					{ children: 'Review launch reminder', fullWidth: true, onAction: (form) => form.submit() }
				]}
			/>
			<p class="text-xs text-neutral/50">Local preview only. No reminder is scheduled.</p>
			{#if email}<p class="text-sm text-primary" role="status">
					Reminder draft for {email}.
				</p>{/if}</Stack
		></Card
	>
</section>
