<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Table } from 'svelai/table';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	const features = [
		['A common design language', 'Included', 'Define and maintain'],
		['Accessible interaction patterns', 'Shared primitives', 'Build for each control'],
		['Color and geometry', 'One theme', 'Individual styles'],
		['Component examples', 'Ready to explore', 'Create your own'],
		['Your product identity', 'Fully yours', 'Fully yours']
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<div class="max-w-2xl">
		<Chip class="mb-lg" variant="outline">A considered choice</Chip><Heading
			as="h2"
			size="h2"
			weight="bold">A little less setup. A lot more progress.</Heading
		>
		<p class="mt-lg text-neutral/70">
			Compare two example approaches to building your next interface.
		</p>
	</div>
	<div class="border-neutral-muted overflow-x-auto rounded-lg border">
		<Table
			header={{
				feature: 'What matters',
				northstar: { content: 'With a shared system', class: 'bg-primary-muted' },
				custom: 'Starting from scratch'
			}}
			items={features.map((feature) => ({
				cells: {
					feature: feature[0],
					northstar: { content: feature[1], class: 'bg-primary-muted font-medium' },
					custom: feature[2]
				}
			}))}
		/>
	</div>
	<Button href="/components" class="self-start" suffix={arrowRightIcon}
		>Explore the building blocks</Button
	>
</section>
