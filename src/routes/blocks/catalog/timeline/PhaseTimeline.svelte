<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Timeline } from 'entasis/timeline';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<div class="md:top-xl md:sticky md:self-start">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					How we get there
				</p>
				<Heading size="h2" weight="bold">One useful step at a time.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					A collaborative process that connects a good question to a working product.
				</p>
			</header>
		</div>
		<Timeline items={phases} variant="card" color="primary" density="comfortable"
			>{#snippet item({ item, index })}<div class="gap-lg flex flex-col">
					<Chip class="w-fit" size="small" variant="soft">Phase 0{index + 1} / {item.date}</Chip
					><Heading size="h4">{item.title}</Heading>
					<p class="text-neutral/65">{item.description}</p>
				</div>{/snippet}</Timeline
		>
	</div>
</section>
