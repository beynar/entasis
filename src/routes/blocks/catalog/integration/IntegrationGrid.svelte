<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { calendarIcon } from 'svelai/icons/calendar';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { cloudIcon } from 'svelai/icons/cloud';
	import { fileTextIcon } from 'svelai/icons/fileText';
	import { gitBranchIcon } from 'svelai/icons/gitBranch';
	let selected = $state('');
	const integrations = [
		{
			name: 'Calendar',
			category: 'Planning',
			description: 'Keep milestones close to the time set aside for them.',
			icon: calendarIcon
		},
		{
			name: 'Team chat',
			category: 'Communication',
			description: 'Bring the right update into the right conversation.',
			icon: chatCircleIcon
		},
		{
			name: 'Cloud storage',
			category: 'Files',
			description: 'Give the latest version a clear, shared home.',
			icon: cloudIcon
		},
		{
			name: 'Code repository',
			category: 'Engineering',
			description: 'Connect a release to the work that made it possible.',
			icon: gitBranchIcon
		},
		{
			name: 'Analytics',
			category: 'Insights',
			description: 'Use the signals that help your team make a decision.',
			icon: chartBarIcon
		},
		{
			name: 'Documents',
			category: 'Knowledge',
			description: 'Keep the brief and the working notes within reach.',
			icon: fileTextIcon
		}
	];
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="max-w-2xl">
		<Chip variant="outline">Connected by design</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Bring the tools you already know.</Heading
		>
		<p class="mt-lg text-neutral/70">
			Explore how different parts of a workspace can fit together.
		</p>
	</div>
	<div class="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
		{#each integrations as integration (integration.name)}<Card variant="outline"
				><Stack gap="lg"
					><div class="flex items-center justify-between gap-lg">
						<span class="text-primary">{@render integration.icon({ size: 30 })}</span><Chip
							size="small"
							variant="outline">{integration.category}</Chip
						>
					</div>
					<Heading as="h3" size="h4">{integration.name}</Heading>
					<p class="text-sm text-neutral/70">{integration.description}</p>
					<Button variant="link" class="self-start" onclick={() => (selected = integration.name)}
						>View connection</Button
					></Stack
				></Card
			>{/each}
	</div>
	{#if selected}<Card variant="soft" color="primary" title={selected + ' connection'}
			><Stack gap="lg"
				><p>
					This example connects project updates to the selected workspace tool. A real connection
					would require permission from its account owner.
				</p>
				<Button variant="outline" class="self-start" onclick={() => (selected = '')}
					>Close details</Button
				></Stack
			></Card
		>{/if}
</section>
