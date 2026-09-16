import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Colors, Density } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { KanbanThemeProps } from './kanban.theme.js';

/** Minimal card shape; extend it with your own fields and render them via the
 * card snippet. Only `id` is required — `title`/`description` feed the DEFAULT
 * card renderer (which falls back to `id` without a title). */
export type KanbanCard = {
	/** Stable unique id of the card (across the whole board). */
	id: string;
	/** Title rendered by the default card; falls back to `id`. */
	title?: string;
	/** Muted second line rendered by the default card. */
	description?: string;
};

export type KanbanColumnData<C extends KanbanCard = KanbanCard> = {
	/** Stable unique id of the column. */
	id: string;
	/** Column title. */
	title: string;
	/** Cards in the column, in order. */
	cards: C[];
	/** Optional color accent (dot next to the title, driven by tokens). */
	color?: Colors;
	/** Maximum number of cards; a full column rejects incoming drops. */
	limit?: number;
};

/** Payload passed to the `card` slot for each rendered card. */
export type KanbanCardPayload<C extends KanbanCard = KanbanCard> = {
	/** The card being rendered. */
	card: C;
	/** The column the card belongs to. */
	column: KanbanColumnData<C>;
	/** The card's rendered position (follows the live preview unless `indicator` is on). */
	index: number;
	/** The column's rendered position. */
	columnIndex: number;
	/** True for the dragged card. */
	isDragging: boolean;
	/** Ready-made drag grip; renders nothing unless `cardHandle` is on. */
	handle: Snippet;
};

/** Payload passed to the `columnHeader` and `columnFooter` slots. */
export type KanbanColumnPayload<C extends KanbanCard = KanbanCard> = {
	/** The column being rendered. */
	column: KanbanColumnData<C>;
	/** The column's rendered position. */
	index: number;
};

/** Payload passed to the `column` slot, which composes a whole column. */
export type KanbanColumnContentPayload<C extends KanbanCard = KanbanCard> =
	KanbanColumnPayload<C> & {
		/** The default column header. */
		header: Snippet;
		/** The dnd-wired card list. */
		items: Snippet;
		/** The default column footer. */
		footer: Snippet;
	};

/** Payload passed to the `empty` slot of a column with no cards. */
export type KanbanEmptyPayload<C extends KanbanCard = KanbanCard> = {
	/** The empty column. */
	column: KanbanColumnData<C>;
};

export type KanbanCardMove<C extends KanbanCard = KanbanCard> = {
	card: C;
	/** For cross-column moves, `index` is the card's index in the source column at drag start. */
	from: { columnId: string; index: number };
	to: { columnId: string; index: number };
	/** The board state after the move — the same array `bind:columns` receives. */
	columns: KanbanColumnData<C>[];
};

export type KanbanColumnMove<C extends KanbanCard = KanbanCard> = {
	column: KanbanColumnData<C>;
	from: number;
	to: number;
};

export type KanbanProps<C extends KanbanCard = KanbanCard> = WithAttachments<
	HTMLAttributes<HTMLDivElement> & {
		/**
		 * The board data. Bindable — the component reassigns it on card and
		 * column moves.
		 */
		columns: KanbanColumnData<C>[];
		/**
		 * Move policy for cards crossing columns. Return false to reject (no
		 * indicator, drop ignored). Column `limit` is enforced on top of this.
		 * Defaults to allowing every move.
		 */
		accepts?: (payload: { card: C; from: KanbanColumnData<C>; to: KanbanColumnData<C> }) => boolean;
		/** Called once per completed card move (same-column reorders included), after `columns` was reassigned — `payload.columns` is the new state. */
		onCardMove?: (payload: KanbanCardMove<C>) => void;
		/** Called when a column is reordered by dragging its header. */
		onColumnMove?: (payload: KanbanColumnMove<C>) => void;
		/** A card drag started. */
		onCardDragStart?: (payload: { card: C; column: KanbanColumnData<C>; index: number }) => void;
		/** A card drag ended (drop or cancel), after state updates. `dropped` is true when it landed on an accepting column. */
		onCardDragEnd?: (payload: { card: C; dropped: boolean }) => void;
		/**
		 * Columns can be reordered by dragging their header.
		 * @default true
		 */
		sortableColumns?: boolean;
		/**
		 * Disables all dragging — cards and columns render but cannot move.
		 * @default false
		 */
		disabled?: boolean;
		/** Per-card drag gate, checked when a drag is attempted. Return false to keep the card in place. */
		canDrag?: (payload: { card: C; column: KanbanColumnData<C> }) => boolean;
		/**
		 * Cards drag only from an element marked `data-dnd-handle` instead of the
		 * whole card — for cards with interactive content (buttons, links). The
		 * default card renders a grip; custom card snippets must mark their own
		 * handle element.
		 * @default false
		 */
		cardHandle?: boolean;
		/**
		 * Spacing token: header/list/card paddings and gaps. `normal` matches the
		 * previous fixed spacing.
		 * @default 'normal'
		 */
		density?: Density;
		/**
		 * Fixed column height (any CSS length, e.g. '28rem'). Card lists scroll
		 * inside it, and auto-scroll when a drag hovers near their edges — so
		 * cards can be dropped anywhere in a long column. Omit for auto height.
		 */
		columnHeight?: string;
		/**
		 * Keep cards and columns in place while dragging and show the shared
		 * insertion line instead of the default live placeholder preview.
		 * @default false
		 */
		indicator?: boolean;
		/**
		 * Animate FLIP movement in the live preview and the final settling after a
		 * drop. The bound state only changes at drop. Disabled automatically when
		 * the Theme reports reduced motion.
		 * @default true
		 */
		animated?: boolean;
		/** Custom card renderer; the default renders title + description. `index`
		 * is the card's rendered position and `columnIndex` the column's rendered
		 * position (both follow the live preview unless `indicator` is enabled);
		 * `isDragging` identifies the dragged card. `handle` is the
		 * ready-made drag grip (marked data-dnd-handle) — render it wherever the
		 * grip belongs; it renders nothing unless `cardHandle` is on. */
		card?: Slot<KanbanCardPayload<C>>;
		/** Custom column header; the default renders dot + title + count. `index`
		 * is the column's rendered position (follows the live preview unless
		 * `indicator` is enabled). */
		columnHeader?: Slot<KanbanColumnPayload<C>>;
		/** Rendered below the card list (e.g. an "Add card" button). */
		columnFooter?: Slot<KanbanColumnPayload<C>>;
		/**
		 * Full column composition. Receives the column data plus the ready-made
		 * `header`, `items` and `footer` snippets — `items` is the dnd-wired card
		 * list (drop target and selected feedback mode included): render it
		 * wherever cards should live and build any chrome around it, without
		 * recoding the drag machinery. Replaces the default header/items/footer
		 * layout inside the column shell.
		 */
		column?: Slot<KanbanColumnContentPayload<C>>;
		/** Rendered inside an empty column's list (nothing renders by default —
		 * the list keeps its min-height and hover tint as the drop area). */
		empty?: Slot<KanbanEmptyPayload<C>>;
		/** Additional classes for the board container. */
		class?: string;
		/** Bindable reference to the board's root element. */
		ref?: HTMLElement | null;
		/** Theme overrides for the board parts. */
		theme?: KanbanThemeProps;
	}
>;
