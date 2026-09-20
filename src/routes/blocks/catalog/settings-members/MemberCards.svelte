<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Dialog } from 'entasis/dialog';
	import { Select } from 'entasis/select';
	import { Switch } from 'entasis/switch';

	let filter = $state<string | null>('All');
	let members = $state([
		{ name: 'Maya Chen', email: 'maya@example.com', role: 'Admin', invite: true, export: true },
		{ name: 'Sam Rivera', email: 'sam@example.com', role: 'Editor', invite: false, export: true },
		{ name: 'Alex Morgan', email: 'alex@example.com', role: 'Editor', invite: true, export: true },
		{
			name: 'Jordan Lee',
			email: 'jordan@example.com',
			role: 'Viewer',
			invite: false,
			export: false
		}
	]);
	let selected = $state<(typeof members)[number] | null>(null);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-center justify-between">
		<div>
			<h2 class="text-3xl font-semibold">One team, many strengths.</h2>
			<p class="mt-sm text-neutral/70 text-sm">Browse your team and inspect member permissions.</p>
		</div>
		<Select
			label="Show role"
			bind:value={filter}
			items={[
				{ value: 'All', label: 'All members' },
				{ value: 'Admin', label: 'Admins' },
				{ value: 'Editor', label: 'Editors' },
				{ value: 'Viewer', label: 'Viewers' }
			]}
		/>
	</header>
	<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
		{#each members.filter((member) => filter === 'All' || member.role === filter) as member (member)}<Card
				><div class="gap-md grid justify-items-center text-center">
					<Avatar name={member.name} size="large" />
					<h3 class="font-semibold">{member.name}</h3>
					<p class="text-neutral/70 text-sm">{member.email}</p>
					<Chip color={member.role === 'Admin' ? 'primary' : 'neutral'}>{member.role}</Chip><Button
						fullWidth
						variant="outline"
						size="small"
						onclick={() => (selected = member)}>Manage permissions</Button
					>
				</div></Card
			>{:else}<p class="text-neutral/70 text-sm">No members have this role.</p>{/each}
	</Grid>
	<Dialog
		open={selected !== null}
		onOpenChange={(open) => {
			if (!open) selected = null;
		}}
		title={selected?.name ?? 'Member'}
		description="Changes apply to this demo only."
		>{#if selected}<Stack gap="lg">
				<Select
					label="Workspace role"
					bind:value={selected.role}
					items={[
						{ value: 'Admin', label: 'Admin' },
						{ value: 'Editor', label: 'Editor' },
						{ value: 'Viewer', label: 'Viewer' }
					]}
				/><Switch label="Can invite teammates" bind:value={selected.invite} /><Switch
					label="Can export project data"
					bind:value={selected.export}
				/>
			</Stack>{/if}</Dialog
	>
</Stack>
