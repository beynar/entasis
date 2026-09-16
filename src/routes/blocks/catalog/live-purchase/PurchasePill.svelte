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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Activity preview
		</p>
		<Heading size="h2" weight="bold">Good company for your good taste.</Heading>
	</header>
	<div class="gap-xl flex flex-col">
		<div
			class="gap-lg px-xl py-lg border-neutral/15 bg-surface-raised flex w-fit max-w-full flex-wrap items-center rounded-full border shadow-sm"
		>
			<Avatar size="small" name={activity[index].name} />
			<div class="text-sm">
				<strong>{activity[index].name}</strong><span class="text-neutral/70">
					in {activity[index].city} chose
				</span><strong>{activity[index].product}</strong>
			</div>
			<Chip variant="soft" color="success" size="small">Sample</Chip>
		</div>
		<div class="gap-md flex">
			{#each activity as purchase, i (purchase.name)}<Button
					variant={index === i ? 'soft' : 'ghost'}
					size="small"
					onclick={() => (index = i)}
					pressed={index === i}>Activity {i + 1}</Button
				>{/each}
		</div>
	</div>
</section>
