import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// Vega-quiet board: columns are soft elevated surfaces, cards one surface step
// above, the drop indicator comes from useDndList. Column color accents render
// as a small dot next to the title (driven by data-color on the column).
const defaultKanban = cva({
	base: 'flex w-full items-start gap-xl overflow-x-auto scrollbar-none'
});

const defaultKanbanColumn = cva({
	base: 'bg-surface-raised ring-neutral-muted flex max-h-full w-72 shrink-0 flex-col rounded-lg ring-1'
});

const defaultKanbanColumnHeader = cva({
	base: 'flex items-center gap-md',
	variants: {
		sortable: {
			true: 'cursor-grab',
			false: ''
		},
		density: {
			compact: 'px-md py-md',
			normal: 'px-lg py-md',
			comfortable: 'px-xl py-lg'
		}
	},
	defaultVariants: {
		sortable: false,
		density: 'normal'
	}
});

const defaultKanbanColumnDot = cva({
	base: 'bg-color size-2 shrink-0 rounded-full'
});

const defaultKanbanColumnTitle = cva({
	base: 'text-neutral flex-1 truncate text-sm font-medium'
});

const defaultKanbanCount = cva({
	base: 'text-neutral/70 bg-neutral-muted rounded-full px-sm py-micro text-xs tabular-nums'
});

const defaultKanbanList = cva({
	// data-dnd-over comes from useDndList when an accepted drag hovers the list.
	// pt keeps the first card's ring/shadow clear of the scroll container edge.
	base: 'flex min-h-row-lg flex-1 flex-col overflow-y-auto scrollbar-none rounded-b-lg transition-colors data-[dnd-over=true]:bg-primary/5',
	variants: {
		density: {
			compact: 'gap-xs p-sm pt-xs',
			normal: 'gap-sm p-md pt-xs',
			comfortable: 'gap-md p-md pt-sm'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultKanbanCard = cva({
	base: 'bg-surface-floating ring-neutral-muted rounded-md text-sm lift-1 ring-1 select-none',
	variants: {
		density: {
			compact: 'px-md py-sm',
			normal: 'px-lg py-md',
			comfortable: 'px-xl py-lg'
		},
		handle: {
			// With a grip handle the card body is not the drag activator.
			true: 'flex items-start gap-md',
			false: 'cursor-grab'
		}
	},
	defaultVariants: {
		density: 'normal',
		handle: false
	}
});

const defaultKanbanCardTitle = cva({
	base: 'text-neutral font-medium leading-normal'
});

const defaultKanbanCardDescription = cva({
	base: 'text-neutral/70 mt-micro text-xs leading-normal'
});

const defaultKanbanEmpty = cva({
	base: 'text-neutral/70 px-md py-xl text-center text-xs'
});

// Rendered below the card list (columnFooter snippet / the `footer` param of
// the column snippet).
const defaultKanbanFooter = cva({
	base: '',
	variants: {
		density: {
			compact: 'p-sm pt-xs',
			normal: 'p-md pt-xs',
			comfortable: 'p-md pt-sm'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// Per-card wrapper (the dnd row). `dragging` marks the dimmed placeholder.
const defaultKanbanCardWrapper = cva({
	base: '',
	variants: {
		dragging: {
			true: 'opacity-40',
			false: ''
		}
	},
	defaultVariants: {
		dragging: false
	}
});

// Per-column wrapper (the dnd row of the board). `dragging` marks the dimmed
// placeholder while a column is dragged.
const defaultKanbanColumnWrapper = cva({
	base: 'shrink-0',
	variants: {
		dragging: {
			true: 'opacity-40',
			false: ''
		}
	},
	defaultVariants: {
		dragging: false
	}
});

// The grip rendered by the DEFAULT card when cardHandle is on.
const defaultKanbanCardHandle = cva({
	base: 'text-neutral/70 hover:text-neutral mt-micro inline-flex shrink-0 cursor-grab items-center justify-center'
});

export const kanbanTheme = {
	root: defaultKanban,
	column: defaultKanbanColumn,
	columnWrapper: defaultKanbanColumnWrapper,
	columnHeader: defaultKanbanColumnHeader,
	columnDot: defaultKanbanColumnDot,
	columnTitle: defaultKanbanColumnTitle,
	count: defaultKanbanCount,
	list: defaultKanbanList,
	card: defaultKanbanCard,
	cardWrapper: defaultKanbanCardWrapper,
	cardHandle: defaultKanbanCardHandle,
	cardTitle: defaultKanbanCardTitle,
	cardDescription: defaultKanbanCardDescription,
	empty: defaultKanbanEmpty,
	footer: defaultKanbanFooter
};

export type KanbanTheme = typeof kanbanTheme;
export type KanbanThemeProps = InferComponentTheme<KanbanTheme>;
export const setKanbanTheme = setComponentTheme<KanbanTheme>('kanban');
export const useKanbanTheme = useComponentTheme<KanbanTheme>('kanban', kanbanTheme);
