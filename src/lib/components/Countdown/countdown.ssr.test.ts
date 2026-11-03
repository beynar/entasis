import { render } from 'svelte/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Countdown from './Countdown.svelte';

const START = Date.UTC(2026, 10, 2, 12, 0, 0);

afterEach(() => {
	vi.useRealTimers();
});

describe('Countdown server rendering', () => {
	test('renders the value at render time, without completing', () => {
		vi.useFakeTimers();
		vi.setSystemTime(START);
		const onComplete = vi.fn();
		const until = new Date(START + 3 * 60 * 60 * 1000);
		const { body } = render(Countdown, { props: { until, locale: 'en' } });

		expect(body).toContain('3 hours');
		expect(body).toContain(`datetime="${until.toISOString()}"`);
		expect(body).toContain('role="timer"');

		render(Countdown, { props: { until: START - 1000, onComplete } });
		expect(onComplete).not.toHaveBeenCalled();
	});
});
