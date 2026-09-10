<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { trashIcon } from 'svelai/icons/trash';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { DataTable } from 'svelai/data-table';
	import { Select } from 'svelai/select';

	let members = $state([
		{ name: 'Alex Morgan', email: 'alex@example.com', role: 'Owner', joined: 'January 12' },
		{ name: 'Maya Chen', email: 'maya@example.com', role: 'Admin', joined: 'February 3' },
		{ name: 'Sam Rivera', email: 'sam@example.com', role: 'Editor', joined: 'March 8' },
		{ name: 'Jordan Lee', email: 'jordan@example.com', role: 'Viewer', joined: 'April 22' }
	]);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<h2 class="text-3xl font-semibold">The people behind the work.</h2>
			<p class="mt-sm text-sm text-neutral/60">Manage roles in this local workspace preview.</p>
		</div>
		<Chip color="primary">{members.length} members</Chip>
	</header>
	<Card
		><DataTable
			items={members}
			columns={[
				{ id: 'name', accessor: 'name', header: 'Member', sortable: true },
				{ id: 'email', accessor: 'email', header: 'Email' },
				{ id: 'role', accessor: 'role', header: 'Role', sortable: true },
				{ id: 'joined', accessor: 'joined', header: 'Joined' }
			]}
			getRowId={(member) => member.email}
			search
			pagination={false}
			caption="Workspace members"
			>{#snippet cell(
				payload
			)}{#if payload.columnId === 'role' && payload.row.role !== 'Owner'}<Select
						label={`Role for ${payload.row.name}`}
						size="small"
						value={payload.row.role}
						onValueChange={(role) => {
							if (role) payload.row.role = role;
						}}
						items={[
							{ value: 'Editor', label: 'Editor' },
							{ value: 'Viewer', label: 'Viewer' },
							{ value: 'Admin', label: 'Admin' }
						]}
					/>{:else}{@render payload.renderDefault()}{/if}{/snippet}{#snippet rowActions({
				row
			})}<Button
					size="small"
					color="danger"
					variant="ghost"
					label={`Remove ${row.name}`}
					prefix={trashIcon}
					disabled={row.role === 'Owner'}
					onclick={() => (members = members.filter((member) => member.email !== row.email))}
				/>{/snippet}</DataTable
		></Card
	>
	<p class="text-xs text-neutral/60">The owner cannot be removed from this preview.</p>
</Stack>
