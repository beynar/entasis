import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Countdown from './Countdown.svelte';
import type { CountdownPayload } from './countdown.js';

const START = Date.UTC(2026, 10, 2, 12, 0, 0);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timer = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[data-slot="countdown"]')!;
// Intl separates numbers and units with (narrow) no-break spaces in some locales.
const text = (container: HTMLElement) => timer(container).textContent?.replace(/\s+/g, ' ').trim();

// `Document` here carries the library's custom-event overloads; dispatch as a plain target.
const showPage = () =>
	EventTarget.prototype.dispatchEvent.call(document, new Event('visibilitychange'));

/** Advances the fake clock and lets Svelte flush the resulting state change. */
const advance = async (ms: number) => {
	await vi.advanceTimersByTimeAsync(ms);
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(START);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('Countdown formats', () => {
	test('reads the largest unit in English by default', () => {
		const { container } = render(Countdown, {
			props: { until: new Date(START + 3 * DAY + 4 * HOUR), locale: 'en' }
		});
		expect(text(container)).toBe('3 days');
	});

	test('reads French and joins several units with the locale list pattern', () => {
		const { container } = render(Countdown, {
			props: { until: new Date(START + 3 * DAY + 4 * HOUR), locale: 'fr', units: 2 }
		});
		expect(text(container)).toBe('3 jours et 4 heures');
	});

	test('follows the I18n locale when no locale prop is given', () => {
		const { container } = render(Countdown, {
			props: { until: START + 12 * MINUTE }
		});
		expect(text(container)).toBe('12 minutes');
	});

	test('units counts from the largest unit and drops zero units', () => {
		const until = START + 3 * DAY + 5 * MINUTE + 7 * SECOND;
		const two = render(Countdown, { props: { until, units: 2, locale: 'en' } });
		expect(text(two.container)).toBe('3 days');
		const three = render(Countdown, { props: { until, units: 3, locale: 'en' } });
		expect(text(three.container)).toBe('3 days, 5 minutes');
		const four = render(Countdown, { props: { until, units: 4, locale: 'en' } });
		expect(text(four.container)).toBe('3 days, 5 minutes, 7 seconds');
	});

	test('accepts ISO strings and epoch milliseconds', () => {
		const iso = render(Countdown, {
			props: { until: new Date(START + 2 * HOUR).toISOString(), locale: 'en' }
		});
		expect(text(iso.container)).toBe('2 hours');
		const epoch = render(Countdown, { props: { until: START + 2 * HOUR, locale: 'en' } });
		expect(text(epoch.container)).toBe('2 hours');
	});

	test('clock format shows hours only when present and spells every unit for screen readers', () => {
		const { container } = render(Countdown, {
			props: { until: START + 2 * HOUR + 14 * MINUTE + 5 * SECOND, format: 'clock', locale: 'en' }
		});
		const clock = container.querySelector('[data-slot="countdown-clock"]')!;
		expect(clock).toHaveTextContent('2:14:05');
		expect(clock).toHaveAttribute('aria-hidden', 'true');
		expect(container.querySelector('[data-slot="countdown-spoken"]')).toHaveTextContent(
			'2 hours, 14 minutes, 5 seconds'
		);

		const short = render(Countdown, {
			props: { until: START + 14 * MINUTE + 5 * SECOND, format: 'clock', locale: 'en' }
		});
		expect(short.container.querySelector('[data-slot="countdown-clock"]')).toHaveTextContent(
			'14:05'
		);
	});

	test('clock format puts the days in front', () => {
		const { container } = render(Countdown, {
			props: { until: START + 2 * DAY + 3 * HOUR + 4 * SECOND, format: 'clock', locale: 'fr' }
		});
		expect(container.querySelector('[data-slot="countdown-clock"]')).toHaveTextContent(
			'2j 03:00:04'
		);
	});

	test('reads the localized "now" once reached', () => {
		const en = render(Countdown, { props: { until: START - SECOND, locale: 'en' } });
		expect(text(en.container)).toBe('now');
		expect(timer(en.container)).toHaveAttribute('data-done');
		const fr = render(Countdown, { props: { until: START, locale: 'fr' } });
		expect(text(fr.container)).toBe('maintenant');
	});
});

describe('Countdown semantics', () => {
	test('renders a time element with the ISO datetime and the timer role', () => {
		const until = new Date(START + 90 * MINUTE);
		const { container, getByRole } = render(Countdown, {
			props: { until, locale: 'en', class: 'extra', 'data-testid': 'cd' }
		});
		const root = getByRole('timer');
		expect(root.tagName).toBe('TIME');
		expect(root).toHaveAttribute('datetime', until.toISOString());
		expect(root).not.toHaveAttribute('aria-live');
		expect(root).toHaveClass('extra');
		expect(root).toHaveAttribute('data-testid', 'cd');
		expect(root).not.toHaveAttribute('data-done');
		expect(timer(container)).toBe(root);
	});
});

describe('Countdown scheduling', () => {
	test('changes the text exactly at unit boundaries and not in between', async () => {
		const { container } = render(Countdown, {
			props: { until: START + 2 * MINUTE + 30 * SECOND, locale: 'en' }
		});
		await advance(0);
		expect(text(container)).toBe('2 minutes');
		// Nothing is armed for the next 30.999 s but the boundary timer.
		expect(vi.getTimerCount()).toBe(1);

		await advance(31 * SECOND - 1);
		expect(text(container)).toBe('2 minutes');
		await advance(1);
		expect(text(container)).toBe('1 minute');

		await advance(60 * SECOND - 1);
		expect(text(container)).toBe('1 minute');
		await advance(1);
		expect(text(container)).toBe('59 seconds');

		await advance(SECOND);
		expect(text(container)).toBe('58 seconds');
	});

	test('a long wait wakes once per displayed change, not every second', async () => {
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const { container } = render(Countdown, {
			props: { until: START + 3 * DAY + 4 * HOUR, locale: 'en' }
		});
		await advance(0);
		setTimeoutSpy.mockClear();

		// Remaining time rounds up to the second: "3 days" holds until 2 d 23:59:59 is left.
		await advance(4 * HOUR + SECOND - 1);
		expect(text(container)).toBe('3 days');
		await advance(1);
		expect(text(container)).toBe('2 days');
		// One wake-up for the whole wait, then the next one armed a day ahead.
		expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(setTimeoutSpy.mock.calls[0][1]).toBe(DAY);
		setTimeoutSpy.mockRestore();
	});

	test('two units tick at the second unit boundary', async () => {
		const { container } = render(Countdown, {
			props: { until: START + DAY + 2 * HOUR + 30 * MINUTE, units: 2, locale: 'en' }
		});
		await advance(0);
		expect(text(container)).toBe('1 day, 2 hours');
		await advance(30 * MINUTE + SECOND - 1);
		expect(text(container)).toBe('1 day, 2 hours');
		await advance(1);
		expect(text(container)).toBe('1 day, 1 hour');
	});

	test('the clock ticks every second', async () => {
		const { container } = render(Countdown, {
			props: { until: START + 3 * SECOND, format: 'clock', locale: 'en' }
		});
		await advance(0);
		const clock = () => container.querySelector('[data-slot="countdown-clock"]')?.textContent;
		expect(clock()).toBe('0:03');
		await advance(SECOND);
		expect(clock()).toBe('0:02');
		await advance(2 * SECOND);
		expect(text(container)).toBe('now');
	});

	test('calls onComplete once when reached and stops scheduling', async () => {
		const onComplete = vi.fn();
		const { container } = render(Countdown, {
			props: { until: START + 2 * SECOND, locale: 'en', onComplete }
		});
		await advance(0);
		expect(onComplete).not.toHaveBeenCalled();
		await advance(2 * SECOND);
		expect(text(container)).toBe('now');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
		await advance(10 * SECOND);
		showPage();
		await advance(0);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test('calls onComplete on mount when until has already passed', async () => {
		const onComplete = vi.fn();
		render(Countdown, { props: { until: START - DAY, onComplete } });
		await advance(0);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test('resyncs when the page becomes visible again', async () => {
		const { container } = render(Countdown, {
			props: { until: START + 10 * MINUTE, locale: 'en' }
		});
		await advance(0);
		expect(text(container)).toBe('10 minutes');
		// A throttled background tab: the wall clock moves while no timer fires.
		vi.setSystemTime(START + 5 * MINUTE + 30 * SECOND);
		showPage();
		await advance(0);
		expect(text(container)).toBe('4 minutes');
	});

	test('clears its timer and listener on destroy', async () => {
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const { unmount } = render(Countdown, {
			props: { until: START + HOUR, locale: 'en' }
		});
		await advance(0);
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
		expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
		removeSpy.mockRestore();
	});
});

describe('Countdown children payload', () => {
	test('passes remaining, parts, label, done and fraction', async () => {
		const payloads: CountdownPayload[] = [];
		const children = createRawSnippet((payload: () => CountdownPayload) => {
			payloads.push(payload());
			return {
				render: () => `<span data-testid="custom">${payload().label}</span>`,
				setup: () => {}
			};
		});
		const { getByTestId } = render(Countdown, {
			props: {
				until: START + DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND,
				from: START - DAY,
				units: 2,
				locale: 'en',
				children
			}
		});
		expect(getByTestId('custom')).toHaveTextContent('1 day, 2 hours');
		expect(payloads.at(-1)).toEqual({
			remaining: DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND,
			days: 1,
			hours: 2,
			minutes: 3,
			seconds: 4,
			label: '1 day, 2 hours',
			done: false,
			fraction: DAY / (2 * DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND)
		});
	});

	test('fraction is null without from and reaches 1 when done', async () => {
		let last: CountdownPayload | undefined;
		const children = createRawSnippet((payload: () => CountdownPayload) => ({
			render: () => '<span></span>',
			setup: () => {
				$effect(() => {
					last = payload();
				});
			}
		}));
		const noFrom = render(Countdown, { props: { until: START + HOUR, children } });
		await advance(0);
		expect(last?.fraction).toBeNull();
		noFrom.unmount();

		render(Countdown, { props: { until: START + 10 * SECOND, from: START, children } });
		await advance(0);
		expect(last?.fraction).toBe(0);
		await advance(5 * SECOND);
		expect(last?.fraction).toBe(0.5);
		await advance(5 * SECOND);
		expect(last).toMatchObject({ fraction: 1, done: true, remaining: 0 });
	});
});
