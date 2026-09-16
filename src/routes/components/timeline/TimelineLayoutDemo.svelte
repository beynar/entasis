<script lang="ts">
	import { Timeline, type TimelineItem } from '$lib/components/Timeline/index.js';

	const alternateItems: TimelineItem[] = [
		{
			id: 'research',
			date: 'Week 1',
			title: 'Research',
			description: 'Map the problem and verify the constraints.',
			color: 'info'
		},
		{
			id: 'prototype',
			date: 'Week 2',
			title: 'Prototype',
			description: 'Test the smallest coherent interaction.',
			color: 'secondary'
		},
		{
			id: 'ship',
			date: 'Week 3',
			title: 'Ship',
			description: 'Release the validated result.',
			color: 'success'
		}
	];

	const horizontalItems: TimelineItem[] = [
		{ id: 'brief', date: '08:00', title: 'Brief', color: 'neutral' },
		{ id: 'sketch', date: '09:30', title: 'Sketch', color: 'info' },
		{ id: 'build', date: '11:00', title: 'Build', color: 'primary' },
		{ id: 'review', date: '14:00', title: 'Review', color: 'warning' },
		{ id: 'release', date: '16:30', title: 'Release', color: 'success' },
		{ id: 'observe', date: '18:00', title: 'Observe', color: 'secondary' }
	];
</script>

<div class="grid w-full max-w-6xl gap-12 p-2">
	<section>
		<div class="mb-5">
			<p class="text-neutral font-medium">Automatic narrow collapse</p>
			<p class="text-neutral/70 mt-1 text-sm">
				The alternate layout collapses to one rail from its own container width.
			</p>
		</div>

		<div class="w-full max-w-[34rem]">
			<Timeline
				items={alternateItems}
				placement="alternate"
				variant="card"
				aria-label="Narrow alternating timeline"
			/>
		</div>
	</section>

	<section>
		<div class="mb-5">
			<p class="text-neutral font-medium">Horizontal overflow</p>
			<p class="text-neutral/70 mt-1 text-sm">
				Scroll the focused timeline horizontally; the edge fade appears only when needed.
			</p>
		</div>

		<div class="w-full max-w-2xl">
			<Timeline
				items={horizontalItems}
				orientation="horizontal"
				placement="alternate"
				variant="soft"
				density="normal"
				scrollFade
				aria-label="Horizontal project timeline"
			/>
		</div>
	</section>
</div>
