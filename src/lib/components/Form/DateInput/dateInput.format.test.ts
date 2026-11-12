import { describe, expect, test } from 'vitest';
import {
	formatDateValue,
	fromPickedDay,
	fromZonedParts,
	parseDateValue,
	toLocalWallClock,
	zonedParts
} from './dateInput.format.js';

const PARIS = 'Europe/Paris';

describe('time zones', () => {
	test('an hour typed in Paris is that hour in Paris, winter and summer', () => {
		expect(parseDateValue('15/01/2026 14:30', 'dd/mm/yyyy HH:MM', '/', PARIS)?.toISOString()).toBe(
			'2026-01-15T13:30:00.000Z'
		);
		expect(parseDateValue('15/07/2026 14:30', 'dd/mm/yyyy HH:MM', '/', PARIS)?.toISOString()).toBe(
			'2026-07-15T12:30:00.000Z'
		);
	});

	test('an instant shows as its Paris day and hour', () => {
		const instant = new Date('2026-12-31T23:30:00.000Z');
		expect(formatDateValue(instant, 'dd/mm/yyyy HH:MM', '/', PARIS)).toBe('01/01/2027 00:30');
		expect(formatDateValue(instant, 'yyyy/mm/dd HH:MM', '-', 'UTC')).toBe('2026-12-31 23:30');
		expect(formatDateValue(instant, 'dd/mm/yyyy', '/', 'America/New_York')).toBe('31/12/2026');
	});

	test('format and parse round-trip across the daylight-saving changes', () => {
		for (const iso of [
			'2026-03-29T00:59:00.000Z',
			'2026-03-29T01:00:00.000Z',
			'2026-10-25T00:30:00.000Z',
			'2026-10-25T02:30:00.000Z'
		]) {
			const text = formatDateValue(new Date(iso), 'dd/mm/yyyy HH:MM', '/', PARIS);
			expect(parseDateValue(text, 'dd/mm/yyyy HH:MM', '/', PARIS)?.toISOString()).toBe(iso);
		}
	});

	test('an hour that occurs twice in autumn reads as its first occurrence', () => {
		// 25/10/2026 02:30 happens at 00:30 UTC (summer time) and again at 01:30 UTC.
		expect(parseDateValue('25/10/2026 02:30', 'dd/mm/yyyy HH:MM', '/', PARIS)?.toISOString()).toBe(
			'2026-10-25T00:30:00.000Z'
		);
	});

	test('an hour skipped by the spring change lands on the hour after it', () => {
		// 29/03/2026 02:30 does not exist in Paris: clocks jump from 02:00 to 03:00.
		const date = fromZonedParts({ year: 2026, month: 3, day: 29, hour: 2, minute: 30 }, PARIS);
		expect(zonedParts(date, PARIS)).toMatchObject({ day: 29, hour: 3, minute: 30 });
	});

	test('the calendar sees the Paris day, and a picked day keeps the hour', () => {
		const instant = new Date('2026-12-31T23:30:00.000Z');
		const shown = toLocalWallClock(instant, PARIS)!;
		expect([shown.getFullYear(), shown.getMonth(), shown.getDate(), shown.getHours()]).toEqual([
			2027, 0, 1, 0
		]);
		const picked = fromPickedDay(new Date(2027, 0, 5), instant, PARIS);
		expect(picked.toISOString()).toBe('2027-01-04T23:30:00.000Z');
		expect(fromPickedDay(new Date(2027, 0, 5), null, PARIS).toISOString()).toBe(
			'2027-01-04T23:00:00.000Z'
		);
	});
});

describe('reading the text', () => {
	test('an incomplete text, an impossible day or hour reads as nothing', () => {
		expect(parseDateValue('15/01/2026 14', 'dd/mm/yyyy HH:MM', '/')).toBeNull();
		expect(parseDateValue('31/02/2026 10:00', 'dd/mm/yyyy HH:MM', '/')).toBeNull();
		expect(parseDateValue('15/01/2026 24:00', 'dd/mm/yyyy HH:MM', '/')).toBeNull();
		expect(parseDateValue('15/01/2026', 'dd/mm/yyyy HH:MM', '/')).toBeNull();
	});

	test('a date-only mask reads midnight, or the hour it is told to keep', () => {
		const midnight = parseDateValue('15/01/2026', 'dd/mm/yyyy', '/', PARIS);
		expect(midnight?.toISOString()).toBe('2026-01-14T23:00:00.000Z');
		const kept = parseDateValue(
			'16/01/2026',
			'dd/mm/yyyy',
			'/',
			PARIS,
			new Date('2026-01-15T13:30:00.000Z')
		);
		expect(kept?.toISOString()).toBe('2026-01-16T13:30:00.000Z');
	});

	test('without a time zone, the browser zone is used as before', () => {
		const date = parseDateValue('05/06/2026 07:08', 'dd/mm/yyyy HH:MM', '/')!;
		expect([date.getDate(), date.getMonth(), date.getHours(), date.getMinutes()]).toEqual([
			5, 5, 7, 8
		]);
		expect(formatDateValue(date, 'mm/dd/yyyy HH:MM', '.')).toBe('06.05.2026 07:08');
		expect(formatDateValue(new Date(2026, 5, 5), 'mm/yy', '/')).toBe('06/26');
	});
});
