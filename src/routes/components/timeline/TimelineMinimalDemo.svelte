<script lang="ts">
	import { Timeline, type TimelineItem } from '$lib/components/Timeline/index.js';

	const releases: TimelineItem[] = [
		{
			id: 'initialized',
			date: 'March 2024',
			title: 'Project initialized',
			description: 'Set up the repository and the initial architecture.'
		},
		{
			id: 'beta',
			date: 'April 2024',
			title: 'Beta release',
			description: 'Opened the product to early testers and collected feedback.'
		},
		{
			id: 'launch',
			date: 'June 2024',
			title: 'Official launch',
			description: 'Made the platform available worldwide.'
		}
	];

	const roadmap: TimelineItem[] = [
		{
			id: 'beta',
			date: 'DEC 15, 2025',
			title: 'Completed beta program',
			color: 'success'
		},
		{
			id: 'testing',
			date: 'NOV 01, 2025',
			title: 'Completed usability testing',
			color: 'secondary'
		},
		{
			id: 'design',
			date: 'OCT 15, 2025',
			title: 'Initiated design phase',
			color: 'primary'
		},
		{
			id: 'requirements',
			date: 'AUG 01, 2024',
			title: 'Completed requirements gathering',
			color: 'info'
		},
		{
			id: 'kickoff',
			date: 'JUL 15, 2024',
			title: 'Started project kickoff',
			color: 'danger'
		}
	];
</script>

<div class="grid w-full max-w-6xl gap-10 p-2 lg:grid-cols-2 lg:gap-16">
	<section>
		<p class="text-neutral/70 mb-5 text-sm font-medium">Minimal release history</p>
		<Timeline items={releases} density="comfortable" aria-label="Release history">
			{#snippet marker({ index, defaultMarker })}
				{#if index < 2}
					<span
						class="border-neutral/65 bg-surface relative z-10 size-5 rounded-full border-2 shadow-[0_0_0_3px_var(--color-surface)]"
					></span>
				{:else}
					{@render defaultMarker()}
				{/if}
			{/snippet}
		</Timeline>
	</section>

	<section>
		<p class="text-neutral/70 mb-5 text-sm font-medium">Compact roadmap</p>
		<Timeline items={roadmap} size="small" density="compact" aria-label="Product roadmap">
			{#snippet marker({ color })}
				<span
					data-color={color}
					class="bg-color relative z-10 mt-1 size-2.5 rounded-full shadow-[0_0_0_4px_var(--color-surface)]"
				></span>
			{/snippet}
		</Timeline>
	</section>
</div>
