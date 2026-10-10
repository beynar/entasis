import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Timer } from './timer.svelte.js';

// A frame clock the test drives by hand: `frame(ms)` advances `performance.now()` and runs the
// frames requested so far, `jump(ms)` advances the clock without a frame (a hidden tab).
let now = 0;
let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;

const frame = (ms = 16) => {
	now += ms;
	const callbacks = [...frames.values()];
	frames.clear();
	callbacks.forEach((callback) => callback(now));
};
const run = (ms: number) => {
	for (let left = ms; left > 0; left -= 16) frame(Math.min(16, left));
};
const jump = (ms: number) => {
	now += ms;
};

beforeEach(() => {
	now = 1000;
	frames = new Map();
	nextFrame = 1;
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(nextFrame, callback);
		return nextFrame++;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Timer', () => {
	test('counts down on frames and fires once', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100);
		run(64);
		expect(timer.elapsed).toBe(64);
		expect(timer.remaining).toBe(36);
		run(48);
		expect(callback).toHaveBeenCalledTimes(1);
		run(200);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('a paused timer keeps its remaining time across a hidden-tab gap', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 1000);
		run(400);
		timer.pause();
		// The tab is hidden for a minute: no frames run while the clock advances.
		jump(60_000);
		timer.resume();
		frame();
		expect(callback).not.toHaveBeenCalled();
		expect(timer.elapsed).toBe(416);
		run(600);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('update() while paused restarts from the full delay and stays paused', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 1000);
		run(400);
		timer.pause();
		timer.update(500);
		expect(timer.paused).toBe(true);
		expect(timer.remaining).toBe(500);
		run(2000);
		expect(callback).not.toHaveBeenCalled();
		expect(timer.elapsed).toBe(0);
		timer.resume();
		run(496);
		expect(callback).not.toHaveBeenCalled();
		run(16);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('update() on a running timer restarts the countdown', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 1000);
		run(800);
		timer.update(1000);
		expect(timer.paused).toBe(false);
		run(800);
		expect(callback).not.toHaveBeenCalled();
		run(208);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('startPaused counts nothing until resume()', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100, { startPaused: true });
		expect(timer.paused).toBe(true);
		expect(frames.size).toBe(0);
		jump(10_000);
		timer.resume();
		run(96);
		expect(callback).not.toHaveBeenCalled();
		expect(timer.remaining).toBe(4);
		run(16);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('resume() never restarts a destroyed or finished timer', () => {
		const destroyedCallback = vi.fn();
		const destroyed = new Timer(destroyedCallback, 100);
		destroyed.pause();
		destroyed.destroy();
		destroyed.resume();
		run(500);
		expect(destroyedCallback).not.toHaveBeenCalled();

		const finishedCallback = vi.fn();
		const finished = new Timer(finishedCallback, 100);
		run(112);
		finished.pause();
		finished.resume();
		run(500);
		expect(finishedCallback).toHaveBeenCalledTimes(1);
	});
});
