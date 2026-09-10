<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Checkbox } from 'svelai/checkbox';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Meter } from 'svelai/meter';

	let nextId = 4;
	let draft = $state<{ title?: string }>({});
	let tasks = $state([
		{ id: 1, title: 'Review the latest design direction', done: true },
		{ id: 2, title: 'Prepare notes for the team check-in', done: false },
		{ id: 3, title: 'Send the project handoff', done: false }
	]);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-2xl"
		title="Make a little progress"
		description="A clear list for a focused day."
		><Stack gap="lg">
			<div class="flex justify-between text-sm">
				<span class="text-neutral/60"
					>{tasks.filter((task) => task.done).length} of {tasks.length} complete</span
				><Chip color="primary">Today</Chip>
			</div>
			<Meter
				value={{
					value: tasks.length ? (tasks.filter((task) => task.done).length / tasks.length) * 100 : 0,
					color: 'primary'
				}}
			/>{#each tasks as task (task)}<div
					class="flex items-center justify-between gap-md border-b border-neutral-muted pb-md"
				>
					<Checkbox
						label={task.title}
						value={task.done}
						onValueChange={(done) => (task.done = Boolean(done))}
					/><Button
						variant="ghost"
						color="danger"
						size="small"
						label={`Remove ${task.title}`}
						onclick={() => (tasks = tasks.filter((candidate) => candidate.id !== task.id))}
						>Remove</Button
					>
				</div>{:else}<p class="py-lg text-sm text-neutral/60">
					A little breathing room. Add your next task below.
				</p>{/each}<Form
				inputs={{
					title: {
						type: 'text',
						label: 'New task',
						placeholder: 'What needs to happen?',
						required: true
					}
				}}
				bind:value={draft}
				actions={[{ children: 'Add task', onAction: (form) => form.submit() }]}
				onSubmit={({ title }) => {
					tasks = [...tasks, { id: nextId++, title, done: false }];
					draft = { title: '' };
				}}
			/><Button
				variant="ghost"
				disabled={!tasks.some((task) => task.done)}
				onclick={() => (tasks = tasks.filter((task) => !task.done))}>Clear completed tasks</Button
			>
		</Stack></Card
	>
</Stack>
