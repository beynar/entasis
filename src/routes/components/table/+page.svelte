<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { Table } from '$lib/components/Table/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import type { TableRow } from '$lib/components/Table/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';

	const densitySegments = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let tableDensity = $state<Density>('normal');
	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		}
	]);

	// Simplified syntax with strings
	const basicHeader = {
		name: 'Name',
		email: 'Email',
		role: 'Role'
	};

	const basicRows: TableRow[] = [
		{
			cells: {
				name: 'John Doe',
				email: 'john@example.com',
				role: 'Admin'
			}
		},
		{
			cells: {
				name: 'Jane Smith',
				email: 'jane@example.com',
				role: 'User'
			}
		},
		{
			cells: {
				name: 'Bob Johnson',
				email: 'bob@example.com',
				role: 'Editor'
			}
		}
	];

	const salesHeader = {
		product: 'Product',
		quantity: 'Quantity',
		price: 'Price',
		total: 'Total'
	};

	const salesRows: TableRow[] = [
		{
			cells: {
				product: 'Laptop',
				quantity: '2',
				price: '$999',
				total: '$1,998'
			}
		},
		{
			cells: {
				product: 'Mouse',
				quantity: '5',
				price: '$25',
				total: '$125'
			}
		},
		{
			cells: {
				product: 'Keyboard',
				quantity: '3',
				price: '$75',
				total: '$225'
			}
		}
	];

	const salesFooter = {
		product: { content: 'Total', class: 'font-bold' },
		quantity: { content: '10', class: 'font-bold' },
		price: '',
		total: { content: '$2,348', class: 'font-bold' }
	};

	const customHeader = {
		status: { content: 'Status', class: 'w-24' },
		description: { content: 'Description' },
		date: { content: 'Date', class: 'w-32' }
	};

	const customRows: TableRow[] = [
		{
			cells: {
				status: { content: 'Active', class: 'text-success' },
				description: { content: 'System is running normally' },
				date: { content: '2024-01-15' }
			}
		},
		{
			cells: {
				status: { content: 'Warning', class: 'text-warning' },
				description: { content: 'High CPU usage detected' },
				date: { content: '2024-01-14' }
			},
			class: 'bg-warning/10'
		},
		{
			cells: {
				status: { content: 'Error', class: 'text-danger' },
				description: { content: 'Service unavailable' },
				date: { content: '2024-01-13' }
			},
			class: 'bg-danger/10'
		}
	];
</script>

<DocPage
	title="Table"
	subtitle="Displays tabular data in rows and columns."
	component="Table"
	features={[
		'Semantic table, thead, tbody, tfoot',
		'Optional caption element for context',
		'Prefix & suffix slots for controls',
		'Strings, snippets, or cell objects',
		'Custom row content slot support'
	]}
>
	<ComponentCard
		{controls}
		description="Simple table with header and rows using string syntax."
		code={`<Table
	density="${controls.value.density}"
  header={{
    name: 'Name',
    email: 'Email',
    role: 'Role'
  }}
  items={[
    {
      cells: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin'
      }
    },
    {
      cells: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'User'
      }
    },
    {
      cells: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'Editor'
      }
    }
  ]}
/>`}
	>
		<Table density={controls.value.density} header={basicHeader} items={basicRows} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Simple table with header and rows using simplified string syntax.">
			<Table header={basicHeader} items={basicRows} />
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales cell paddings and row heights — compact for dense data grids, comfortable for roomy detail surfaces."
			code={`<SegmentedControl items={densities} bind:value={density} />
<Table {density} header={basicHeader} items={basicRows} />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={tableDensity}
					size="small"
					label="Table density"
				/>
				<Table density={tableDensity} header={basicHeader} items={basicRows} />
			</div>
		</ComponentCard>

		<ComponentCard description="Demonstrates using strings, snippets, and full objects for cells.">
			{#snippet statusBadge()}
				<span class="text-success">✓ Active</span>
			{/snippet}
			<Table
				header={{
					name: 'Name',
					status: { content: statusBadge },
					date: { content: 'Date', class: 'w-32' }
				}}
				items={[
					{
						cells: {
							name: 'John Doe',
							status: statusBadge,
							date: '2024-01-15'
						}
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Table with header, rows, and footer for totals or summaries.">
			<Table header={salesHeader} items={salesRows} footer={salesFooter} />
		</ComponentCard>

		<ComponentCard description="Table with a caption for accessibility and context.">
			<Table caption="User Management Table" header={basicHeader} items={basicRows}></Table>
		</ComponentCard>

		<ComponentCard
			description="Table with prefix (for search/filter) and suffix (for pagination) slots."
		>
			<Table header={basicHeader} items={basicRows}>
				{#snippet prefix()}
					<div class="mb-4">
						<TextInput placeholder="Search users..." />
					</div>
				{/snippet}
				{#snippet suffix()}
					<div class="mt-4 flex items-center justify-between">
						<span class="text-neutral/70 text-sm">Showing 1-3 of 3</span>
						<div class="flex gap-2">
							<Button size="small" variant="outline">Previous</Button>
							<Button size="small" variant="outline">Next</Button>
						</div>
					</div>
				{/snippet}
			</Table>
		</ComponentCard>

		<ComponentCard
			description="Table using custom row content slots for flexible rendering (mixing cells array and content slot)."
		>
			{#snippet customRow1()}
				<td>Custom Row 1</td>
				<td>Custom Content</td>
				<td>
					<Button size="small">Action</Button>
				</td>
			{/snippet}
			<Table
				header={{
					item: 'Item',
					description: 'Description',
					actions: 'Actions'
				}}
				items={[
					{ content: customRow1 },
					{
						cells: {
							item: 'Standard Row',
							description: 'Standard Content',
							actions: 'Standard Action'
						}
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Table with custom CSS classes on cells and rows for styling.">
			<Table header={customHeader} items={customRows} />
		</ComponentCard>

		<ComponentCard
			description="Table with all features: header, rows, footer, caption, prefix, and suffix."
		>
			<Table header={salesHeader} items={salesRows} footer={salesFooter}>
				{#snippet caption()}
					Sales Report - January 2024
				{/snippet}
				{#snippet prefix()}
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold">Sales Overview</h3>
						<Button size="small">Export</Button>
					</div>
				{/snippet}
				{#snippet suffix()}
					<div class="mt-4 flex items-center justify-between border-t pt-4">
						<span class="text-neutral/70 text-sm">Total items: 3</span>
						<div class="flex gap-2">
							<Button size="small" variant="outline">Previous</Button>
							<Button size="small" variant="outline">Next</Button>
						</div>
					</div>
				{/snippet}
			</Table>
		</ComponentCard>
	{/snippet}
</DocPage>
