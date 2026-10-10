<script lang="ts" module>
	export type BenchScenario =
		| 'select'
		| 'combobox'
		| 'command'
		| 'menu'
		| 'closed-popovers'
		| 'closed-selects'
		| 'datatable-row-menus';
</script>

<script lang="ts">
	// Fixtures for the benchmarks in this folder: large lists (SC-9, MN-13) and many closed
	// overlays (CX-10), including a DataTable with a menu per row. Measurements are synchronous
	// (flushSync), so no run waits on an animation.
	import Theme from '$lib/components/Theme/Theme.svelte';
	import Command from '$lib/components/Command/Command.svelte';
	import DataTable from '$lib/components/DataTable/DataTable.svelte';
	import type {
		DataTableColumn,
		DataTableRowPayload
	} from '$lib/components/DataTable/dataTable.props.js';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import Menu from '$lib/components/Menu/Menu.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';

	let { scenario, count }: { scenario: BenchScenario; count: number } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const range = (length: number) => Array.from({ length }, (_, index) => index + 1);
	const options = $derived(
		range(count).map((index) => ({ value: `option-${index}`, label: `Option ${index}` }))
	);
	const menuItems = $derived<MenuItem[]>(
		range(count).map((index) => ({ type: 'option', title: `Item ${index}` }))
	);
	type Row = { id: string; name: string };
	const rows = $derived<Row[]>(
		range(count).map((index) => ({ id: `row-${index}`, name: `Row ${index}` }))
	);
	const columns: DataTableColumn<Row>[] = [{ id: 'name', accessor: 'name', header: 'Name' }];
	const rowMenu: MenuItem[] = [
		{ type: 'option', title: 'View' },
		{ type: 'option', title: 'Edit' },
		{ type: 'option', title: 'Delete' }
	];
	const smallOptions = [
		{ value: 'a', label: 'Alpha' },
		{ value: 'b', label: 'Beta' },
		{ value: 'c', label: 'Gamma' }
	];
</script>

<Theme>
	{#if scenario === 'select'}
		<Select label="Large select" items={options} />
	{:else if scenario === 'combobox'}
		<Combobox label="Large combobox" items={options} showAllOnFocus />
	{:else if scenario === 'command'}
		<Command items={[{ heading: 'Options', items: options }]} placeholder="Search options" />
	{:else if scenario === 'menu'}
		<Menu items={menuItems} />
	{:else if scenario === 'closed-popovers'}
		{#each range(count) as index (index)}
			<Popover transition={zero} trigger={{ content: `Popover ${index}` }}>
				<p>Panel {index}</p>
			</Popover>
		{/each}
	{:else if scenario === 'closed-selects'}
		{#each range(count) as index (index)}
			<Select label={`Select ${index}`} items={smallOptions} />
		{/each}
	{:else if scenario === 'datatable-row-menus'}
		<!-- Every row renders, each with a closed PopupMenu trigger, like a table's row actions. -->
		<DataTable
			items={rows}
			{columns}
			getRowId={(row) => row.id}
			pagination={false}
			virtualize={false}
			{rowActions}
		/>
	{/if}
</Theme>

{#snippet rowActions({ row }: DataTableRowPayload<Row>)}
	<PopupMenu
		menu={{ items: rowMenu, density: 'compact' }}
		transition={zero}
		trigger={{
			label: `Actions for ${row.name}`,
			prefix: dotsThreeIcon,
			squared: true,
			size: 'small',
			variant: 'ghost'
		}}
	/>
{/snippet}
