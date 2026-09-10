<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { trashIcon } from 'svelai/icons/trash';
	import { Card } from 'svelai/card';
	import { DataTable } from 'svelai/data-table';
	import { Dialog } from 'svelai/dialog';
	import { Form } from 'svelai/form';

	let open = $state(false);
	let nextId = 4;
	let companies = $state([
		{
			id: 1,
			name: 'Northwind Studio',
			industry: 'Design',
			contact: 'hello@example.com',
			status: 'Active'
		},
		{
			id: 2,
			name: 'Orbit Labs',
			industry: 'Software',
			contact: 'team@example.com',
			status: 'Active'
		},
		{
			id: 3,
			name: 'Common Ground',
			industry: 'Retail',
			contact: 'studio@example.com',
			status: 'Prospect'
		}
	]);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-center justify-between gap-lg">
		<div>
			<h2 class="text-3xl font-semibold">Your company network</h2>
			<p class="mt-sm text-sm text-neutral/60">
				{companies.length} organizations in this local workspace
			</p>
		</div>
		<Button onclick={() => (open = true)}>Add company</Button>
	</header>
	<Card
		><DataTable
			items={companies}
			columns={[
				{ id: 'name', accessor: 'name', header: 'Company', sortable: true },
				{ id: 'industry', accessor: 'industry', header: 'Industry', sortable: true },
				{ id: 'contact', accessor: 'contact', header: 'Contact' },
				{ id: 'status', accessor: 'status', header: 'Status', sortable: true }
			]}
			getRowId={(company) => String(company.id)}
			search
			pagination={{ pageSize: 5 }}
			caption="Company directory"
			>{#snippet rowActions({ row })}<Button
					size="small"
					variant="ghost"
					color="danger"
					label={`Remove ${row.name}`}
					prefix={trashIcon}
					onclick={() => (companies = companies.filter((company) => company.id !== row.id))}
				/>{/snippet}</DataTable
		></Card
	><Dialog
		bind:open
		title="Add a company"
		description="Create an organization in this local preview."
		><Form
			inputs={{
				name: { type: 'text', label: 'Company name', required: true },
				industry: {
					type: 'select',
					label: 'Industry',
					required: true,
					items: [
						{ value: 'Software', label: 'Software' },
						{ value: 'Design', label: 'Design' },
						{ value: 'Retail', label: 'Retail' }
					]
				},
				email: { type: 'email', label: 'Contact email', required: true }
			}}
			actions={[{ children: 'Add company', onAction: (form) => form.submit() }]}
			onSubmit={({ name, industry, email }) => {
				companies = [...companies, { id: nextId++, name, industry, contact: email, status: 'New' }];
				open = false;
			}}
		/></Dialog
	>
</Stack>
