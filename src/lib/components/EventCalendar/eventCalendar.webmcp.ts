// How an EventCalendar appears to AI agents: `read_calendar`, `show_calendar`, and `move_event`
// while a person could drag. Creating is the app's own dialog, whose Form is its own tool.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type {
	EventCalendarApi,
	EventCalendarDateOnly,
	EventCalendarOccurrence,
	EventCalendarRange,
	EventCalendarUpdateAdjustment,
	EventCalendarView
} from './eventCalendar.types.js';

export type EventCalendarToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly api: EventCalendarApi<object>;
	readonly disabled: boolean;
	readonly canDrag: boolean;
	readonly timeZone: string;
	/** The rules a person's gestures go through: resources, background events, item flags. */
	readonly canMove: (occurrence: EventCalendarOccurrence<object>) => boolean;
	readonly canResize: (occurrence: EventCalendarOccurrence<object>) => boolean;
	readonly views: readonly EventCalendarView[];
};

const parseDate = (value: unknown): Date | null => {
	if (typeof value !== 'string') return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A day in the calendar's time zone. */
const dayOf = (date: Date, timeZone: string): string =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);

const daysBetween = (start: string, end: string): number =>
	Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);

const describe = (occurrence: EventCalendarOccurrence<object>, timeZone: string) => ({
	key: occurrence.key,
	title: occurrence.item.title,
	description: occurrence.item.description,
	start: occurrence.allDay ? dayOf(occurrence.start, timeZone) : occurrence.start.toISOString(),
	end: occurrence.allDay ? dayOf(occurrence.end, timeZone) : occurrence.end.toISOString(),
	allDay: occurrence.allDay,
	recurring: occurrence.isRecurring
});

/** The new placement, as the event's kind takes it, and whether it changes the event's length. */
function placement(
	source: EventCalendarToolSource,
	occurrence: EventCalendarOccurrence<object>,
	input: Record<string, unknown>
) {
	const { start, end } = input;
	if (occurrence.allDay) {
		if (typeof start !== 'string' || typeof end !== 'string') return null;
		if (!DATE_ONLY.test(start) || !DATE_ONLY.test(end)) return null;
		const before = describe(occurrence, source.timeZone);
		return {
			adjustment: { start, end } as EventCalendarUpdateAdjustment,
			resized: daysBetween(start, end) !== daysBetween(before.start, before.end)
		};
	}
	const nextStart = parseDate(start);
	const nextEnd = parseDate(end);
	if (!nextStart || !nextEnd) return null;
	return {
		adjustment: { start: nextStart, end: nextEnd } as EventCalendarUpdateAdjustment,
		resized:
			nextEnd.getTime() - nextStart.getTime() !==
			occurrence.end.getTime() - occurrence.start.getTime()
	};
}

function moveEvent(source: EventCalendarToolSource, input: Record<string, unknown>) {
	const occurrence = typeof input.key === 'string' ? source.api.getOccurrence(input.key) : null;
	const next = occurrence && placement(source, occurrence, input);
	if (!occurrence || !next) return { status: 'invalid', message: 'Unknown event or date.' };
	if (!source.canMove(occurrence)) {
		return { status: 'refused', message: 'This event cannot be moved.' };
	}
	// A drag keeps the length: changing it is a resize, which has its own switches.
	if (next.resized && !source.canResize(occurrence)) {
		return { status: 'refused', message: 'The length of this event cannot change.' };
	}
	try {
		// The same validation and callbacks as a drag; what it refuses it reports by throwing.
		source.api.updateOccurrence(occurrence.key, next.adjustment);
	} catch {
		return { status: 'refused', message: 'This event cannot go there.' };
	}
	return { status: 'done', key: occurrence.key };
}

export const expose: WebMCPExpose<EventCalendarToolSource> = (source, config) => {
	const exposure = () => ({
		exposedTo: exposureOf(source.tool, config),
		modal: config.surface
	});
	const stops = [
		watchWebMCPTool(
			() => ({
				name: 'read_calendar',
				description:
					'Reads the events between two dates, or those of the period on screen without dates.',
				inputSchema: {
					type: 'object',
					properties: {
						from: { type: 'string', format: 'date-time' },
						to: { type: 'string', format: 'date-time' }
					},
					additionalProperties: false
				},
				annotations: { readOnlyHint: true, untrustedContentHint: true },
				execute: ({ from, to }: { from?: unknown; to?: unknown }) => {
					const start = parseDate(from);
					const end = parseDate(to);
					const range = start && end ? ({ start, end } as EventCalendarRange) : undefined;
					return {
						events: source.api
							.getOccurrences(range)
							.map((occurrence) => describe(occurrence, source.timeZone))
					};
				}
			}),
			exposure
		),
		watchWebMCPTool(
			() => ({
				name: 'show_calendar',
				description: 'Shows a date, a view, or both, on the calendar.',
				inputSchema: {
					type: 'object',
					properties: {
						date: { type: 'string', format: 'date' },
						view: { type: 'string', enum: [...source.views] }
					},
					additionalProperties: false
				},
				execute: ({ date, view }: { date?: unknown; view?: unknown }) => {
					// A day in the calendar's own time zone, which `goTo` reads a date-only string in.
					const target = typeof date === 'string' && DATE_ONLY.test(date) ? date : null;
					if (date !== undefined && !target) return { status: 'invalid' };
					if (view !== undefined && !source.views.includes(view as EventCalendarView)) {
						return { status: 'invalid' };
					}
					if (view) source.api.setView(view as EventCalendarView);
					if (target) source.api.goTo(target as EventCalendarDateOnly);
					return { status: 'done' };
				}
			}),
			exposure
		),
		watchWebMCPTool(() => {
			if (source.disabled || !source.canDrag) return null;
			const options = toolOptions(source.tool);
			return {
				name: options.name ?? 'move_event',
				title: options.title,
				description:
					options.description ?? 'Moves an event to a new start and end. Read the calendar first.',
				inputSchema: {
					type: 'object',
					properties: {
						key: { type: 'string', description: 'The key read_calendar gives.' },
						start: {
							type: 'string',
							description: 'A date-time, or a date for an all-day event, as read_calendar gives.'
						},
						end: {
							type: 'string',
							description: 'A date-time, or a date for an all-day event, as read_calendar gives.'
						}
					},
					required: ['key', 'start', 'end'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? true },
				execute: (input: Record<string, unknown>) => moveEvent(source, input)
			};
		}, exposure)
	];
	return () => {
		for (const stop of stops) stop();
	};
};
