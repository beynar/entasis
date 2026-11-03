<script lang="ts">
	import { Card } from 'entasis/card';
	import { Timeline, type TimelineItem } from 'entasis/timeline';

	type RunStep = TimelineItem & {
		id: string;
		title: string;
		summary: string;
		duration: string;
	};

	const steps: RunStep[] = [
		{
			id: 'fetch',
			title: 'Fetch sources',
			description: '12 s',
			progress: 'done',
			summary: 'Pulled 3 repositories and 418 files from the default branches.',
			duration: '12 s'
		},
		{
			id: 'index',
			title: 'Index',
			description: '48 s',
			progress: 'done',
			summary: 'Built the symbol index: 9,204 symbols across 6 languages.',
			duration: '48 s'
		},
		{
			id: 'analyze',
			title: 'Analyze',
			description: 'Running',
			progress: 'current',
			summary: 'Checking call sites against the new API. 61 of 140 modules done.',
			duration: '2 min so far'
		},
		{
			id: 'report',
			title: 'Report',
			progress: 'upcoming',
			summary: 'Writes the findings once the analysis ends.',
			duration: 'Not started'
		},
		{
			id: 'publish',
			title: 'Publish',
			progress: 'upcoming',
			disabled: true,
			summary: 'Publishing needs an approved report.',
			duration: 'Not started'
		}
	];

	let selected = $state<string | number | undefined>('analyze');
	const step = $derived(steps.find((candidate) => candidate.id === selected));
</script>

<div class="gap-lg grid w-full max-w-5xl p-2">
	<Timeline
		items={steps}
		orientation="horizontal"
		color="primary"
		density="compact"
		selectable
		bind:value={selected}
		aria-label="Run steps"
	/>

	{#if step}
		<Card variant="outline" density="compact">
			{#snippet title()}{step.title}{/snippet}
			{#snippet description()}{step.duration}{/snippet}
			{step.summary}
		</Card>
	{/if}
</div>
