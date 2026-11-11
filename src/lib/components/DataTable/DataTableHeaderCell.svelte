<script lang="ts" generics="TData">
	import type { Attachment } from 'svelte/attachments';
	import { createPointerDrag } from '$lib/utils/pointerDrag.js';
	import Button from '../Button/Button.svelte';
	import Hitbox from '../Hitbox/Hitbox.svelte';
	import { arrowCounterClockwiseIcon } from '../Icons/arrowCounterClockwise.js';
	import { checkIcon } from '../Icons/check.js';
	import { dotsThreeVerticalIcon } from '../Icons/dotsThreeVertical.js';
	import { eyeSlashIcon } from '../Icons/eyeSlash.js';
	import { funnelSimpleIcon } from '../Icons/funnelSimple.js';
	import { funnelSimpleXIcon } from '../Icons/funnelSimpleX.js';
	import { pushPinIcon } from '../Icons/pushPin.js';
	import { sortAscendingIcon } from '../Icons/sortAscending.js';
	import { sortDescendingIcon } from '../Icons/sortDescending.js';
	import { stackIcon } from '../Icons/stack.js';
	import type { MenuItem } from '../Menu/menu.props.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import DataTableFilter from './DataTableFilter.svelte';
	import type { DataTableHeaderPayload } from './dataTable.props.js';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableColumnInstance } from './dataTable.table.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';

	let {
		column,
		columnIndex,
		gridColumn,
		model,
		classes,
		density,
		revision,
		dragAttachment
	}: {
		column: DataTableColumnInstance<TData>;
		columnIndex: number;
		gridColumn: number;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		density: 'compact' | 'normal' | 'comfortable';
		revision: number;
		dragAttachment?: Attachment<HTMLElement>;
	} = $props();
	const t = $derived(useI18n());
	// Sheet-versus-floating is the Popover's own device decision; the panel width follows it.
	const theme = useTheme();

	const config = $derived(model.getColumnConfig(column.id));
	const sorted: DataTableHeaderPayload<TData>['sorted'] = $derived.by(() => {
		const sorting = model.state.sorting.find((entry) => entry.id === column.id);
		if (!sorting) return false;
		return sorting.desc ? 'desc' : 'asc';
	});
	const sortIndex = $derived(model.state.sorting.findIndex((entry) => entry.id === column.id));
	const isPrimarySort = $derived(model.state.sorting[0]?.id === column.id);
	const filtered = $derived(model.state.columnFilters.some((entry) => entry.id === column.id));
	const pinning = $derived.by(() => {
		void [revision, model.state.columnPinning];
		return model.getColumnPinning(column);
	});
	const leftPinned = $derived.by(() => {
		void [revision, model.state.columnPinning, model.state.columnVisibility];
		return model.startPinnedColumns;
	});
	const rightPinned = $derived.by(() => {
		void [revision, model.state.columnPinning, model.state.columnVisibility];
		return model.endPinnedColumns;
	});
	const boundary = $derived.by(() => {
		if (pinning === 'left' && leftPinned.at(-1)?.id === column.id) return 'left';
		if (pinning === 'right' && rightPinned[0]?.id === column.id) return 'right';
		return 'none';
	});
	const pinnedOffset = $derived.by(() => {
		void [revision, model.state.columnPinning, model.state.columnSizing];
		return model.getColumnPinnedOffset(column);
	});
	const columnSize = $derived.by(() => {
		void [revision, model.state.columnSizing];
		return column.getSize();
	});
	const ariaSort = $derived.by(() => {
		if (!isPrimarySort) return undefined;
		if (sorted === 'asc') return 'ascending';
		if (sorted === 'desc') return 'descending';
		return 'none';
	});
	const filterValue = $derived(
		model.state.columnFilters.find((entry) => entry.id === column.id)?.value
	);
	// Text, number, date and custom filters are fields above the rows; option filters are rows.
	const hasFilterFields = $derived(
		config?.filter?.type === 'text' ||
			config?.filter?.type === 'number' ||
			config?.filter?.type === 'date' ||
			config?.filter?.type === 'custom'
	);
	const canOpenMenu = $derived(
		!!config &&
			(!!config.sortable ||
				!!config.filter ||
				config.hideable !== false ||
				config.pinnable !== false ||
				(model.props.processingMode !== 'manual' && config.groupable) ||
				config.resizable !== false)
	);

	const headerPayload = $derived(
		config
			? {
					column: config,
					sorted,
					sortIndex,
					filtered,
					toggleSorting: (multi = false) => column.toggleSorting(undefined, multi)
				}
			: undefined
	);

	// A press on the checked direction clears the sort; the menu sorts by this column alone, while
	// Shift+click on the header still adds it to a multi-sort.
	const sortItem = (direction: 'asc' | 'desc'): MenuItem => ({
		type: 'option',
		title: direction === 'asc' ? t.dataTableSortAscending : t.dataTableSortDescending,
		prefix: direction === 'asc' ? sortAscendingIcon : sortDescendingIcon,
		suffix: sorted === direction ? checkIcon : undefined,
		attrs: { role: 'menuitemradio', 'aria-checked': sorted === direction },
		onclick: () =>
			sorted === direction ? column.clearSorting() : column.toggleSorting(direction === 'desc')
	});

	const optionFilterItems = (): MenuItem[] | undefined => {
		const filter = config?.filter;
		if (filter?.type === 'select') {
			return [
				{
					type: 'radio-group',
					value: typeof filterValue === 'string' ? filterValue : '',
					onValueChange: (next) => model.setColumnFilter(column.id, next || undefined),
					items: [
						{ value: '', title: t.allValues },
						...filter.options.map((option) => ({
							value: option.value,
							title: option.label,
							disabled: option.disabled
						}))
					]
				}
			];
		}
		if (filter?.type === 'multi-select') {
			const checked = Array.isArray(filterValue) ? filterValue.map(String) : [];
			return filter.options.map((option): MenuItem => ({
				type: 'checkbox',
				key: option.value,
				title: option.label,
				textValue: option.label,
				disabled: option.disabled,
				value: checked.includes(option.value),
				onValueChange: (next) => {
					const current = model.state.columnFilters.find((entry) => entry.id === column.id)?.value;
					const values = (Array.isArray(current) ? current.map(String) : []).filter(
						(entry) => entry !== option.value
					);
					if (next) values.push(option.value);
					model.setColumnFilter(column.id, values.length ? values : undefined);
				}
			}));
		}
		if (filter?.type === 'boolean') {
			return [
				{
					type: 'radio-group',
					value: filterValue === true ? 'true' : filterValue === false ? 'false' : '',
					onValueChange: (next) =>
						model.setColumnFilter(column.id, next === '' ? undefined : next === 'true'),
					items: [
						{ value: '', title: t.allValues },
						{ value: 'true', title: filter.trueLabel ?? t.trueLabel },
						{ value: 'false', title: filter.falseLabel ?? t.falseLabel }
					]
				}
			];
		}
		return undefined;
	};

	const menuItems = $derived.by(() => {
		if (!config) return [];
		void [
			model.state.sorting,
			model.state.columnFilters,
			model.state.columnVisibility,
			model.state.columnPinning,
			model.state.columnSizing,
			model.state.grouping
		];
		const sections: MenuItem[][] = [];

		if (config.sortable) sections.push([sortItem('asc'), sortItem('desc')]);

		const view: MenuItem[] = [];
		const filterRows = optionFilterItems();
		if (filterRows) {
			view.push({
				type: 'submenu',
				title: t.filter,
				prefix: funnelSimpleIcon,
				menu: filterRows,
				filter: config.filter?.type === 'multi-select' && config.filter.options.length > 8
			});
		}
		if (config.filter && filtered) {
			view.push({
				type: 'option',
				title: t.dataTableClearFilter,
				prefix: funnelSimpleXIcon,
				onclick: () => model.setColumnFilter(column.id, undefined)
			});
		}
		if (config.pinnable !== false) {
			view.push({
				type: 'submenu',
				title: t.dataTablePin,
				prefix: pushPinIcon,
				menu: [
					{
						type: 'radio-group',
						value: pinning || 'none',
						onValueChange: (next) =>
							column.pin(next === 'left' ? 'start' : next === 'right' ? 'end' : false),
						items: [
							{ value: 'left', title: t.dataTablePinnedLeft },
							{ value: 'right', title: t.dataTablePinnedRight },
							{ value: 'none', title: t.dataTableNotPinned }
						]
					}
				]
			});
		}
		if (model.props.processingMode !== 'manual' && config.groupable) {
			view.push({
				type: 'checkbox',
				title: t.dataTableGroupByColumn,
				prefix: stackIcon,
				value: model.state.grouping.includes(column.id),
				onValueChange: () => column.toggleGrouping()
			});
		}
		if (view.length) sections.push(view);

		const layout: MenuItem[] = [];
		if (config.resizable !== false) {
			layout.push({
				type: 'option',
				title: t.dataTableResetWidth,
				prefix: arrowCounterClockwiseIcon,
				onclick: () => column.resetSize()
			});
		}
		if (config.hideable !== false) {
			layout.push({
				type: 'option',
				title: t.dataTableHideColumn,
				prefix: eyeSlashIcon,
				disabled:
					model.table.getVisibleLeafColumns().filter((entry) => model.getColumnConfig(entry.id))
						.length <= 1,
				onclick: () => column.toggleVisibility(false)
			});
		}
		if (layout.length) sections.push(layout);

		return sections.flatMap((section, index): MenuItem[] =>
			index === 0 ? section : [{ type: 'separator', key: `separator-${index}` }, ...section]
		);
	});

	const sortLabel = $derived.by(() => {
		const name = typeof config?.header === 'string' ? config.header : column.id;
		if (!sorted) return t.dataTableSort(name);
		const sortedLabel =
			sorted === 'asc' ? t.dataTableSortedAscending(name) : t.dataTableSortedDescending(name);
		return sortIndex > 0 ? t.dataTableSortPriority(sortedLabel, sortIndex + 1) : sortedLabel;
	});

	const resizeWithKeyboard = (event: KeyboardEvent) => {
		if (model.props.disabled) return;
		if (
			event.key !== 'ArrowLeft' &&
			event.key !== 'ArrowRight' &&
			event.key !== 'Home' &&
			event.key !== 'End'
		)
			return;
		event.preventDefault();
		if (event.key === 'Home') {
			model.setColumnSize(column.id, column.columnDef.minSize ?? 80);
			return;
		}
		if (event.key === 'End') {
			model.setColumnSize(column.id, column.columnDef.maxSize ?? 640);
			return;
		}
		const direction =
			getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1;
		const delta = event.key === 'ArrowRight' ? 8 : -8;
		model.setColumnSize(column.id, column.getSize() + delta * direction);
	};

	const reorderWithKeyboard = (event: KeyboardEvent) => {
		if (model.props.disabled || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
		event.preventDefault();
		event.stopPropagation();
		const isRtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		const visualDirection = event.key === 'ArrowRight' ? 1 : -1;
		model.moveColumn(column.id, (isRtl ? -visualDirection : visualDirection) as -1 | 1);
	};

	let resizing = $state(false);
	let resizeStartSize = 0;
	let resizeDirection = 1;
	// `createPointerDrag` captures the pointer on the handle, so the drag keeps tracking once the
	// pointer leaves the document and always ends (pointerup, cancel, lost capture, unmount).
	const resizeDrag = createPointerDrag({
		disabled: () => !!model.props.disabled,
		onStart: ({ node }) => {
			resizeStartSize = column.getSize();
			resizeDirection = getComputedStyle(node).direction === 'rtl' ? -1 : 1;
			resizing = true;
		},
		onMove: ({ deltaX }) => {
			model.setColumnSize(column.id, resizeStartSize + deltaX * resizeDirection);
		},
		onEnd: () => (resizing = false)
	});
</script>

{#snippet filterFields()}
	<DataTableFilter {column} {model} {classes} />
{/snippet}

{#snippet renderDefaultHeader()}
	{#if config && headerPayload}
		<Slot render={config.header} payload={headerPayload} class={classes.headerLabel()} as="span" />
	{/if}
{/snippet}

{#snippet renderHeader()}
	{#if config && headerPayload && model.props.header}
		{@render model.props.header({ ...headerPayload, renderDefault: renderDefaultHeader })}
	{:else}
		{@render renderDefaultHeader()}
	{/if}
{/snippet}

<th
	role="columnheader"
	aria-colindex={columnIndex + 1}
	aria-sort={ariaSort}
	data-column-id={column.id}
	data-pinned={pinning || undefined}
	class={classes.headerCell({
		density,
		align: config?.align ?? 'start',
		pinned: !!pinning,
		class: [config?.headerClass, classes.pinnedBoundary({ side: boundary })]
			.filter(Boolean)
			.join(' ')
	})}
	style:grid-column={gridColumn}
	style:position={pinning ? 'sticky' : undefined}
	style:inset-inline-start={pinning === 'left' ? `${pinnedOffset}px` : undefined}
	style:inset-inline-end={pinning === 'right' ? `${pinnedOffset}px` : undefined}
	{@attach dragAttachment}
>
	{#if config && config.reorderable !== false}
		<button
			type="button"
			data-dnd-handle
			disabled={model.props.disabled}
			class={classes.dragHandle()}
			aria-label={t.dataTableReorderColumn(
				typeof config.header === 'string' ? config.header : column.id
			)}
			onkeydown={reorderWithKeyboard}
		>
			<Hitbox size="small" />
			<span aria-hidden="true" class={classes.dragThumb()}></span>
		</button>
	{/if}

	<div class={classes.headerContent()}>
		{#if config?.sortable}
			<button
				type="button"
				disabled={model.props.disabled}
				class={classes.headerButton()}
				aria-label={sortLabel}
				onclick={(event) => column.toggleSorting(undefined, event.shiftKey)}
			>
				{@render renderHeader()}
				{#if sorted === 'asc'}
					{@render sortAscendingIcon({ size: 14 })}
				{:else if sorted === 'desc'}
					{@render sortDescendingIcon({ size: 14 })}
				{/if}
			</button>
		{:else if config}
			{@render renderHeader()}
		{:else if column.id === '__selection'}
			<span class="sr-only">Select</span>
		{:else}
			<span class="sr-only">Actions</span>
		{/if}
	</div>

	<div class={classes.headerActions()}>
		{#if canOpenMenu}
			<PopupMenu
				mobileSheet
				class={classes.headerMenuPanel({ sheet: theme.isMobile })}
				menu={{
					items: menuItems,
					header: hasFilterFields ? filterFields : undefined
				}}
			>
				{#snippet trigger(popover)}
					<Button
						type="button"
						label={filtered
							? t.dataTableColumnOptionsFiltered(
									typeof config?.header === 'string' ? config.header : column.id
								)
							: t.dataTableColumnOptions(
									typeof config?.header === 'string' ? config.header : column.id
								)}
						prefix={dotsThreeVerticalIcon}
						variant="ghost"
						color={filtered ? 'primary' : 'neutral'}
						size="small"
						disabled={model.props.disabled}
						haspopup="menu"
						expanded={popover.isOpen}
						class={classes.headerMenuButton({ active: filtered })}
						onclick={() => popover.toggle()}
						{@attach popover.reference}
					/>
				{/snippet}
			</PopupMenu>
		{/if}
	</div>

	{#if column.getCanResize()}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<span
			role="separator"
			aria-label={`${t.resize} ${typeof config?.header === 'string' ? config.header : column.id}`}
			aria-orientation="vertical"
			aria-valuemin={column.columnDef.minSize ?? 80}
			aria-valuemax={column.columnDef.maxSize ?? 640}
			aria-valuenow={columnSize}
			aria-disabled={model.props.disabled}
			tabindex={model.props.disabled ? -1 : 0}
			data-resizing={resizing}
			class={classes.resizeHandle()}
			onkeydown={resizeWithKeyboard}
			ondblclick={() => column.resetSize()}
			{@attach resizeDrag}
		></span>
	{/if}
</th>
