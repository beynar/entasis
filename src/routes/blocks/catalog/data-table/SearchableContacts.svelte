<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { DataTable } from 'svelai/data-table';

	const contacts = [
		'Maya Chen',
		'Sam Rivera',
		'Alex Morgan',
		'Jordan Lee',
		'Nina Patel',
		'Oscar Kim',
		'Lena Fischer',
		'Theo Martin',
		'Ava Wilson',
		'Noah Park',
		'Mia Rossi',
		'Leo Silva'
	].map((name, index) => ({
		id: String(index),
		name,
		email: name.toLowerCase().replace(' ', '.') + '@example.com',
		company: ['Northstar', 'Orbit Labs', 'Common Ground'][index % 3] ?? 'Northstar',
		role: ['Designer', 'Engineer', 'Product manager'][index % 3] ?? 'Designer'
	}));
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<p class="text-sm text-primary-readable">People / Directory</p>
			<h2 class="mt-sm text-3xl font-semibold">Good people. Great work.</h2>
		</div>
		<Chip color="neutral">{contacts.length} contacts</Chip>
	</header>
	<Card
		><DataTable
			items={contacts}
			columns={[
				{ id: 'name', accessor: 'name', header: 'Name', sortable: true },
				{ id: 'email', accessor: 'email', header: 'Email', sortable: true },
				{ id: 'company', accessor: 'company', header: 'Company', sortable: true },
				{ id: 'role', accessor: 'role', header: 'Role', sortable: true }
			]}
			getRowId={(contact) => contact.id}
			search={{ placeholder: 'Search name, email, or company' }}
			pagination={{ pageSize: 5, pageSizes: [5, 10, 20] }}
			showColumnVisibilityControl
			caption="Sample contact directory"
		/></Card
	>
</Stack>
