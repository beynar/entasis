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
