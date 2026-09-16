import type { HTMLAttributes } from 'svelte/elements';
import type { Sizes } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { SortableListThemeProps } from './sortableList.theme.js';

/** Payload passed to the `item` and `handle` snippets for each rendered row. */
export type SortableListItemPayload<T> = {
	/** The item this row represents. */
	item: T;
	/** The item's current rendered position (0-based); follows the live preview unless `indicator` is enabled. */
	index: number;
	/** True for the dragged row; in the default mode it is the dimmed placeholder at the prospective slot. */
	isDragging: boolean;
};

/** Payload passed to `onReorder` after a completed drag changes the list order. */
export type SortableListReorderPayload<T> = {
	/** The complete reordered list. */
	items: T[];
	/** The index the item was dragged from (its position before the drag started). */
	from: number;
	/** The index the item was dropped at (its final position). */
	to: number;
	/** The item that moved. */
	item: T;
};

export type SortableListProps<T> = WithAttachments<
	WithSlot<
		HTMLAttributes<HTMLUListElement> & {
			/** The list items, in display order. Objects need a stable unique `id`; primitives are matched by value. Reassigned once at drop; the default mid-drag preview is render-only. Bindable. */
			items: T[];
			/** Drag mode and handle content in one prop. `false` (default): the whole row initiates the drag. `true`: only a grip handle drags, so the row text stays selectable. A snippet/string turns on handle mode and customizes what renders inside the handle (payload `{ item, index, isDragging }`). */
			handle?: boolean | Slot<SortableListItemPayload<T>>;
			/** Disables all dragging; rows still render but cannot be reordered. */
			disabled?: boolean;
			/**
			 * Keep rows in place and show the shared insertion line instead of the
			 * default live placeholder preview.
			 * @default false
			 */
			indicator?: boolean;
			/** Size token controlling row padding, gaps and typography. */
			size?: Sizes;
			/**
			 * Layout and drag axis. `vertical` (default) stacks rows; `horizontal`
			 * lays them in a row; `grid` wraps them (before/after resolves on the
			 * horizontal axis for both) — override the root theme for a real CSS
			 * grid, the drag math is identical.
			 * @default 'vertical'
			 */
			orientation?: 'vertical' | 'horizontal' | 'grid';
			/**
			 * Cross-list group. Lists sharing the same group accept each other's
			 * items: dragging a row into another list of the group inserts it
			 * there (bind:items updates on both sides automatically). Lists in a
			 * group should share the item shape. Captured at mount.
			 */
			group?: string;
			/**
			 * Identifies this list within its `group` — reported as `from`/`to`
			 * in cross-list callbacks. Defaults to an internal unique id.
			 * Captured at mount.
			 */
			name?: string;
			/**
			 * Cross-list accept policy, checked on top of the group match. Return
			 * false to reject (no preview, drop ignored). `from` is the source
			 * list's `name`. Defaults to accepting everything in the group.
			 */
			accepts?: (payload: { item: T; from: string }) => boolean;
			/** Called once when a drag ends and the order changed. */
			onReorder?: (payload: SortableListReorderPayload<T>) => void;
			/** A row from another list of the group was dropped here at `index`. `items` is already updated — this is a notification. `from.index` is the row's index in the source list at drag start. */
			onReceive?: (payload: {
				item: T;
				index: number;
				from: { list: string; index: number };
			}) => void;
			/** One of this list's rows was dropped into another list of the group. `items` is already updated — this is a notification. `index` is the row's index here at the moment of drop. */
			onRemove?: (payload: { item: T; index: number; to: { list: string } }) => void;
			/** A drag of one of this list's rows started. */
			onDragStart?: (payload: { item: T; index: number }) => void;
			/** The drag of one of this list's rows ended (drop or cancel), after state updates. `dropped` is true when it landed on an accepting list. */
			onDragEnd?: (payload: { item: T; dropped: boolean }) => void;
			/**
			 * Rendered inside the list when it has no rows (snippet or string).
			 * Grouped lists should provide it — it gives an empty list a visible,
			 * hittable drop area. Nothing renders by default.
			 */
			empty?: Slot;
			/** Per-instance i18n overrides merged over the global catalog (used for the default handle's aria-label). */
			i18n?: Partial<Messages>;
			/** The class name of the root `<ul>` container. First element the component outputs in the DOM. */
			class?: string;
			/** Bindable reference to the root `<ul>` element. */
			ref?: HTMLElement | null;
			/** Theme overrides for the root, item, content and handle parts. */
			theme?: SortableListThemeProps;
		},
		'item',
		SortableListItemPayload<T>
	>
>;
