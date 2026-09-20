<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { TextInput } from 'entasis/text-input';

	let query = $state<string | null>('');
	let tools = $state([
		{
			name: 'Slack',
			category: 'Communication',
			description: 'Keep conversations connected to your work.',
			connected: true
		},
		{
			name: 'GitHub',
			category: 'Development',
			description: 'Bring issues and pull requests into view.',
			connected: false
		},
		{
			name: 'Figma',
			category: 'Design',
			description: 'Keep designs close to the decisions.',
			connected: true
		},
		{
			name: 'Linear',
			category: 'Projects',
			description: 'Connect projects, issues, and roadmaps.',
			connected: false
		},
		{
			name: 'Google Drive',
			category: 'Files',
			description: 'Find the right document in one place.',
			connected: false
		},
		{
			name: 'Notion',
			category: 'Knowledge',
			description: 'Make team knowledge easier to find.',
			connected: false
		}
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<h2 class="text-3xl font-semibold">A little more connected.</h2>
		<p class="mt-sm text-neutral/70 text-sm">
			Bring your tools into one workspace. Connection states are local demonstrations.
		</p>
	</header>
	<TextInput label="Search integrations" placeholder="Find a tool" bind:value={query} />
	<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
		{#each tools.filter((tool) => (tool.name + ' ' + tool.category)
				.toLowerCase()
				.includes((query ?? '').toLowerCase())) as tool (tool)}<Card
				title={tool.name}
				description={tool.description}
				><Stack gap="lg">
					<div class="gap-md flex flex-wrap items-center justify-between">
						<span
							class="bg-primary-muted grid size-12 place-items-center rounded-lg text-lg font-semibold"
							>{tool.name.slice(0, 1)}</span
						><Chip color={tool.connected ? 'success' : 'neutral'}
							>{tool.connected ? 'Enabled in demo' : tool.category}</Chip
						>
					</div>
					<Button
						variant={tool.connected ? 'outline' : 'solid'}
						onclick={() => (tool.connected = !tool.connected)}
						>{tool.connected ? 'Disable demo' : 'Enable demo'}</Button
					>
				</Stack></Card
			>{:else}<p class="text-neutral/70 text-sm">No tools match your search.</p>{/each}
	</Grid>
</Stack>
