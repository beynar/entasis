<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Timeline } from 'entasis/timeline';

	let expanded = $state('GitHub');
	let tools = $state([
		{
			name: 'GitHub',
			account: 'northstar-studio / 4 repositories',
			connected: true,
			activity: ['Pull request #128 linked to a project', 'Issue #84 marked as complete']
		},
		{
			name: 'Slack',
			account: 'Northstar team / #project-updates',
			connected: true,
			activity: ['Daily project digest delivered', 'New milestone notification prepared']
		},
		{
			name: 'Figma',
			account: 'Northstar Design / 12 files',
			connected: true,
			activity: ['Website exploration updated', 'Three review comments synced']
		}
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-end justify-between">
		<div>
			<h2 class="text-3xl font-semibold">Your connected workspace</h2>
			<p class="mt-sm text-neutral/70 text-sm">Sample integration health and recent activity.</p>
		</div>
		<Chip color="success">{tools.filter((tool) => tool.connected).length} enabled in demo</Chip>
	</header>
	{#each tools as tool (tool)}<Card
			><Stack gap="lg">
				<div class="gap-lg flex flex-wrap items-center justify-between">
					<div>
						<h3 class="font-semibold">{tool.name}</h3>
						<p class="mt-xs text-neutral/70 text-sm">{tool.account}</p>
					</div>
					<Stack orientation="horizontal" wrap="wrap" gap="sm">
						<Button
							size="small"
							variant="ghost"
							onclick={() => (expanded = expanded === tool.name ? '' : tool.name)}
							>{expanded === tool.name ? 'Hide activity' : 'View activity'}</Button
						><Button
							size="small"
							variant="outline"
							onclick={() => (tool.connected = !tool.connected)}
							>{tool.connected ? 'Disconnect demo' : 'Reconnect demo'}</Button
						>
					</Stack>
				</div>
				{#if expanded === tool.name}<Timeline
						items={tool.activity.map((title, index) => ({
							id: String(index),
							title,
							date: index === 0 ? 'Today' : 'Yesterday'
						}))}
						density="compact"
					/>{/if}
				<div class="gap-sm flex flex-wrap items-center">
					<Chip color={tool.connected ? 'success' : 'neutral'} size="small"
						>{tool.connected ? 'Healthy (sample)' : 'Disconnected (demo)'}</Chip
					><span class="text-neutral/70 text-xs">No live provider connection</span>
				</div>
			</Stack></Card
		>{/each}
</Stack>
