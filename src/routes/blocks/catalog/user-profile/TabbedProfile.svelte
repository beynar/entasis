<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Timeline } from 'svelai/timeline';

	let view = $state('Projects');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="overflow-hidden rounded-lg border border-neutral-muted">
		<div class="flex h-40 items-end bg-primary p-lg text-primary-contrast">
			<p class="text-sm">Design, with a little more purpose.</p>
		</div>
		<Stack gap="xl" class="bg-surface p-lg sm:p-xl">
			<header class="flex flex-col items-start gap-lg sm:flex-row sm:flex-wrap sm:items-center">
				<Avatar user={{ name: 'Maya Chen' }} size="large" />
				<div class="flex-1">
					<h2 class="text-3xl font-semibold">Maya Chen</h2>
					<p class="mt-sm text-sm text-neutral/60">Design lead at Northstar · London, UK</p>
				</div>
				<Chip color="success">Open to mentoring</Chip>
			</header>
			<nav
				class="flex flex-wrap gap-sm border-b border-neutral-muted pb-lg"
				aria-label="Profile sections"
			>
				{#each ['Projects', 'Activity', 'About'] as section (section)}<Button
						variant={view === section ? 'soft' : 'ghost'}
						onclick={() => (view = section)}>{section}</Button
					>{/each}
			</nav>
			{#if view === 'Projects'}<Grid columns={{ minWidth: 220, max: 2 }} gap="lg">
					{#each [{ title: 'A calmer onboarding', description: 'Helping new teams get started with confidence.' }, { title: 'A shared design language', description: 'A system that gives teams room to create.' }] as project (project)}<Card
							title={project.title}
							description={project.description}
							><div class="h-28 rounded-lg bg-primary-muted"></div></Card
						>{/each}
				</Grid>{:else if view === 'Activity'}<Timeline
					items={[
						{
							id: 'review',
							title: 'Published a design review',
							description: 'Shared the next iteration of the onboarding flow.',
							date: 'Today'
						},
						{
							id: 'mentor',
							title: 'Mentored a new designer',
							description: 'A session on clear product storytelling.',
							date: 'Yesterday'
						},
						{
							id: 'launch',
							title: 'Launched the component library',
							description: 'A more consistent foundation for the whole team.',
							date: 'Last week'
						}
					]}
				/>{:else}<Stack gap="lg">
					<h3 class="text-xl font-semibold">Make useful things. Stay curious.</h3>
					<p class="max-w-2xl leading-relaxed text-neutral/65">
						I’m a design lead who cares about clear thinking, thoughtful craft, and helping teams do
						their best work. Outside work, you’ll find me walking, reading, or making something with
						my hands.
					</p>
					<Stack orientation="horizontal" wrap="wrap" gap="sm">
						{#each ['Product design', 'Design systems', 'Research', 'Mentoring'] as skill (skill)}<Chip
								>{skill}</Chip
							>{/each}
					</Stack>
				</Stack>{/if}
		</Stack>
	</div>
</Stack>
