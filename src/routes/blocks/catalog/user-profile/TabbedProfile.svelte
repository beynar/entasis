<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Timeline } from 'entasis/timeline';

	let view = $state('Projects');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="border-neutral-muted overflow-hidden rounded-lg border">
		<div class="bg-primary p-lg text-primary-contrast flex h-40 items-end">
			<p class="text-sm">Design, with a little more purpose.</p>
		</div>
		<Stack gap="xl" class="bg-surface p-lg sm:p-xl">
			<header class="gap-lg flex flex-col items-start sm:flex-row sm:flex-wrap sm:items-center">
				<Avatar name="Maya Chen" size="large" />
				<div class="flex-1">
					<h2 class="text-3xl font-semibold">Maya Chen</h2>
					<p class="mt-sm text-neutral/70 text-sm">Design lead at Northstar · London, UK</p>
				</div>
				<Chip color="success">Open to mentoring</Chip>
			</header>
			<nav
				class="gap-sm border-neutral-muted pb-lg flex flex-wrap border-b"
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
							><div class="bg-primary-muted h-28 rounded-lg"></div></Card
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
					<p class="text-neutral/65 max-w-2xl leading-relaxed">
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
