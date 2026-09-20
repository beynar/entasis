import { disableNativeDragPreview, draggable } from '$lib/utils/pragmaticDragAndDrop.js';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { EventCalendarItem } from './eventCalendar.types.js';

const EXTERNAL_EVENT_SOURCE_MARK = 'entasis-event-calendar-external-event';

export type EventCalendarExternalDragSource<TItemFields extends object> = {
	kind: 'external';
	item: EventCalendarItem<TItemFields>;
};

export function externalEvent<TItemFields extends object = Record<never, never>>(
	createItem: () => EventCalendarItem<TItemFields>
): Attachment<HTMLElement> {
	return (element) =>
		untrack(() =>
			draggable({
				element,
				onGenerateDragPreview: ({ nativeSetDragImage }) =>
					disableNativeDragPreview({ nativeSetDragImage }),
				getInitialData: () => ({
					mark: EXTERNAL_EVENT_SOURCE_MARK,
					item: createItem()
				})
			})
		);
}

export function readEventCalendarExternalDragSource<TItemFields extends object>(
	data: Record<string, unknown>
): EventCalendarExternalDragSource<TItemFields> | null {
	if (
		data.mark !== EXTERNAL_EVENT_SOURCE_MARK ||
		data.item === null ||
		typeof data.item !== 'object' ||
		Array.isArray(data.item)
	) {
		return null;
	}
	// The receiving calendar performs full item and recurrence validation before using the payload.
	return { kind: 'external', item: data.item as EventCalendarItem<TItemFields> };
}
