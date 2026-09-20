<script lang="ts">
	import { Card } from 'entasis/card';
	import { Carousel } from 'entasis/carousel';
	import { Chip } from 'entasis/chip';
	import { Meter } from 'entasis/meter';
	import { Stack } from 'entasis/stack';
	import { elevationVariables } from '$lib/tailwind/scales.js';
	import { progressColor, taskLists } from './data.js';

	// tokens:start
	// The dashboard runs on the flat elevation scale. This panel re-opens it at the `high` step so its list cards cast
	// real shadows: the carousel is the one place where content sits flush with a scroller's edge,
	// and a shadow is the honest way to see that nothing is cropped there.
	const templateStyle = Object.entries(elevationVariables('high', 'light'))
		.map(([property, value]) => `${property}:${value}`)
		.join(';');
	// tokens:end
</script>

<div style={templateStyle} class="min-w-0">
	<Carousel
		items={taskLists}
		layout={{ xs: 1, md: 2, xl: 3 }}
		navigationButton={{ color: 'neutral' }}
	>
		{#snippet children({ item })}
			<Card variant="solid" elevation={4} density="comfortable" class="h-full">
				{#snippet title()}
					<span class="gap-sm flex items-center">
						<span>{item.title}</span>
						<span class="text-neutral/70 font-normal">({item.tasks.length})</span>
					</span>
				{/snippet}
				<Stack gap="md">
					<span class="text-neutral/70 text-sm">Owned by {item.owner}</span>
					{#each item.tasks as task (task.title)}
						<Stack orientation="horizontal" align="center" gap="sm">
							<span class="min-w-0 flex-1 truncate text-sm">{task.title}</span>
							<Chip size="small" variant="outline" color="neutral" class="shrink-0">
								{task.progress}%
							</Chip>
							<Meter
								size="small"
								class="w-16 shrink-0"
								indicator={noIndicator}
								value={{
									value: task.progress,
									position: 'bottom',
									color: progressColor(task.progress)
								}}
							/>
						</Stack>
					{/each}
				</Stack>
			</Card>
		{/snippet}
	</Carousel>
</div>

<!-- `Meter` always paints an indicator label; an empty snippet is the only way to silence it. -->
{#snippet noIndicator()}{/snippet}
