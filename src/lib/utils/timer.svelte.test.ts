import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	holdWhileWindowInactive,
	Timer,
	watchWindowActivity,
	WINDOW_INACTIVE_REASON
} from './timer.svelte.js';

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

	test('runs only while no reason holds it', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 1000);
		run(400);
		timer.hold('hover');
		timer.hold('focus');
		expect(timer.paused).toBe(true);
		expect(timer.heldBy).toEqual(['hover', 'focus']);
		jump(5000);
		timer.release('hover');
		run(2000);
		// Focus still holds it: nothing elapsed while the pointer left.
		expect(timer.paused).toBe(true);
		expect(callback).not.toHaveBeenCalled();
		expect(timer.elapsed).toBe(400);
		timer.release('focus');
		expect(timer.paused).toBe(false);
		run(592);
		expect(callback).not.toHaveBeenCalled();
		run(16);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('holding twice with one reason needs one release; unknown releases change nothing', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100);
		timer.hold('swipe');
		timer.hold('swipe');
		timer.release('hover');
		expect(timer.paused).toBe(true);
		timer.release('swipe');
		expect(timer.paused).toBe(false);
		run(112);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('pause() and resume() are one reason among others', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100);
		timer.hold('window');
		timer.pause();
		timer.resume();
		expect(timer.paused).toBe(true);
		expect(timer.isHeldBy('window')).toBe(true);
		expect(timer.isHeldBy('pause')).toBe(false);
		run(500);
		expect(callback).not.toHaveBeenCalled();
		timer.release('window');
		run(112);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('heldBy starts the timer held by those reasons', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100, { heldBy: ['hover', 'window'], startPaused: true });
		expect(frames.size).toBe(0);
		expect(timer.heldBy).toEqual(['hover', 'window', 'pause']);
		timer.release('hover');
		timer.resume();
		run(500);
		expect(callback).not.toHaveBeenCalled();
		timer.release('window');
		run(112);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('update() keeps every hold', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 100);
		timer.hold('hover');
		timer.update(200);
		expect(timer.paused).toBe(true);
		run(500);
		expect(callback).not.toHaveBeenCalled();
		timer.release('hover');
		run(208);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});

describe('window activity', () => {
	let visibility: DocumentVisibilityState = 'visible';
	beforeEach(() => {
		visibility = 'visible';
		vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
	});

	const setVisibility = (next: DocumentVisibilityState) => {
		visibility = next;
		// `Document` here carries the library's custom-event overloads; dispatch as a plain target.
		EventTarget.prototype.dispatchEvent.call(document, new Event('visibilitychange'));
	};

	test('reports blur, hidden tabs and their end once each', () => {
		const onChange = vi.fn();
		const stop = watchWindowActivity(onChange);
		window.dispatchEvent(new FocusEvent('blur'));
		setVisibility('hidden');
		setVisibility('visible');
		expect(onChange.mock.calls).toEqual([[true]]);
		window.dispatchEvent(new FocusEvent('focus'));
		expect(onChange.mock.calls).toEqual([[true], [false]]);
		// Focus moving between elements is not window activity.
		const input = document.createElement('input');
		document.body.append(input);
		input.focus();
		input.blur();
		input.remove();
		stop();
		window.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	test('a hidden document reports inactive at once', () => {
		visibility = 'hidden';
		const onChange = vi.fn();
		const stop = watchWindowActivity(onChange);
		expect(onChange.mock.calls).toEqual([[true]]);
		stop();
	});

	test('holdWhileWindowInactive holds the timer for the inactive spell only', () => {
		const callback = vi.fn();
		const timer = new Timer(callback, 1000);
		const stop = holdWhileWindowInactive(timer);
		run(400);
		setVisibility('hidden');
		expect(timer.isHeldBy(WINDOW_INACTIVE_REASON)).toBe(true);
		jump(60_000);
		setVisibility('visible');
		frame();
		expect(callback).not.toHaveBeenCalled();
		expect(timer.elapsed).toBe(416);
		window.dispatchEvent(new FocusEvent('blur'));
		expect(timer.paused).toBe(true);
		stop();
		expect(timer.paused).toBe(false);
	});
});
