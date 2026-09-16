<script lang="ts" generics="C extends KanbanCard">
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { useOverflowObserver } from '$lib/utils/useOverflowObserver.svelte.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { useKanbanTheme } from './kanban.theme.js';
	import KanbanColumn from './KanbanColumn.svelte';
	import type { KanbanCard, KanbanColumnData, KanbanProps } from './kanban.props.js';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		columns = $bindable([]),
		accepts,
		onCardMove,
		onColumnMove,
		onCardDragStart,
		onCardDragEnd,
		sortableColumns = true,
		disabled = false,
		canDrag,
		cardHandle = false,
		density = 'normal',
		columnHeight,
		indicator = false,
		animated = true,
		ref = $bindable(null),
		card,
		columnHeader,
		columnFooter,
		column: columnContent,
		empty,
		class: className,
		theme,
		...attachments
	}: KanbanProps<C> = $props();

	// Preview mode renders prospective arrays and uses FLIP to make room.
	// Indicator mode keeps the real arrays in place and delegates insertion-line
	// feedback to useDndList. Neither mode mutates bound state before drop.
	const enabled = $derived(animated && !prefersReducedMotion());
	const flipParams = $derived({ duration: enabled ? 180 : 0, easing: cubicOut });

	const uid = $props.id();
	const classes = $derived(useKanbanTheme(theme));
	const t = $derived(useI18n());

	const updateCards = (columnId: string, cards: C[]) => {
		columns = columns.map((column) => (column.id === columnId ? { ...column, cards } : column));
	};
	const getColumn = (id: string) => columns.find((column) => column.id === id);

	// Moves apply as ONE `columns` reassignment (cross-column included), so
	// onCardMove always observes a consistent board — never a card present in
	// two columns because the source's removal hasn't run yet.
	const applyReorder = (
		columnId: string,
		cards: C[],
		detail: { item: C; from: number; to: number }
	) => {
		const next = columns.map((column) => (column.id === columnId ? { ...column, cards } : column));
		columns = next;
		onCardMove?.({
			card: detail.item,
			from: { columnId, index: detail.from },
			to: { columnId, index: detail.to },
			columns: next
		});
	};
	const applyTransfer = (detail: {
		card: C;
		from: { columnId: string; index: number };
		to: { columnId: string; index: number };
	}) => {
		const next = columns.map((column) => {
			if (column.id === detail.from.columnId) {
				return { ...column, cards: column.cards.filter((c) => c.id !== detail.card.id) };
			}
			if (column.id === detail.to.columnId) {
				const index = Math.min(detail.to.index, column.cards.length);
				return {
					...column,
					cards: [...column.cards.slice(0, index), detail.card, ...column.cards.slice(index)]
				};
			}
			return column;
		});
		columns = next;
		onCardMove?.({ ...detail, columns: next });
	};

	// Column reordering: a horizontal list over the columns themselves, dragged
	// by the column header (marked data-dnd-handle inside KanbanColumn). Card
	// lists reject this drag automatically (different list id namespace).
	const columnsDnd = useDndList<KanbanColumnData<C>>({
		id: `${uid}-columns`,
		items: () => columns,
		axis: 'horizontal',
		handle: true,
		indicator: () => indicator,
		disabled: () => disabled || !sortableColumns,
		onReorder: (next, detail) => {
			columns = next;
			onColumnMove?.({ column: detail.item, from: detail.from, to: detail.to });
		}
	});

	// Prospective order for preview mode. Indicator mode renders `columns`
	// directly, so no column subtree moves before drop.
	const previewColumns = $derived.by(() => {
		const over = columnsDnd.over;
		if (!over) return columns;
		const list = columns.filter((c) => c.id !== over.source.itemId);
		const index = Math.min(over.index, list.length);
		const column = over.source.item as KanbanColumnData<C>;
		return [...list.slice(0, index), column, ...list.slice(index)];
	});
	const renderedColumns = $derived(indicator ? columns : previewColumns);
	const columnDraggingId = $derived(
		indicator
			? columnsDnd.dragging
			: (columnsDnd.over?.source.itemId ?? columnsDnd.dragging ?? null)
	);

	// The board scrolls horizontally once the columns outgrow it. A scroll container is only
	// reachable by keyboard when it is focusable (WCAG SCR34), so the root becomes a named
	// region with a tab stop exactly while it overflows — never a dead tab stop otherwise.
	// The MutationObserver inside the hook is what re-measures when columns or cards change.
	const overflow = useOverflowObserver({ axis: 'x' });
	const overflows = $derived(overflow.overflowing);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	class={classes.root({ className })}
	data-kanban={uid}
	data-density={density}
	role={overflows ? 'region' : undefined}
	aria-label={overflows ? t.kanbanBoard : undefined}
	tabindex={overflows ? 0 : undefined}
	{@attach overflow.attachment}
	{@attach columnsDnd.list}
	{...attachments}
>
	{#each renderedColumns as column, index (column.id)}
		<div
			class={classes.columnWrapper({ dragging: column.id === columnDraggingId })}
			animate:flip={flipParams}
			{@attach columnsDnd.item(column)}
		>
			<KanbanColumn
				{column}
				{index}
				boardId={uid}
				{classes}
				{sortableColumns}
				{columnHeight}
				{indicator}
				{accepts}
				{disabled}
				{canDrag}
				{cardHandle}
				{density}
				{getColumn}
				{updateCards}
				{applyReorder}
				{applyTransfer}
				{onCardDragStart}
				{onCardDragEnd}
				{card}
				{columnHeader}
				{columnFooter}
				{columnContent}
				{empty}
				{flipParams}
			/>
		</div>
	{/each}
</div>
