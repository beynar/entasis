<script lang="ts" generics="TData">
	import { onDestroy, untrack } from 'svelte';
	import Button from '../Button/Button.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import { checkIcon } from '../Icons/check.js';
	import { columnsIcon } from '../Icons/columns.js';
	import { xIcon } from '../Icons/x.js';
	import type { MenuItem } from '../Menu/menu.props.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableApi } from './dataTable.props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		model,
		classes,
		revision,
		tableApi
	}: {
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		revision: number;
		tableApi: DataTableApi<TData>;
	} = $props();
	const t = $derived(useI18n());

	let searchValue = $state(untrack(() => model.state.globalFilter));
	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	let syncedGlobalFilter = untrack(() => model.state.globalFilter);
	let submittedGlobalFilter: string | null = null;

	const searchConfig = $derived.by(() => {
		if (typeof model.props.search === 'object') return model.props.search;
		if (model.props.search) return {};
		return null;
	});
	const selectedRows = $derived.by(() => {
		void model.state.rowSelection;
		return model.selectedRows;
	});
	const payload = $derived.by(() => {
		void [
			revision,
			model.state.pagination,
			model.state.sorting,
			model.state.globalFilter,
			model.state.columnFilters,
			model.state.grouping,
			model.state.expanded
		];
		return {
			state: tableApi.state,
			selectedRows: [...tableApi.selectedRows],
			visibleRows: [...tableApi.visibleRows],
			clearFilters: tableApi.clearFilters,
			clearSelection: tableApi.clearSelection
		};
	});
	const hasFilters = $derived(!!model.state.globalFilter || model.state.columnFilters.length > 0);
	const hideableColumns = $derived.by(() => {
		void [revision, model.state.columnOrder, model.state.columnVisibility, model.publicColumns];
		return model.table
			.getAllLeafColumns()
			.filter((column) => !!model.getColumnConfig(column.id) && column.getCanHide());
	});
	const visibilityItems = $derived.by(() => {
		void model.state.columnVisibility;
		const visibleCount = hideableColumns.filter(
			(column) => model.state.columnVisibility[column.id] !== false
		).length;
		return hideableColumns.map((column): MenuItem => {
			const header = model.getColumnConfig(column.id)?.header;
			return {
				type: 'option',
				title: typeof header === 'string' ? header : column.id,
				suffix: model.state.columnVisibility[column.id] !== false ? checkIcon : undefined,
				attrs: {
					role: 'menuitemcheckbox',
					'aria-checked': model.state.columnVisibility[column.id] !== false,
					'data-menu-keep-open': 'true'
				},
				disabled:
					model.props.disabled ||
					(visibleCount <= 1 && model.state.columnVisibility[column.id] !== false),
				onclick: () => column.toggleVisibility()
			};
		});
	});
	const isVisible = $derived(
		!!searchConfig ||
			!!model.props.toolbarPrefix ||
			!!model.props.toolbarSuffix ||
			(model.props.showColumnVisibilityControl &&
				hideableColumns.length > 0 &&
				model.publicColumns.length > 1) ||
			(selectedRows.length > 0 && !!model.props.bulkActions)
	);

	$effect(() => {
		void revision;
		const globalFilter = model.state.globalFilter;
		if (globalFilter === syncedGlobalFilter) return;
		syncedGlobalFilter = globalFilter;
		if (globalFilter === submittedGlobalFilter) {
			submittedGlobalFilter = null;
			return;
		}
		submittedGlobalFilter = null;
		if (searchTimer) {
			clearTimeout(searchTimer);
			searchTimer = null;
		}
		searchValue = globalFilter;
	});

	const updateSearch = (value: string) => {
		searchValue = value;
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			searchTimer = null;
			if (model.state.globalFilter === value) return;
			submittedGlobalFilter = value;
			model.setGlobalFilter(value);
		}, searchConfig?.debounce ?? 150);
	};

	onDestroy(() => {
		if (searchTimer) clearTimeout(searchTimer);
	});
</script>

{#if isVisible}
	<div class={classes.toolbar()}>
		<div class={classes.toolbarGroup()}>
			<Slot render={model.props.toolbarPrefix} {payload} />

			{#if searchConfig}
				<TextInput
					class={classes.search()}
					size="small"
					placeholder={searchConfig.placeholder ?? t.dataTableSearchRows}
					value={searchValue}
					disabled={model.props.disabled}
					onValueChange={(value) => updateSearch(value ?? '')}
				/>
			{/if}

			{#if selectedRows.length > 0 && model.props.bulkActions}
				<Slot render={model.props.bulkActions} {payload} />
			{/if}
		</div>

		<div class={classes.toolbarGroup()}>
			{#if hasFilters}
				<Button
					prefix={xIcon}
					variant="ghost"
					color="neutral"
					size="small"
					disabled={model.props.disabled}
					onclick={() => model.clearFilters()}
				>
					{t.dataTableClearFilters}
				</Button>
			{/if}

			{#if model.props.showColumnVisibilityControl && hideableColumns.length > 0 && model.publicColumns.length > 1}
				<PopupMenu
					closeOnItemClick={false}
					mobileSheet
					menu={{ items: visibilityItems, density: 'compact' }}
					trigger={{
						label: t.dataTableChooseColumns,
						content: t.dataTableColumns,
						prefix: columnsIcon,
						variant: 'ghost',
						color: 'neutral',
						size: 'small',
						disabled: model.props.disabled
					}}
				/>
			{/if}

			<Slot render={model.props.toolbarSuffix} {payload} />
		</div>
	</div>
{/if}
