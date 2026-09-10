<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Timeline } from 'svelai/timeline';

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

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<h2 class="text-3xl font-semibold">Your connected workspace</h2>
			<p class="mt-sm text-sm text-neutral/60">Sample integration health and recent activity.</p>
		</div>
		<Chip color="success">{tools.filter((tool) => tool.connected).length} enabled in demo</Chip>
	</header>
	{#each tools as tool (tool)}<Card
			><Stack gap="lg">
				<div class="flex flex-wrap items-center justify-between gap-lg">
					<div>
						<h3 class="font-semibold">{tool.name}</h3>
						<p class="mt-xs text-sm text-neutral/60">{tool.account}</p>
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
						density="small"
					/>{/if}
				<div class="flex flex-wrap items-center gap-sm">
					<Chip color={tool.connected ? 'success' : 'neutral'} size="small"
						>{tool.connected ? 'Healthy (sample)' : 'Disconnected (demo)'}</Chip
					><span class="text-xs text-neutral/60">No live provider connection</span>
				</div>
			</Stack></Card
		>{/each}
</Stack>
