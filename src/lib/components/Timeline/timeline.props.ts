import type { Slot } from '$lib/components/Slot/slot.js';
import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TimelineThemeProps } from './timeline.theme.js';

export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelinePlacement = 'start' | 'end' | 'alternate';
export type TimelineSide = 'start' | 'end';
export type TimelineVariant = 'ghost' | 'card' | 'outline' | 'soft';
/**
 * Where a step stands in a process: finished, under way, or still to come. Drives the default
 * marker (a filled check, a ring with a point, a quiet numbered ring) and the outgoing connector
 * (solid after a finished step, faint after the others).
 */
export type TimelineProgress = 'done' | 'current' | 'upcoming';
/**
 * The selection value of an item: its `id`, or its array index when it has no `id`. `1` and `'1'`
 * are different values.
 */
export type TimelineValue = string | number;

export type TimelineItem = {
	/** Stable identity. Use an explicit ID when the array can reorder. */
	id?: string | number;
	/** Required heading rendered by the default item content. */
	title: Slot;
	/** Display-only date. Timeline does not parse, format, or sort this value. */
	date?: Slot;
	/** Machine-readable date value used on the default time element. */
	datetime?: string;
	/** Supporting content rendered below the default title row. */
	description?: Slot;
	/** Replaces the default dot inside the axis marker. */
	icon?: Slot;
	/** Replaces the default marker visual with a Spinner. */
	loading?: boolean;
	/** Marker and outline or soft surface accent. */
	color?: Colors;
	/** Outgoing connector color. Ignored on the final item. */
	connectorColor?: Colors;
	/**
	 * Step progress. A `done` step draws a filled check and a solid outgoing connector, the
	 * `current` step a ring with a point and `aria-current="step"`, an `upcoming` step a quiet ring
	 * with its step number; the connectors after `current` and `upcoming` steps stay faint. An
	 * `icon` replaces the check, the point or the number; `loading` replaces the whole marker.
	 */
	progress?: TimelineProgress;
	/** Logical side override. Valid only when placement is alternate. */
	side?: TimelineSide;
	/**
	 * In a `selectable` timeline, the item cannot be selected and the arrow keys skip it. It still
	 * renders and reads as usual. Ignored when the timeline is not selectable.
	 */
	disabled?: boolean;
};

export type TimelineItemPayload<Item extends TimelineItem> = Readonly<{
	item: Item;
	index: number;
	side: TimelineSide;
	orientation: TimelineOrientation;
	color: Colors;
	connectorColor: Colors;
	isFirst: boolean;
	isLast: boolean;
	/** The item's selection value: its `id`, or its index when it has none. */
	value: TimelineValue;
	/** Whether the timeline is `selectable`. */
	selectable: boolean;
	/** Whether this item is the selected one. Always `false` when the timeline is not selectable. */
	selected: boolean;
	/** Whether this item cannot be selected (`item.disabled` in a selectable timeline). */
	disabled: boolean;
	/**
	 * Selects this item, like a click on it; reports through `onValueChange`. Does nothing when the
	 * timeline is not selectable, the item is disabled or already selected.
	 */
	select: () => void;
	/**
	 * DOM id the item's selection button takes its accessible name from. The default title carries
	 * it; an `item` snippet that does not render `defaultContent()` puts it on its own title.
	 */
	titleId: string;
	defaultContent: Snippet;
	defaultMarker: Snippet;
	defaultOpposite: Snippet;
}>;

type TimelinePlacementProps<Item extends TimelineItem> =
	| {
			/** Places every item on one logical side of the axis. */
			placement?: 'start' | 'end';
			/** Opposite content only exists in alternate placement. */
			opposite?: never;
	  }
	| {
			/** Alternates items around the axis, starting on the end side. */
			placement: 'alternate';
			/** Replaces the opposite track. Its default renderer is the item date. */
			opposite?: Snippet<[TimelineItemPayload<Item>]>;
	  };

/** Payload of Timeline's `onValueChange`. */
export type TimelineValueChangePayload<Item extends TimelineItem = TimelineItem> = {
	/** The newly selected item's value. */
	value: TimelineValue;
	/** The newly selected item, as passed in `items`. */
	item: Item;
	/** Its position in `items`. */
	index: number;
};

type TimelineRootAttributes = Omit<
	HTMLAttributes<HTMLOListElement>,
	'children' | 'class' | 'color'
>;

export type TimelineProps<Item extends TimelineItem = TimelineItem> = WithAttachments<
	TimelineRootAttributes &
		TimelinePlacementProps<Item> & {
			/** Ordered timeline entries. Input order is render order. */
			items: readonly Item[];
			/** Sequence axis. */
			orientation?: TimelineOrientation;
			/** Module-owned item surface treatment. */
			variant?: TimelineVariant;
			/** Typography, marker, icon, and Spinner scale. */
			size?: Sizes;
			/** Gaps, surface padding, and horizontal item width. */
			density?: Density;
			/** Default semantic item accent. */
			color?: Colors;
			/**
			 * Default outgoing connector accent. When omitted, an item with `progress` takes its own
			 * color for its connector, and every other item takes `neutral`.
			 */
			connectorColor?: Colors;
			/** Shows connector segments between markers. */
			showConnectors?: boolean;
			/** Applies the shared inline scroll fade while a horizontal timeline overflows. */
			scrollFade?: boolean;
			/**
			 * Makes each item a toggle button (`aria-pressed`) that selects it on click, Enter or
			 * Space. The items share one tab stop; arrow keys along the orientation, Home and End move
			 * it. Off by default: a display-only timeline renders no buttons.
			 * @default false
			 */
			selectable?: boolean;
			/**
			 * The selected item's value (its `id`, else its index). Bindable. A value naming no item
			 * selects nothing. Read only when `selectable`.
			 */
			value?: TimelineValue;
			/** Initial selected value when `value` is omitted. */
			defaultValue?: TimelineValue;
			/**
			 * Called once per selection change made by a click, Enter, Space or a payload's `select()`,
			 * with `{ value, item, index }`. Not called when the selected item is selected again or
			 * when `value` changes from outside.
			 */
			onValueChange?: (payload: TimelineValueChangePayload<Item>) => void;
			/** Per-instance translations merged over the global i18n catalog. */
			i18n?: Partial<Messages>;
			/** Replaces content inside the module-owned item surface. */
			item?: Snippet<[TimelineItemPayload<Item>]>;
			/** Replaces the marker visual, but not its axis anchor. */
			marker?: Snippet<[TimelineItemPayload<Item>]>;
			/** Bindable reference to the root ordered list. */
			ref?: HTMLOListElement | null;
			/** Additional classes for the root ordered list. */
			class?: string;
			/** Per-instance theme overrides. */
			theme?: TimelineThemeProps;
		}
>;
