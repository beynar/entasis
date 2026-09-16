<script lang="ts" generics="C extends KanbanCard">
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { dotsSixVerticalIcon } from '../Icons/dotsSixVertical.js';
	import Slot from '../Slot/Slot.svelte';
	import { flip } from 'svelte/animate';
	import type { Density } from '$lib/types/theme.js';
	import type { useKanbanTheme } from './kanban.theme.js';
	import type { KanbanCard, KanbanColumnData, KanbanProps } from './kanban.props.js';

	let {
		column,
		index,
		boardId,
		classes,
		sortableColumns,
		columnHeight,
		indicator,
		accepts,
		disabled,
		canDrag,
		cardHandle,
		density,
		getColumn,
		updateCards,
		applyReorder,
		applyTransfer,
		onCardDragStart,
		onCardDragEnd,
		card,
		columnHeader,
		columnFooter,
		columnContent,
		empty,
		flipParams
	}: {
		column: KanbanColumnData<C>;
		/** The column's position on the board — the preview position while a
		 * column drag is in flight. */
		index: number;
		boardId: string;
		classes: ReturnType<typeof useKanbanTheme>;
		sortableColumns: boolean;
		columnHeight?: string;
		indicator: boolean;
		disabled: boolean;
		canDrag?: (payload: { card: C; column: KanbanColumnData<C> }) => boolean;
		cardHandle: boolean;
		density: Density;
		flipParams: { duration: number; easing: (t: number) => number };
		accepts?: (payload: { card: C; from: KanbanColumnData<C>; to: KanbanColumnData<C> }) => boolean;
		getColumn: (id: string) => KanbanColumnData<C> | undefined;
		updateCards: (columnId: string, cards: C[]) => void;
		applyReorder: (
			columnId: string,
			cards: C[],
			detail: { item: C; from: number; to: number }
		) => void;
		applyTransfer: (payload: {
			card: C;
			from: { columnId: string; index: number };
			to: { columnId: string; index: number };
		}) => void;
		onCardDragStart?: (payload: { card: C; column: KanbanColumnData<C>; index: number }) => void;
		onCardDragEnd?: (payload: { card: C; dropped: boolean }) => void;
		card?: KanbanProps<C>['card'];
		columnHeader?: KanbanProps<C>['columnHeader'];
		columnFooter?: KanbanProps<C>['columnFooter'];
		columnContent?: KanbanProps<C>['column'];
		empty?: KanbanProps<C>['empty'];
	} = $props();

	// The column id is stable for the lifetime of this instance (the parent
	// keys each column by id), so it is safe to capture in the list id.
	// svelte-ignore state_referenced_locally
	const listId = `${boardId}:${column.id}`;
	const columnIdOf = (dndListId: string) => dndListId.slice(boardId.length + 1);

	const dnd = useDndList<C>({
		id: listId,
		items: () => column.cards,
		indicator: () => indicator,
		accepts: (source) => {
			// Only cards from this board's other columns — never other boards,
			// never the board's own column-reorder drag.
			if (!source.listId.startsWith(`${boardId}:`)) return false;
			const from = getColumn(columnIdOf(source.listId));
			if (!from) return false;
			if (column.limit !== undefined && column.cards.length >= column.limit) return false;
			return accepts?.({ card: source.item as C, from, to: column }) ?? true;
		},
		disabled: () => disabled,
		handle: () => cardHandle,
		canDrag: (item) => canDrag?.({ card: item, column }) ?? true,
		onDragStart: ({ item, index }) => onCardDragStart?.({ card: item, column, index }),
		onDragEnd: ({ item, dropped }) => onCardDragEnd?.({ card: item, dropped }),
		onReorder: (next, detail) => {
			applyReorder(column.id, next, detail);
		},
		// The receiving column applies the WHOLE cross-column move (remove from
		// source + insert here) as one board-level reassignment.
		onReceive: ({ item, index, from }) => {
			applyTransfer({
				card: item as C,
				from: { columnId: columnIdOf(from.listId), index: from.index },
				to: { columnId: column.id, index }
			});
		},
		// In-board transfers are handled atomically by the receiving column —
		// this only acts when one of our cards lands OUTSIDE the board.
		onRemove: ({ item, to }) => {
			if (to.listId.startsWith(`${boardId}:`)) return;
			updateCards(
				column.id,
				column.cards.filter((c) => c.id !== item.id)
			);
		}
	});

	// Prospective card order for preview mode. Indicator mode renders the real
	// cards unchanged and uses the utility's insertion line instead.
	const previewCards = $derived.by(() => {
		let cards = column.cards;
		if (dnd.dragging) cards = cards.filter((c) => c.id !== dnd.dragging);
		const over = dnd.over;
		if (over) {
			const item = over.source.item as C;
			const index = Math.min(over.index, cards.length);
			cards = [...cards.slice(0, index), item, ...cards.slice(index)];
		}
		return cards;
	});
	const renderedCards = $derived(indicator ? column.cards : previewCards);
	const draggingId = $derived(indicator ? dnd.dragging : (dnd.over?.source.itemId ?? null));
</script>

<div
	class={classes.column()}
	style:height={columnHeight}
	data-color={column.color ?? 'primary'}
	data-kanban-column={column.id}
>
	{#snippet header()}
		<div
			class={classes.columnHeader({ sortable: sortableColumns, density })}
			data-dnd-handle={sortableColumns ? '' : undefined}
		>
			{#if columnHeader}
				<Slot render={columnHeader} payload={{ column, index }} />
			{:else}
				{#if column.color}
					<span class={classes.columnDot()} aria-hidden="true"></span>
				{/if}
				<span class={classes.columnTitle()}>{column.title}</span>
				<span class={classes.count()}>
					{column.cards.length}{column.limit !== undefined ? ` / ${column.limit}` : ''}
				</span>
			{/if}
		</div>
	{/snippet}

	<!-- The ready-made drag grip for cards: renders only in cardHandle mode, so
	     custom card snippets can call it unconditionally. -->
	{#snippet cardGrip()}
		{#if cardHandle}
			<span data-dnd-handle class={classes.cardHandle()} aria-hidden="true">
				{@render dotsSixVerticalIcon({ class: 'size-4' })}
			</span>
		{/if}
	{/snippet}

	<!-- The dnd-wired card list: drop target, selected feedback, animations. The
	     column snippet renders this wherever cards should live. -->
	{#snippet items()}
		<div class={classes.list({ density })} {@attach dnd.list}>
			{#each renderedCards as item, cardIndex (item.id)}
				<!-- The placeholder (the dragged card at its prospective slot) is
				     still a dnd target: hovering it keeps `over` stable, and the
				     drop resolves from `over` anyway. -->
				<div
					class={classes.cardWrapper({ dragging: item.id === draggingId })}
					data-kanban-preview={!indicator && item.id === draggingId ? '' : undefined}
					animate:flip={flipParams}
					{@attach dnd.item(item)}
				>
					{#if card}
						<Slot
							render={card}
							payload={{
								card: item,
								column,
								index: cardIndex,
								columnIndex: index,
								isDragging: item.id === draggingId,
								handle: cardGrip
							}}
						/>
					{:else}
						<div class={classes.card({ density, handle: cardHandle })}>
							{#if cardHandle}
								{@render cardGrip()}
								<div class="min-w-0 flex-1">
									<div class={classes.cardTitle()}>{item.title ?? item.id}</div>
									{#if item.description}
										<div class={classes.cardDescription()}>{item.description}</div>
									{/if}
								</div>
							{:else}
								<div class={classes.cardTitle()}>{item.title ?? item.id}</div>
								{#if item.description}
									<div class={classes.cardDescription()}>{item.description}</div>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
			{#if empty && renderedCards.length === 0}
				<Slot render={empty} payload={{ column }} class={classes.empty()} />
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		{#if columnFooter}
			<Slot render={columnFooter} payload={{ column, index }} class={classes.footer({ density })} />
		{/if}
	{/snippet}

	{#if columnContent}
		<Slot render={columnContent} payload={{ column, index, header, items, footer }} />
	{:else}
		{@render header()}
		{@render items()}
		{@render footer()}
	{/if}
</div>
