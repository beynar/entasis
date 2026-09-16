<script lang="ts">
	import {
		Timeline,
		type TimelineItem,
		type TimelineVariant
	} from '$lib/components/Timeline/index.js';

	const variants: TimelineVariant[] = ['ghost', 'card', 'outline', 'soft'];
	const items: TimelineItem[] = [
		{
			id: 'draft',
			date: '09:30',
			title: 'Draft created',
			description: 'A short event with default rendering.',
			color: 'primary'
		},
		{
			id: 'review',
			date: '10:15',
			title: 'Review in progress',
			description: 'The loading state replaces the marker icon.',
			loading: true,
			color: 'info'
		}
	];
</script>

<div class="grid w-full max-w-6xl gap-8 p-2 sm:grid-cols-2">
	{#each variants as variant (variant)}
		<section>
			<p class="text-neutral/65 mb-4 font-mono text-xs font-medium tracking-wider uppercase">
				{variant}
			</p>
			<Timeline
				{items}
				{variant}
				size="small"
				density="compact"
				aria-label={`${variant} timeline variant`}
			/>
		</section>
	{/each}
</div>
