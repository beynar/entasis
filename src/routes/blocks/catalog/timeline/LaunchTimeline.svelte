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
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			From idea to launch
		</p>
		<Heading size="h2" weight="bold">A clear path through the work.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			Six focused weeks, with room for the questions that matter.
		</p>
	</header>
	<Chip variant="soft" class="w-fit">A sample project plan</Chip><Timeline
		items={phases}
		orientation="horizontal"
		variant="outline"
		color="primary"
		density="comfortable"
	/>
</section>
