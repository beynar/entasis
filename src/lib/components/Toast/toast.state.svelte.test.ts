import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Harness from './ToasterHarness.test.svelte';
import { toast, type Toaster } from './toast.state.svelte.js';

// A frame clock the test drives by hand: `run(ms)` advances `performance.now()` frame by frame,
// `jump(ms)` advances it without any frame, like a hidden tab.
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

let visibility: DocumentVisibilityState = 'visible';
const setVisibility = (state: DocumentVisibilityState) => {
	visibility = state;
	// The global Document augmentation narrows dispatchEvent to the custom toast events.
	EventTarget.prototype.dispatchEvent.call(document, new Event('visibilitychange'));
};

const toaster = () => window.toaster as Toaster;
const items = () => document.querySelectorAll('section[data-live-region] > li');

beforeEach(() => {
	now = 1000;
	frames = new Map();
	nextFrame = 1;
	visibility = 'visible';
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(nextFrame, callback);
		return nextFrame++;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.spyOn(performance, 'now').mockImplementation(() => now);
	Object.defineProperty(document, 'visibilityState', {
		configurable: true,
		get: () => visibility
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	Reflect.deleteProperty(document, 'visibilityState');
});

describe('toast upsert by id', () => {
	test('showing the same id twice keeps one toast, merges options and restarts the timer', async () => {
		render(Harness);
		const onAutoDismiss = vi.fn();
		const first = toast.success({
			id: 'save',
			title: 'First',
			description: 'Kept description',
			duration: 1000,
			onAutoDismiss
		});
		await tick();
		run(600);
		expect(first.timer?.elapsed).toBe(600);

		const second = toast.danger({ id: 'save', title: 'Second' });
		await tick();

		expect(second).toBe(first);
		expect(items()).toHaveLength(1);
		expect(screen.getByText('Second')).toBeInTheDocument();
		expect(screen.getByText('Kept description')).toBeInTheDocument();
		expect(items()[0]).toHaveAttribute('data-color', 'danger');
		expect(first.timer?.remaining).toBe(1000);

		// The first countdown would have ended 400 ms in; the restarted one runs the full second.
		run(600);
		expect(onAutoDismiss).not.toHaveBeenCalled();
		run(416);
		expect(onAutoDismiss).toHaveBeenCalledTimes(1);
	});

	test('an upsert can end a loading toast and give it a duration', async () => {
		render(Harness);
		const pending = toast.primary({
			id: 'upload',
			title: 'Uploading',
			loading: true,
			duration: false
		});
		await tick();
		expect(pending.loading).toBe(true);
		expect(pending.timer).toBeUndefined();

		toast.success({ id: 'upload', title: 'Uploaded', loading: false, duration: 2000 });
		await tick();
		expect(pending.loading).toBe(false);
		expect(pending.timer?.delay).toBe(2000);
		expect(items()).toHaveLength(1);
	});

	test('a toast re-added while it animates out is replaced and opens again', async () => {
		render(Harness);
		const onDismiss = vi.fn();
		const firstOpen = vi.fn();
		const first = toast.info({
			id: 'sync',
			title: 'Syncing',
			duration: false,
			onDismiss,
			onAfterOpen: firstOpen
		});
		await waitFor(() => expect(firstOpen).toHaveBeenCalledTimes(1));

		first.remove();
		await tick();
		// The exit transition is still playing: the item stays in the DOM.
		expect(items()).toHaveLength(1);

		const reopened = vi.fn();
		const second = toast.success({ id: 'sync', title: 'Synced', onAfterOpen: reopened });
		await tick();

		expect(second).not.toBe(first);
		expect(items()).toHaveLength(1);
		expect(screen.getByText('Synced')).toBeInTheDocument();
		expect(screen.queryByText('Syncing')).not.toBeInTheDocument();
		await waitFor(() => expect(reopened).toHaveBeenCalledWith(second));
		expect(onDismiss).toHaveBeenCalledTimes(1);
		// The replacement inherits the live element, so stacking reads its real height.
		expect(second.element).toBe(items()[0]);
		expect(toaster().toasts).toEqual([second]);

		// The stale handle no longer controls the toast with that id.
		first.remove();
		await tick();
		expect(toaster().toasts).toEqual([second]);
	});

	test('removing and re-adding an id in the same tick swaps the toast in place', async () => {
		render(Harness);
		const first = toast.info({ id: 'swap', title: 'Before', duration: false });
		await tick();
		first.remove();
		const second = toast.success({ id: 'swap', title: 'After', duration: false });
		await tick();
		expect(items()).toHaveLength(1);
		expect(screen.getByText('After')).toBeInTheDocument();
		expect(second.element).toBe(items()[0]);
		expect(toaster().toasts).toEqual([second]);
	});

	test('toasts queued before a Toaster mounts are merged by id', async () => {
		const queued = toast.warning({ id: 'early', title: 'Early', duration: false });
		const again = toast.warning({ id: 'early', title: 'Earlier still' });
		expect(again).toBe(queued);

		render(Harness);
		await waitFor(() => expect(queued.toaster).not.toBeNull());
		expect(items()).toHaveLength(1);
		expect(screen.getByText('Earlier still')).toBeInTheDocument();
	});
});

describe('toast timers and window activity', () => {
	test('window blur pauses timers and focus resumes them with the remaining time', async () => {
		render(Harness);
		const onAutoDismiss = vi.fn();
		const shown = toast.success({ title: 'Saved', duration: 1000, onAutoDismiss });
		await tick();
		run(400);

		window.dispatchEvent(new FocusEvent('blur'));
		run(5000);
		expect(onAutoDismiss).not.toHaveBeenCalled();
		expect(shown.timer?.paused).toBe(true);

		window.dispatchEvent(new FocusEvent('focus'));
		run(560);
		expect(onAutoDismiss).not.toHaveBeenCalled();
		run(64);
		expect(onAutoDismiss).toHaveBeenCalledTimes(1);
	});

	test('focus moving between elements does not pause timers', async () => {
		render(Harness);
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		const button = document.createElement('button');
		document.body.append(button);
		button.focus();
		button.blur();
		expect(shown.timer?.paused).toBe(false);
		button.remove();
	});

	test('a hidden tab keeps the remaining time instead of expiring every toast on return', async () => {
		render(Harness);
		const onAutoDismiss = vi.fn();
		const shown = toast.success({ title: 'Saved', duration: 1000, onAutoDismiss });
		await tick();
		run(400);

		setVisibility('hidden');
		// Frames stop in a hidden tab while the clock keeps going.
		jump(60_000);
		setVisibility('visible');
		frame();

		expect(onAutoDismiss).not.toHaveBeenCalled();
		expect(shown.timer?.elapsed).toBe(416);
	});

	test('a toast created while the tab is hidden starts paused', async () => {
		render(Harness);
		setVisibility('hidden');
		const onAutoDismiss = vi.fn();
		const shown = toast.info({ title: 'Background', duration: 1000, onAutoDismiss });
		await tick();
		expect(shown.timer?.paused).toBe(true);

		jump(60_000);
		setVisibility('visible');
		frame();
		expect(onAutoDismiss).not.toHaveBeenCalled();
		expect(shown.timer?.remaining).toBe(984);
	});

	test('timers stay paused while either the hover or the inactive window holds them', async () => {
		render(Harness);
		const shown = toast.success({ title: 'Hovered', duration: 1000 });
		await tick();
		await fireEvent.pointerEnter(items()[0]);
		expect(shown.timer?.paused).toBe(true);

		// Returning to the window keeps the hovered stack paused.
		window.dispatchEvent(new FocusEvent('blur'));
		window.dispatchEvent(new FocusEvent('focus'));
		expect(shown.timer?.paused).toBe(true);

		// Leaving the stack while the window is inactive keeps it paused too.
		window.dispatchEvent(new FocusEvent('blur'));
		toaster().toggleTimers(shown.opts.position, 'resume');
		toaster().hovering = null;
		expect(shown.timer?.paused).toBe(true);

		window.dispatchEvent(new FocusEvent('focus'));
		expect(shown.timer?.paused).toBe(false);
	});

	test('an upsert under the pointer restarts the countdown without starting it', async () => {
		render(Harness);
		const shown = toast.success({ id: 'hovered', title: 'Hovered', duration: 1000 });
		await tick();
		run(300);
		await fireEvent.pointerEnter(items()[0]);

		toast.success({ id: 'hovered', title: 'Updated', duration: 2000 });
		await tick();
		run(3000);
		expect(shown.timer?.paused).toBe(true);
		expect(shown.timer?.remaining).toBe(2000);
	});

	test('the Toaster stops listening to the window when it unmounts', async () => {
		const remove = vi.spyOn(window, 'removeEventListener');
		const { unmount } = render(Harness);
		unmount();
		const removed = remove.mock.calls.map(([type]) => type);
		expect(removed).toContain('blur');
		expect(removed).toContain('focus');
	});
});
