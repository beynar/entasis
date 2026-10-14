import { describe, expect, test } from 'vitest';
import { createVelocityTracker } from './swipeVelocity.js';

/** Feeds a constant-speed drag sampled every `interval` ms; returns the last sample's time. */
const drag = (
	tracker: ReturnType<typeof createVelocityTracker>,
	{
		speed,
		interval,
		duration,
		from = 0
	}: { speed: number; interval: number; duration: number; from?: number }
) => {
	let time = 0;
	for (; time <= duration; time += interval) tracker.add(from + speed * time, time);
	return time - interval;
};

describe('createVelocityTracker', () => {
	test('60 Hz and 120 Hz input report the same speed', () => {
		const slow = createVelocityTracker();
		const fast = createVelocityTracker();
		const end60 = drag(slow, { speed: 1.5, interval: 1000 / 60, duration: 200 });
		const end120 = drag(fast, { speed: 1.5, interval: 1000 / 120, duration: 200 });
		expect(slow.velocity(end60)).toBeCloseTo(1.5, 5);
		expect(fast.velocity(end120)).toBeCloseTo(1.5, 5);
	});

	test('a trailing stationary sample before release keeps the flick speed', () => {
		const tracker = createVelocityTracker();
		const end = drag(tracker, { speed: 2, interval: 8, duration: 64 });
		const rest = 2 * end;
		// Android Chrome: a move that barely changes the position, just before the release.
		tracker.add(rest + 0.5, end + 9);
		tracker.add(rest + 0.5, end + 10);
		expect(tracker.velocity(end + 10)).toBeCloseTo(2, 5);
	});

	test('a pointer that rests longer than the window before release has no speed', () => {
		const tracker = createVelocityTracker();
		const end = drag(tracker, { speed: 2, interval: 8, duration: 64 });
		expect(tracker.velocity(end + 100)).toBe(0);
		// Stationary samples during the rest change nothing.
		tracker.add(2 * end, end + 50);
		tracker.add(2 * end + 0.3, end + 100);
		expect(tracker.velocity(end + 100)).toBe(0);
	});

	test('a release that still moved counts', () => {
		const tracker = createVelocityTracker();
		drag(tracker, { speed: 1, interval: 16, duration: 64 });
		tracker.add(64 + 32, 80);
		expect(tracker.velocity(80)).toBeCloseTo(96 / 80, 5);
	});

	test('the speed is signed along the axis', () => {
		const tracker = createVelocityTracker();
		const end = drag(tracker, { speed: -0.8, interval: 10, duration: 60, from: 300 });
		expect(tracker.velocity(end)).toBeCloseTo(-0.8, 5);
	});

	test('reset forgets the previous gesture, and one sample has no speed', () => {
		const tracker = createVelocityTracker();
		const end = drag(tracker, { speed: 3, interval: 8, duration: 40 });
		expect(tracker.velocity(end)).toBeGreaterThan(0);
		tracker.reset();
		expect(tracker.velocity(end)).toBe(0);
		tracker.add(10, end + 1);
		expect(tracker.velocity(end + 1)).toBe(0);
	});

	test('near-simultaneous samples cannot spike the speed', () => {
		const tracker = createVelocityTracker();
		tracker.add(0, 100);
		tracker.add(10, 100.5);
		expect(tracker.velocity(100.5)).toBeCloseTo(10 / 4, 5);
	});

	test('samples out of order or not finite are ignored', () => {
		const tracker = createVelocityTracker();
		tracker.add(0, 0);
		tracker.add(20, 20);
		tracker.add(500, 10);
		tracker.add(Number.NaN, 30);
		expect(tracker.velocity(20)).toBeCloseTo(1, 5);
	});
});
