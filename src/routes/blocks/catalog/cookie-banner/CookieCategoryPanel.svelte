<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Switch } from 'svelai/switch';
	let analytics = $state(false);
	let personalization = $state(false);
	let saved = $state(false);
</script>

<section class="bg-surface-recessed p-lg md:p-xl">
	<Card variant="outline"
		><Stack gap="xl"
			><div class="flex flex-wrap items-start justify-between gap-lg">
				<div class="max-w-2xl">
					<Heading as="h2" size="h3">Make yourself comfortable.</Heading>
					<p class="mt-lg text-neutral/70">
						We use essential cookies to make the site work. You decide whether the optional
						categories are useful to you.
					</p>
				</div>
				<Chip variant="outline">Privacy preferences</Chip>
			</div>
			<div class="grid gap-md md:grid-cols-3">
				<div class="flex flex-col gap-md rounded-lg bg-surface-recessed p-lg">
					<Switch label="Essential" value={true} disabled />
					<p class="text-sm text-neutral/60">Security, navigation, and your saved choices.</p>
				</div>
				<div class="flex flex-col gap-md rounded-lg bg-surface-recessed p-lg">
					<Switch label="Analytics" bind:value={analytics} />
					<p class="text-sm text-neutral/60">Understand visits and improve the experience.</p>
				</div>
				<div class="flex flex-col gap-md rounded-lg bg-surface-recessed p-lg">
					<Switch label="Personalization" bind:value={personalization} />
					<p class="text-sm text-neutral/60">Remember the content and settings you prefer.</p>
				</div>
			</div>
			<div class="flex flex-wrap justify-between gap-md">
				<p class="self-center text-sm text-neutral/60" role="status">
					{saved ? 'Your preview choices have been updated.' : 'Optional categories start off.'}
				</p>
				<div class="flex flex-wrap gap-sm">
					<Button
						variant="outline"
						onclick={() => {
							analytics = false;
							personalization = false;
							saved = true;
						}}>Reject optional</Button
					><Button onclick={() => (saved = true)}>Save my choices</Button>
				</div>
			</div></Stack
		></Card
	>
</section>
