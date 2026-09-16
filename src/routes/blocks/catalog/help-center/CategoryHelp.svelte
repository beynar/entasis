<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Accordion } from 'svelai/accordion';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { houseIcon } from 'svelai/icons/house';
	import { usersIcon } from 'svelai/icons/users';
	import { folderIcon } from 'svelai/icons/folder';
	const categories = [
		{
			title: 'Getting started',
			description: 'The basics for a confident beginning.',
			icon: houseIcon,
			articles: [
				{
					title: 'Create your first project',
					content:
						'Start from your workspace overview, choose New project, and give your project a clear name and owner.'
				},
				{
					title: 'Make yourself at home',
					content:
						'Set your display name, timezone, and notification preferences from your profile settings.'
				}
			]
		},
		{
			title: 'Your team',
			description: 'Bring people and work together.',
			icon: usersIcon,
			articles: [
				{
					title: 'Invite a teammate',
					content:
						'Open Members in workspace settings. Add an email address and choose an appropriate role.'
				},
				{
					title: 'Understand permissions',
					content:
						'Admins manage the workspace, editors create content, and viewers read and comment.'
				}
			]
		},
		{
			title: 'Projects and workflows',
			description: 'Keep useful work moving forward.',
			icon: folderIcon,
			articles: [
				{
					title: 'Organize project work',
					content:
						'Group related tasks, assign clear owners, and use milestones to track the outcome.'
				},
				{
					title: 'Archive completed work',
					content:
						'Completed projects can be archived from their settings and restored whenever needed.'
				}
			]
		}
	];
	let selected = $state<(typeof categories)[number] | null>(null);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="bg-primary-muted p-xl rounded-lg text-center">
		<Chip color="primary" variant="solid">Northstar help center</Chip>
		<h2 class="mt-lg text-4xl font-semibold">A little guidance goes a long way.</h2>
		<p class="mt-md text-neutral/65">Find your footing, build your workflow, and keep moving.</p>
	</header>
	{#if selected}<Stack gap="lg">
			<Button class="w-fit" variant="ghost" onclick={() => (selected = null)}
				>← All categories</Button
			>
			<h3 class="text-2xl font-semibold">{selected.title}</h3>
			<Accordion items={selected.articles} oneAtATime variant="outline" />
		</Stack>{:else}<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
			{#each categories as category (category)}<Card
					title={category.title}
					description={category.description}
					><Stack gap="lg">
						<div class="text-primary-readable text-3xl">{@render category.icon()}</div>
						<Button variant="outline" onclick={() => (selected = category)}
							>Browse {category.articles.length} articles</Button
						>
					</Stack></Card
				>{/each}
		</Grid>{/if}
</Stack>
