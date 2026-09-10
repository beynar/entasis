<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	const activity = [
		{ name: 'Sam Rivera', city: 'Paris', product: 'Arc mini' },
		{ name: 'Maya Chen', city: 'Berlin', product: 'Morning cup' },
		{ name: 'Alex Morgan', city: 'Oslo', product: 'Daybreak tote' }
	];
	let index = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Activity preview</p>
		<Heading size="h2" weight="bold">Good company for your good taste.</Heading>
	</header>
	<div class="flex flex-col gap-xl">
		<div
			class="flex gap-lg items-center flex-wrap px-xl py-lg w-fit max-w-full rounded-full border border-neutral/15 bg-surface-raised shadow-sm"
		>
			<Avatar size="small" user={{ name: activity[index].name }} />
			<div class="text-sm">
				<strong>{activity[index].name}</strong><span class="text-neutral/60">
					in {activity[index].city} chose
				</span><strong>{activity[index].product}</strong>
			</div>
			<Chip variant="soft" color="success" size="small">Sample</Chip>
		</div>
		<div class="flex gap-md">
			{#each activity as purchase, i (purchase.name)}<Button
					variant={index === i ? 'soft' : 'ghost'}
					size="small"
					onclick={() => (index = i)}
					aria-pressed={index === i}>Activity {i + 1}</Button
				>{/each}
		</div>
	</div>
</section>
