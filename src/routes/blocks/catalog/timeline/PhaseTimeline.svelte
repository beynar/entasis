<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Timeline } from 'svelai/timeline';
	import { Chip } from 'svelai/chip';
	const phases = [
		{
			title: 'Discover',
			date: 'Week 01',
			description: 'Listen, ask useful questions, and agree on the problem worth solving.'
		},
		{
			title: 'Define',
			date: 'Week 02',
			description: 'Turn the findings into a clear direction and a small set of design principles.'
		},
		{
			title: 'Create',
			date: 'Weeks 03–05',
			description: 'Explore the interface in real flows, test the details, and build together.'
		},
		{
			title: 'Deliver',
			date: 'Week 06',
			description: 'Ship a useful first version, observe what happens, and keep learning.'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<div class="md:sticky md:top-xl md:self-start">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">How we get there</p>
				<Heading size="h2" weight="bold">One useful step at a time.</Heading>
				<p class="max-w-2xl text-neutral/65">
					A collaborative process that connects a good question to a working product.
				</p>
			</header>
		</div>
		<Timeline items={phases} variant="card" color="primary" density="large"
			>{#snippet item({ item, index })}<div class="flex flex-col gap-lg">
					<Chip class="w-fit" size="small" variant="soft">Phase 0{index + 1} / {item.date}</Chip
					><Heading size="h4">{item.title}</Heading>
					<p class="text-neutral/65">{item.description}</p>
				</div>{/snippet}</Timeline
		>
	</div>
</section>
