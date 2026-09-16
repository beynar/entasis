import { describe, expect, it } from 'vitest';
import { useLiveAnnouncer } from './useLiveAnnouncer.svelte.js';

const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

describe('useLiveAnnouncer', () => {
	it('derives the region id from the instance id', () => {
		expect(useLiveAnnouncer('cal-1', 'status').regionId).toBe('cal-1-status');
		expect(useLiveAnnouncer('gantt-1').regionId).toBe('gantt-1-live');
	});

	it('blanks the region first so a repeated message is re-announced', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('Moved to Monday');
		await flush();
		expect(announcer.message).toBe('Moved to Monday');

		announcer.announce('Moved to Monday');
		expect(announcer.message).toBe('');
		await flush();
		expect(announcer.message).toBe('Moved to Monday');
	});

	it('keeps only the last of a burst', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('first');
		announcer.announce('second');
		announcer.announce('third');
		await flush();
		expect(announcer.message).toBe('third');
	});

	it('drops a pending announcement after reset', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('too late');
		announcer.reset();
		await flush();
		expect(announcer.message).toBe('');
	});
});
