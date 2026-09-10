<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Checkbox } from 'svelai/checkbox';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let filter = $state('All');
	let adding = $state(false);
	let nextId = 5;
	let tasks = $state([
		{
			id: 1,
			title: 'Resolve checkout regression',
			priority: 'High',
			done: false,
			project: 'Website'
		},
		{
			id: 2,
			title: 'Review onboarding screens',
			priority: 'Medium',
			done: false,
			project: 'Product'
		},
		{
			id: 3,
			title: 'Update component documentation',
			priority: 'Low',
			done: false,
			project: 'Design system'
		},
		{ id: 4, title: 'Share sprint notes', priority: 'Medium', done: true, project: 'Team' }
	]);
	const priorityColors: Record<string, 'danger' | 'warning' | 'neutral'> = {
		High: 'danger',
		Medium: 'warning',
		Low: 'neutral'
	};
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-center justify-between gap-lg">
		<div>
			<p class="text-sm text-primary-readable">My work / Today</p>
			<h2 class="mt-sm text-3xl font-semibold">A clear view of what matters.</h2>
		</div>
		<Button onclick={() => (adding = !adding)}>{adding ? 'Close form' : 'New task'}</Button>
	</header>
	<nav class="flex flex-wrap gap-sm" aria-label="Priority filter">
		{#each ['All', 'High', 'Medium', 'Low'] as priority (priority)}<Button
				size="small"
				variant={filter === priority ? 'soft' : 'ghost'}
				onclick={() => (filter = priority)}>{priority}</Button
			>{/each}
	</nav>
	{#if adding}<Card title="New task"
			><Form
				inputs={{
					title: { type: 'text', label: 'Task name', required: true },
					priority: {
						type: 'select',
						label: 'Priority',
						required: true,
						items: [
							{ value: 'High', label: 'High' },
							{ value: 'Medium', label: 'Medium' },
							{ value: 'Low', label: 'Low' }
						]
					}
				}}
				actions={[{ children: 'Add task', onAction: (form) => form.submit() }]}
				onSubmit={({ title, priority }) => {
					tasks = [...tasks, { id: nextId++, title, priority, done: false, project: 'Inbox' }];
					adding = false;
				}}
			/></Card
		>{/if}
	<Grid columns={{ minWidth: 220, max: 2 }} gap="lg">
		{#each ['To do', 'Complete'] as status (status)}<Card
				title={status}
				description={`${tasks.filter((task) => task.done === (status === 'Complete') && (filter === 'All' || task.priority === filter)).length} tasks`}
				><Stack gap="md">
					{#each tasks.filter((task) => task.done === (status === 'Complete') && (filter === 'All' || task.priority === filter)) as task (task)}<Stack
							gap="md"
							class="rounded-lg bg-surface-recessed p-md"
						>
							<Checkbox
								label={task.title}
								value={task.done}
								onValueChange={(done) => (task.done = Boolean(done))}
							/>
							<div class="flex justify-between gap-md">
								<span class="text-xs text-neutral/60">{task.project}</span><Chip
									size="small"
									color={priorityColors[task.priority]}>{task.priority}</Chip
								>
							</div>
						</Stack>{:else}<p class="p-lg text-sm text-neutral/60">No tasks in this view.</p>{/each}
				</Stack></Card
			>{/each}
	</Grid>
</Stack>
