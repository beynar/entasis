import type { Colors } from '$lib/types/theme.js';
import type {
	TimelineItem,
	TimelineOrientation,
	TimelinePlacement,
	TimelineSide,
	TimelineValue
} from './timeline.props.js';

export type ResolvedTimelineItem<Item extends TimelineItem> = Readonly<{
	key: string;
	/** Selection value: the explicit `id`, else the array index. */
	value: TimelineValue;
	item: Item;
	index: number;
	side: TimelineSide;
	orientation: TimelineOrientation;
	color: Colors;
	connectorColor: Colors;
	isFirst: boolean;
	isLast: boolean;
}>;

function formatTimelineId(id: string | number): string {
	return typeof id === 'string' ? `"${id}"` : String(id);
}

export function resolveTimelineItems<Item extends TimelineItem>(
	items: readonly Item[],
	orientation: TimelineOrientation,
	placement: TimelinePlacement,
	color: Colors,
	connectorColor: Colors | undefined,
	selectable = false
): readonly ResolvedTimelineItem<Item>[] {
	const explicitIds = new Set<string | number>();

	const resolved = items.map((timelineItem, index) => {
		const explicitId = timelineItem.id;
		if (explicitId !== undefined && explicitIds.has(explicitId)) {
			throw new TypeError(
				`Timeline item IDs must be unique. Duplicate ID ${formatTimelineId(explicitId)} at index ${index}.`
			);
		}
		if (explicitId !== undefined) {
			explicitIds.add(explicitId);
		}

		if (placement !== 'alternate' && timelineItem.side !== undefined) {
			throw new TypeError(
				`Timeline item side is only valid when placement="alternate". Remove side from the item at index ${index} or change the placement.`
			);
		}

		const side: TimelineSide =
			placement === 'alternate'
				? (timelineItem.side ?? (index % 2 === 0 ? 'end' : 'start'))
				: placement;

		const itemColor = timelineItem.color ?? color;

		let key = `index:${index}`;
		if (explicitId !== undefined) {
			key = `id:${typeof explicitId}:${explicitId}`;
		}

		return {
			key,
			value: explicitId ?? index,
			item: timelineItem,
			index,
			side,
			orientation,
			color: itemColor,
			// A progress band reads as one stroke: its connectors follow the step's own color
			// unless a connector color is set on the item or the root.
			connectorColor:
				timelineItem.connectorColor ??
				connectorColor ??
				(timelineItem.progress ? itemColor : 'neutral'),
			isFirst: index === 0,
			isLast: index === items.length - 1
		};
	});

	// An item without an `id` is selected by its index, which must not name another item's numeric
	// `id`: one value would then select two items.
	if (selectable) {
		for (const entry of resolved) {
			if (entry.item.id === undefined && explicitIds.has(entry.index)) {
				throw new TypeError(
					`Timeline item at index ${entry.index} has no ID, so its selection value is ${entry.index}, which is also another item's ID. Give it an ID.`
				);
			}
		}
	}

	return resolved;
}
