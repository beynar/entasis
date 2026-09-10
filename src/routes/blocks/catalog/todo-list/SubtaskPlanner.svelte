<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Accordion } from 'svelai/accordion';
	import { Checkbox } from 'svelai/checkbox';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Meter } from 'svelai/meter';

	let projects = $state([
		{
			id: 'website',
			title: 'Launch the new website',
			tasks: [
				{ title: 'Agree on the story', done: true },
				{ title: 'Review the final designs', done: true },
				{ title: 'Run accessibility checks', done: false },
				{ title: 'Publish the release', done: false }
			]
		},
		{
			id: 'research',
			title: 'Understand first-time users',
			tasks: [
				{ title: 'Recruit five participants', done: true },
				{ title: 'Run the interviews', done: false },
				{ title: 'Share findings with the team', done: false }
			]
		},
		{
			id: 'system',
			title: 'Refresh the design system',
			tasks: [
				{ title: 'Audit the current components', done: true },
				{ title: 'Update shared patterns', done: false }
			]
		}
	]);
	let total = $derived(projects.reduce((sum, project) => sum + project.tasks.length, 0));
	let completed = $derived(
		projects.reduce((sum, project) => sum + project.tasks.filter((task) => task.done).length, 0)
	);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header>
		<Chip color="primary">Project checklist</Chip>
		<h2 class="mt-lg text-3xl font-semibold">Big work. Smaller steps.</h2>
		<p class="mt-sm text-sm text-neutral/60">{completed} of {total} steps complete</p>
	</header>
	<Meter value={{ value: total ? (completed / total) * 100 : 0, color: 'primary' }} /><Accordion
		items={projects}
		oneAtATime
		variant="outlined"
		defaultValue={['website']}
		>{#snippet title({ item })}<div class="flex flex-wrap items-center justify-between gap-md">
				<strong>{item.title}</strong><Chip
					size="small"
					color={item.tasks.every((task) => task.done) ? 'success' : 'neutral'}
					>{item.tasks.filter((task) => task.done).length}/{item.tasks.length}</Chip
				>
			</div>{/snippet}{#snippet content({ item })}<Stack gap="lg">
				{#each item.tasks as task (task)}<Checkbox
						label={task.title}
						value={task.done}
						onValueChange={(done) => (task.done = Boolean(done))}
					/>{/each}<Form
					inputs={{ title: { type: 'text', label: `Add a step to ${item.title}`, required: true } }}
					actions={[
						{
							children: 'Add step',
							variant: 'outline',
							size: 'small',
							onAction: (form) => form.submit()
						}
					]}
					onSubmit={({ title }) => (item.tasks = [...item.tasks, { title, done: false }])}
				/>
			</Stack>{/snippet}</Accordion
	>
</Stack>
