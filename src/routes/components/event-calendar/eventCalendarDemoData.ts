import type {
	EventCalendarItem,
	EventCalendarProposedUpdate,
	EventCalendarResource
} from 'svelai/event-calendar';

export type MeetingFields = {
	owner: string;
	attendees: number;
};

export type RoomFields = {
	floor: string;
	capacity?: number;
};

export const EVENT_CALENDAR_DEMO_TIME_ZONE = 'Europe/Paris';

const civilDayFormatter = new Intl.DateTimeFormat('en', {
	timeZone: EVENT_CALENDAR_DEMO_TIME_ZONE,
	dateStyle: 'short'
});

export function validateDemoItemUpdate(
	proposal: EventCalendarProposedUpdate<MeetingFields>
): boolean {
	if (proposal.kind !== 'move' || !proposal.occurrence?.isRecurring) return true;
	if (proposal.item.allDay === true) return false;
	const occurrenceDay = civilDayFormatter.format(proposal.occurrence.start);
	const inclusiveEnd = new Date(proposal.item.end.getTime() - 1);
	return (
		civilDayFormatter.format(proposal.item.start) === occurrenceDay &&
		civilDayFormatter.format(inclusiveEnd) === occurrenceDay
	);
}

export function createDemoItems(): EventCalendarItem<MeetingFields>[] {
	return [
		{
			id: 'planning',
			title: 'Product planning',
			description: 'Align the product scope, owners, and release priorities.',
			start: new Date('2026-07-13T07:00:00.000Z'),
			end: new Date('2026-07-13T08:30:00.000Z'),
			resourceIds: ['studio', 'boardroom'],
			color: 'primary',
			owner: 'Maya',
			attendees: 7
		},
		{
			id: 'standup',
			title: 'Team stand-up',
			description: 'Daily team check-in for progress and blockers.',
			start: new Date('2026-07-14T07:00:00.000Z'),
			end: new Date('2026-07-14T07:30:00.000Z'),
			recurrence: {
				freq: 'daily',
				count: 8,
				exDates: [new Date('2026-07-17T07:00:00.000Z')]
			},
			recurrenceTimeZone: EVENT_CALENDAR_DEMO_TIME_ZONE,
			resourceId: 'boardroom',
			color: 'success',
			owner: 'Noah',
			attendees: 5
		},
		{
			id: 'release',
			title: 'Release window',
			description: 'Reserved deployment window for the July release.',
			start: '2026-07-15',
			end: '2026-07-18',
			allDay: true,
			resourceId: 'studio',
			color: 'warning',
			owner: 'Iris',
			attendees: 12
		},
		{
			id: 'support',
			title: 'Support coverage',
			start: new Date('2026-07-16T06:00:00.000Z'),
			end: new Date('2026-07-16T15:00:00.000Z'),
			display: 'background',
			resourceId: 'lab',
			color: 'info',
			owner: 'Operations',
			attendees: 0
		},
		{
			id: 'handover',
			title: 'Overnight handover',
			start: new Date('2026-07-16T20:30:00.000Z'),
			end: new Date('2026-07-17T01:00:00.000Z'),
			resourceId: 'boardroom',
			color: 'secondary',
			owner: 'Lina',
			attendees: 3
		},
		{
			id: 'unassigned',
			title: 'Vendor call',
			start: new Date('2026-07-15T12:00:00.000Z'),
			end: new Date('2026-07-15T13:00:00.000Z'),
			resourceIds: ['studio', 'boardroom'],
			color: 'neutral',
			owner: 'Sam',
			attendees: 4
		}
	];
}

export function createDemoResources(): EventCalendarResource<RoomFields>[] {
	return [
		{ id: 'hq', title: 'Headquarters', floor: 'Paris' },
		{
			id: 'studio',
			title: 'Studio',
			parentId: 'hq',
			floor: '2',
			capacity: 10,
			businessHours: [{ daysOfWeek: [1, 2, 3, 4, 5], start: '08:00', end: '18:00' }]
		},
		{
			id: 'boardroom',
			title: 'Boardroom',
			parentId: 'hq',
			floor: '3',
			capacity: 16,
			businessHours: [{ daysOfWeek: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }]
		},
		{ id: 'lab', title: 'Lab', parentId: 'hq', floor: '1', capacity: 6, readOnly: true }
	];
}
