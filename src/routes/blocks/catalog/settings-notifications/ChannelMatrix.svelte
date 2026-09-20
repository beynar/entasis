<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { DataTable } from 'entasis/data-table';
	import { Switch } from 'entasis/switch';

	let message = $state('');
	let quiet = $state(false);
	let preferences = $state([
		{ event: 'Mentions and replies', email: true, inApp: true },
		{ event: 'Task assignments', email: true, inApp: true },
		{ event: 'Project updates', email: false, inApp: true },
		{ event: 'Weekly digest', email: true, inApp: false }
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<h2 class="text-3xl font-semibold">The right update, in the right place.</h2>
		<p class="mt-sm text-neutral/70 text-sm">Decide how each kind of activity reaches you.</p>
	</header>
	<Card
		><DataTable
			items={preferences}
			columns={[
				{ id: 'event', accessor: 'event', header: 'Activity', width: 140 },
				{ id: 'email', accessor: 'email', header: 'Email', width: 92, minWidth: 92 },
				{ id: 'inApp', accessor: 'inApp', header: 'In-app', width: 92, minWidth: 92 }
			]}
			getRowId={(preference) => preference.event}
			pagination={false}
			caption="Notification channels"
			>{#snippet cell(payload)}{#if payload.columnId === 'email'}<Switch
						label={`Email: ${payload.row.event}`}
						value={payload.row.email}
						onValueChange={(value) => (payload.row.email = Boolean(value))}
					/>{:else if payload.columnId === 'inApp'}<Switch
						label={`In-app: ${payload.row.event}`}
						value={payload.row.inApp}
						onValueChange={(value) => (payload.row.inApp = Boolean(value))}
					/>{:else}<span class="whitespace-normal">{payload.row.event}</span
					>{/if}{/snippet}</DataTable
		></Card
	><Card title="Quiet hours" description="Protect time for focused work."
		><Stack gap="lg">
			<Switch label="Pause notifications outside working hours" bind:value={quiet} />{#if quiet}<div
					class="bg-primary-muted p-md rounded-lg text-sm"
				>
					Quiet hours: 18:00–09:00, Monday to Friday. This is a local preference preview.
				</div>{/if}
		</Stack></Card
	>
	<Stack orientation="horizontal" wrap="wrap" gap="md">
		<Button onclick={() => (message = 'Channel preferences saved in this local preview.')}
			>Save preferences</Button
		>
		<p class="text-neutral/70 self-center text-xs">
			{preferences.reduce(
				(total, preference) => total + Number(preference.email) + Number(preference.inApp),
				0
			)} channels enabled
		</p>
	</Stack>
	{#if message}<Alert color="info" variant="soft" title="Demo result" description={message} />{/if}
</Stack>
