<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
	import { Select } from 'svelai/select';
	import { Switch } from 'svelai/switch';

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

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-center justify-between gap-lg">
		<div>
			<h2 class="text-3xl font-semibold">One team, many strengths.</h2>
			<p class="mt-sm text-sm text-neutral/60">Browse your team and inspect member permissions.</p>
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
				><div class="grid justify-items-center gap-md text-center">
					<Avatar user={{ name: member.name }} size="large" />
					<h3 class="font-semibold">{member.name}</h3>
					<p class="text-sm text-neutral/60">{member.email}</p>
					<Chip color={member.role === 'Admin' ? 'primary' : 'neutral'}>{member.role}</Chip><Button
						fullWidth
						variant="outline"
						size="small"
						onclick={() => (selected = member)}>Manage permissions</Button
					>
				</div></Card
			>{:else}<p class="text-sm text-neutral/60">No members have this role.</p>{/each}
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
