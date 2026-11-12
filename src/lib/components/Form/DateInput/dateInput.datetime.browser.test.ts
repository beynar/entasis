// `type="datetime"` edits the day and the hour; `timeZone` decides which zone's day and hour.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './DateTimeHarness.test.svelte';

const box = () => page.getByRole('textbox', { name: 'When' });
const input = () => box().element() as HTMLInputElement;

test('a datetime shows and reads the day and the hour in the given zone', async () => {
	const seen: (Date | null)[] = [];
	await render(Harness, {
		props: {
			value: new Date('2026-01-15T13:30:00.000Z'),
			timeZone: 'Europe/Paris',
			onValueChange: (value: Date | null) => seen.push(value)
		}
	});
	await expect.poll(() => input().value).toBe('15/01/2026 14:30');
	expect(input().placeholder).toBe('dd/mm/yyyy HH:MM');

	await userEvent.clear(box());
	await userEvent.type(box(), '200720260945');
	await expect.poll(() => input().value).toBe('20/07/2026 09:45');
	await expect.poll(() => seen.at(-1)?.toISOString()).toBe('2026-07-20T07:45:00.000Z');
});

test('picking a day in the calendar keeps the hour', async () => {
	const seen: (Date | null)[] = [];
	await render(Harness, {
		props: {
			value: new Date('2026-01-15T13:30:00.000Z'),
			timeZone: 'Europe/Paris',
			onValueChange: (value: Date | null) => seen.push(value)
		}
	});
	await userEvent.click(box());
	await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
	const day = document.querySelector<HTMLElement>('dialog[open] [data-date="2026-01-20"]');
	expect(day).not.toBeNull();
	await userEvent.click(day!);
	await expect.poll(() => seen.at(-1)?.toISOString()).toBe('2026-01-20T13:30:00.000Z');
	await expect.poll(() => input().value).toBe('20/01/2026 14:30');
});

test('a date input stays day-only', async () => {
	await render(Harness, { props: { type: 'date', value: new Date(2026, 0, 15, 14, 30) } });
	await expect.poll(() => input().value).toBe('15/01/2026');
	expect(input().placeholder).toBe('dd/mm/yyyy');
});

test("Form's datetime entry edits the hour and takes the entry's time zone", async () => {
	const values: unknown[] = [];
	await render(Harness, {
		props: { inForm: true, onFormValue: (value: unknown) => values.push(value) }
	});
	await userEvent.type(box(), '010320260800');
	await expect
		.poll(() => (values.at(-1) as { when?: Date } | undefined)?.when?.toISOString())
		.toBe('2026-03-01T07:00:00.000Z');
});
