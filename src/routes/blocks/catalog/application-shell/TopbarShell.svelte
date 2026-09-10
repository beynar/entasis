<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { TextInput } from 'svelai/text-input';
	import { Timeline } from 'svelai/timeline';

	let active = $state('Projects');
	let query = $state<string | null>('');
	const projects = [
		{
			name: 'Website redesign',
			description: 'A clearer story for our product.',
			tasks: 18,
			status: 'In progress'
		},
		{
			name: 'Mobile experience',
			description: 'A little more useful on the go.',
			tasks: 12,
			status: 'Planning'
		},
		{
			name: 'Design system',
			description: 'Shared foundations for everyone.',
			tasks: 24,
			status: 'In review'
		}
	];
</script>

<section class="min-h-screen bg-surface-canvas text-neutral">
	<header
		class="flex flex-wrap items-center justify-between gap-lg border-b border-neutral-muted bg-surface p-lg"
	>
		<strong class="text-xl">N / Northstar</strong>
		<nav class="flex flex-wrap gap-xs" aria-label="Workspace views">
			{#each ['Projects', 'Activity', 'Team'] as tab (tab)}<Button
					variant={active === tab ? 'soft' : 'ghost'}
					onclick={() => (active = tab)}>{tab}</Button
				>{/each}
		</nav>
		<Avatar user={{ name: 'Alex Morgan' }} />
	</header>
	<Stack as="main" gap="xl" class="mx-auto max-w-6xl p-lg sm:p-xl">
		<div class="flex flex-wrap items-end justify-between gap-lg">
			<div>
				<p class="text-sm text-neutral/60">Design workspace</p>
				<h2 class="mt-sm text-3xl font-semibold">{active}</h2>
			</div>
			<Chip color="success">Everything is up to date</Chip>
		</div>
		{#if active === 'Projects'}<TextInput
				label="Find a project"
				placeholder="Search projects"
				bind:value={query}
			/>
			<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
				{#each projects.filter((project) => project.name
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as project (project)}<Card
						title={project.name}
						description={project.description}
						><Stack gap="md">
							<div class="h-24 rounded-lg bg-primary-muted"></div>
							<div class="flex justify-between text-sm">
								<span>{project.tasks} tasks</span><Chip size="small">{project.status}</Chip>
							</div>
						</Stack></Card
					>{:else}<p class="text-neutral/60">No projects match your search.</p>{/each}
			</Grid>{:else if active === 'Activity'}<Timeline
				items={[
					{
						id: 'one',
						title: 'Website direction approved',
						description: 'Maya completed the design review.',
						date: '10 minutes ago'
					},
					{
						id: 'two',
						title: 'Three new tasks assigned',
						description: 'Sam updated the mobile project.',
						date: '1 hour ago'
					},
					{
						id: 'three',
						title: 'Sprint planning complete',
						description: 'The next two weeks are ready.',
						date: '2 hours ago'
					}
				]}
			/>{:else}<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
				{#each ['Maya Chen', 'Sam Rivera', 'Alex Morgan'] as name (name)}<Card
						title={name}
						description="Product team"><Avatar user={{ name }} size="large" /></Card
					>{/each}
			</Grid>{/if}
	</Stack>
</section>
