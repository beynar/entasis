import type { Colors } from '$lib/types/theme.js';
import type {
	TimelineItem,
	TimelineOrientation,
	TimelinePlacement,
	TimelineSide
} from './timeline.props.js';

export type ResolvedTimelineItem<Item extends TimelineItem> = Readonly<{
	key: string;
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
	connectorColor: Colors
): readonly ResolvedTimelineItem<Item>[] {
	const explicitIds = new Set<string | number>();

	return items.map((timelineItem, index) => {
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

		let key = `index:${index}`;
		if (explicitId !== undefined) {
			key = `id:${typeof explicitId}:${explicitId}`;
		}

		return {
			key,
			item: timelineItem,
			index,
			side,
			orientation,
			color: timelineItem.color ?? color,
			connectorColor: timelineItem.connectorColor ?? connectorColor,
			isFirst: index === 0,
			isLast: index === items.length - 1
		};
	});
}
