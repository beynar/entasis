<script lang="ts" generics="TData">
	import type { Column } from '@tanstack/table-core';
	import type { Attachment } from 'svelte/attachments';
	import Button from '../Button/Button.svelte';
	import Hitbox from '../Hitbox/Hitbox.svelte';
	import { arrowCounterClockwiseIcon } from '../Icons/arrowCounterClockwise.js';
	import { arrowLineLeftIcon } from '../Icons/arrowLineLeft.js';
	import { arrowLineRightIcon } from '../Icons/arrowLineRight.js';
	import { checkIcon } from '../Icons/check.js';
	import { dotsThreeVerticalIcon } from '../Icons/dotsThreeVertical.js';
	import { eyeSlashIcon } from '../Icons/eyeSlash.js';
	import { pushPinSlashIcon } from '../Icons/pushPinSlash.js';
	import { sortAscendingIcon } from '../Icons/sortAscending.js';
	import { sortDescendingIcon } from '../Icons/sortDescending.js';
	import type { MenuItem } from '../Menu/menu.props.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import DataTableFilter from './DataTableFilter.svelte';
	import type { DataTableHeaderPayload } from './dataTable.props.js';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';

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
		column: Column<TData, unknown>;
		columnIndex: number;
		gridColumn: number;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		density: 'small' | 'normal' | 'large';
		revision: number;
		dragAttachment?: Attachment<HTMLElement>;
	} = $props();

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
		revision;
		model.state.columnPinning;
		return column.getIsPinned();
	});
	const leftPinned = $derived.by(() => {
		revision;
		model.state.columnPinning;
		model.state.columnVisibility;
		return model.table.getLeftVisibleLeafColumns();
	});
	const rightPinned = $derived.by(() => {
		revision;
		model.state.columnPinning;
		model.state.columnVisibility;
		return model.table.getRightVisibleLeafColumns();
	});
	const boundary = $derived.by(() => {
		if (pinning === 'left' && leftPinned.at(-1)?.id === column.id) return 'left';
		if (pinning === 'right' && rightPinned[0]?.id === column.id) return 'right';
		return 'none';
	});
	const pinnedOffset = $derived.by(() => {
		revision;
		model.state.columnPinning;
		model.state.columnSizing;
		if (pinning === 'left') return column.getStart('left');
		if (pinning === 'right') return column.getAfter('right');
		return 0;
	});
	const columnSize = $derived.by(() => {
		revision;
		model.state.columnSizing;
		return column.getSize();
	});
	const ariaSort = $derived.by(() => {
		if (!isPrimarySort) return undefined;
		if (sorted === 'asc') return 'ascending';
		if (sorted === 'desc') return 'descending';
		return 'none';
	});
	const canOpenMenu = $derived(
		!!config &&
			(!!config.filter ||
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

	const menuItems = $derived.by(() => {
		if (!config) return [];
		model.state.columnVisibility;
		model.state.columnPinning;
		model.state.columnSizing;
		model.state.grouping;
		const items: MenuItem[] = [];
		if (config.pinnable !== false) {
			items.push(
				{
					type: 'option',
					title: 'Pin left',
					prefix: arrowLineLeftIcon,
					selected: pinning === 'left',
					suffix: pinning === 'left' ? checkIcon : undefined,
					onclick: () => column.pin('left')
				},
				{
					type: 'option',
					title: 'Pin right',
					prefix: arrowLineRightIcon,
					selected: pinning === 'right',
					suffix: pinning === 'right' ? checkIcon : undefined,
					onclick: () => column.pin('right')
				},
				{
					type: 'option',
					title: 'Unpin',
					prefix: pushPinSlashIcon,
					disabled: !pinning,
					onclick: () => column.pin(false)
				}
			);
		}
		if (model.props.processingMode !== 'manual' && config.groupable) {
			items.push({
				type: 'option',
				title: model.state.grouping.includes(column.id) ? 'Stop grouping' : 'Group by this column',
				onclick: () => column.toggleGrouping()
			});
		}
		if (config.resizable !== false) {
			items.push({
				type: 'option',
				title: 'Reset width',
				prefix: arrowCounterClockwiseIcon,
				onclick: () => column.resetSize()
			});
		}
		if (config.hideable !== false) {
			items.push({
				type: 'option',
				title: 'Hide column',
				prefix: eyeSlashIcon,
				disabled:
					model.table.getVisibleLeafColumns().filter((entry) => model.getColumnConfig(entry.id))
						.length <= 1,
				onclick: () => column.toggleVisibility(false)
			});
		}
		return items;
	});

	const sortLabel = $derived.by(() => {
		const name = typeof config?.header === 'string' ? config.header : column.id;
		if (!sorted) return `Sort ${name}`;
		const direction = sorted === 'asc' ? 'ascending' : 'descending';
		return sortIndex > 0
			? `${name}, sorted ${direction}, priority ${sortIndex + 1}`
			: `${name}, sorted ${direction}`;
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
	const startResize = (event: PointerEvent) => {
		if (event.button !== 0 || model.props.disabled) return;
		event.preventDefault();
		const startX = event.clientX;
		const startSize = column.getSize();
		const direction =
			getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1;
		resizing = true;
		const move = (moveEvent: PointerEvent) => {
			model.setColumnSize(column.id, startSize + (moveEvent.clientX - startX) * direction);
		};
		const stop = () => {
			resizing = false;
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', stop);
			window.removeEventListener('pointercancel', stop);
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', stop, { once: true });
		window.addEventListener('pointercancel', stop, { once: true });
	};

	const resizeAttachment: Attachment<HTMLElement> = (element) => {
		const resetSize = () => column.resetSize();
		element.addEventListener('pointerdown', startResize);
		element.addEventListener('keydown', resizeWithKeyboard);
		element.addEventListener('dblclick', resetSize);
		return () => {
			element.removeEventListener('pointerdown', startResize);
			element.removeEventListener('keydown', resizeWithKeyboard);
			element.removeEventListener('dblclick', resetSize);
		};
	};
</script>

{#snippet filterFooter()}
	<DataTableFilter {column} {model} {classes} separated={menuItems.length > 0} />
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
			aria-label={`Reorder ${typeof config.header === 'string' ? config.header : column.id} with left and right arrow keys`}
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
				closeOnItemClick={false}
				mobileSheet
				class={classes.headerMenuPanel()}
				menu={{
					items: menuItems,
					density: 'small',
					footer: config?.filter ? filterFooter : undefined
				}}
			>
				{#snippet trigger(popover)}
					<Button
						type="button"
						label={`Column options for ${typeof config?.header === 'string' ? config.header : column.id}${filtered ? ', filter active' : ''}`}
						prefix={dotsThreeVerticalIcon}
						variant="ghost"
						color={filtered ? 'primary' : 'neutral'}
						size="small"
						disabled={model.props.disabled}
						aria-haspopup="menu"
						aria-expanded={popover.isOpen}
						class={classes.headerMenuButton({ active: filtered })}
						onclick={() => popover.toggle()}
						{@attach popover.reference}
					/>
				{/snippet}
			</PopupMenu>
		{/if}
	</div>

	{#if column.getCanResize()}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span
			role="separator"
			aria-label={`Resize ${typeof config?.header === 'string' ? config.header : column.id}`}
			aria-orientation="vertical"
			aria-valuemin={column.columnDef.minSize ?? 80}
			aria-valuemax={column.columnDef.maxSize ?? 640}
			aria-valuenow={columnSize}
			aria-disabled={model.props.disabled}
			tabindex={model.props.disabled ? -1 : 0}
			data-resizing={resizing}
			class={classes.resizeHandle()}
			{@attach resizeAttachment}
		></span>
	{/if}
</th>
