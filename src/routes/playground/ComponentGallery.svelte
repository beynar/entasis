<script lang="ts">
	import Accordion from '$lib/components/Accordion/Accordion.svelte';
	import Alert from '$lib/components/Alert/Alert.svelte';
	import { Stat } from '$lib/components/Stat/index.js';
	import { Table, type TableRow } from '$lib/components/Table/index.js';

	const accordionItems = [
		{
			title: 'Runtime tokens',
			description: 'Spacing, radius, and typography',
			content: 'Every utility keeps its class while the underlying CSS variables change.'
		},
		{
			title: 'Component density',
			description: 'Local structure, global scale',
			content: 'Density variants choose classes; the runtime spacing token scales their values.'
		},
		{
			title: 'Color themes',
			description: 'Independent semantic palette',
			content: 'Light and dark colors continue to switch through the existing theme variables.'
		}
	];

	const activityRows: TableRow[] = [
		{ cells: { member: 'Ari Martin', event: 'Published report', time: '2m ago' } },
		{ cells: { member: 'Sam Lee', event: 'Updated roadmap', time: '18m ago' } },
		{ cells: { member: 'Noa Chen', event: 'Invited 3 members', time: '1h ago' } }
	];
</script>

<div class="gap-layout-md grid">
	<div class="gap-lg grid">
		<h2 class="text-xl font-semibold">Dashboard components</h2>
		<div class="gap-lg grid sm:grid-cols-3">
			<Stat label="Revenue" value="$45.2k" trend="+12.4%" trendDirection="up" />
			<Stat label="Active users" value="8,492" trend="+8.1%" trendDirection="up" />
			<Stat
				label="Response time"
				value="184ms"
				trend="-24ms"
				trendDirection="down"
				indicatorColor="info"
			/>
		</div>
	</div>

	<div class="gap-xl grid lg:grid-cols-2">
		<div class="gap-lg grid content-start">
			<h2 class="text-xl font-semibold">Status</h2>
			<div class="gap-lg grid">
				<Alert
					variant="soft"
					color="success"
					title="Theme published"
					description="The runtime token configuration is active."
				/>
				<Alert
					variant="soft"
					color="info"
					title="No rebuild required"
					description="Existing utilities resolve against the new values."
				/>
			</div>
		</div>

		<div class="gap-lg grid content-start">
			<h2 class="text-xl font-semibold">Details</h2>
			<div class="border-neutral-muted bg-surface p-xl rounded-lg border">
				<Accordion items={accordionItems} />
			</div>
		</div>
	</div>

	<div class="gap-lg grid">
		<h2 class="text-xl font-semibold">Recent activity</h2>
		<div class="border-neutral-muted bg-surface overflow-hidden rounded-lg border">
			<Table
				header={{ member: 'Member', event: 'Event', time: 'Time' }}
				items={activityRows}
				density="normal"
			/>
		</div>
	</div>
</div>
