<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Dialog } from 'svelai/dialog';
	import { Switch } from 'svelai/switch';

	let category = $state('All');
	let tools = $state([
		{
			name: 'Figma',
			category: 'Design',
			description: 'Design files and comments.',
			enabled: true,
			notifications: true
		},
		{
			name: 'GitHub',
			category: 'Development',
			description: 'Issues and code reviews.',
			enabled: false,
			notifications: false
		},
		{
			name: 'Slack',
			category: 'Communication',
			description: 'Team messages and project updates.',
			enabled: true,
			notifications: true
		},
		{
			name: 'Linear',
			category: 'Development',
			description: 'Issues and project planning.',
			enabled: false,
			notifications: true
		}
	]);
	let selected = $state<(typeof tools)[number] | null>(null);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<p class="text-primary-readable text-sm">Workspace settings</p>
		<h2 class="mt-sm text-3xl font-semibold">Tools that work together.</h2>
	</header>
	<div class="gap-xl grid md:grid-cols-[12rem_1fr]">
		<nav class="gap-xs grid content-start" aria-label="Integration categories">
			{#each ['All', 'Design', 'Development', 'Communication'] as name (name)}<Button
					variant={category === name ? 'soft' : 'ghost'}
					onclick={() => (category = name)}>{name}</Button
				>{/each}
		</nav>
		<Stack gap="lg">
			{#each tools.filter((tool) => category === 'All' || tool.category === category) as tool (tool)}<Card
					><div
						class="gap-md flex flex-col items-start justify-between sm:flex-row sm:items-center"
					>
						<div class="gap-md flex items-center">
							<span
								class="bg-surface-recessed grid size-12 place-items-center rounded-lg font-semibold"
								>{tool.name.slice(0, 1)}</span
							>
							<div>
								<strong>{tool.name}</strong>
								<p class="text-neutral/70 text-sm">{tool.description}</p>
							</div>
						</div>
						<Button variant="outline" size="small" onclick={() => (selected = tool)}
							>Configure</Button
						>
					</div></Card
				>{/each}
		</Stack>
	</div>
	<Dialog
		open={selected !== null}
		onOpenChange={(open) => {
			if (!open) selected = null;
		}}
		type="drawerRight"
		title={selected ? `${selected.name} settings` : 'Integration settings'}
		description="Preferences apply only to this local preview."
		>{#if selected}<Stack gap="lg">
				<Switch label="Enable integration preview" bind:value={selected.enabled} /><Switch
					label="Include project notifications"
					bind:value={selected.notifications}
				/><Alert
					color="info"
					title="Preview configuration"
					description="No provider account is connected and no data is synced."
				/>
			</Stack>{/if}</Dialog
	>
</Stack>
