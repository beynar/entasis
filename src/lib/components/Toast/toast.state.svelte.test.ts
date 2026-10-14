import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';
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
const items = () => document.querySelectorAll<HTMLElement>('section[data-live-region] > li');

// From the call on, transitions never finish, so a removed toast stays mid-exit.
const holdAnimations = () =>
	vi.spyOn(Element.prototype, 'animate').mockImplementation(
		() =>
			({
				cancel() {},
				finish() {},
				play() {},
				pause() {},
				finished: new Promise(() => {}),
				onfinish: null,
				oncancel: null
			}) as unknown as Animation
	);

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

		// jsdom has no layout; stand in for the height the item measured.
		first.height = 48;
		const reopened = vi.fn();
		const second = toast.success({ id: 'sync', title: 'Synced', onAfterOpen: reopened });
		await tick();

		expect(second).not.toBe(first);
		expect(items()).toHaveLength(1);
		expect(screen.getByText('Synced')).toBeInTheDocument();
		expect(screen.queryByText('Syncing')).not.toBeInTheDocument();
		await waitFor(() => expect(reopened).toHaveBeenCalledWith(second));
		expect(onDismiss).toHaveBeenCalledTimes(1);
		// The replacement inherits the live element and its size, so stacking reads its real height.
		expect(second.element).toBe(items()[0]);
		expect(second.height).toBe(48);
		expect(toaster().toasts).toEqual([second]);

		// The stale handle no longer controls the toast with that id.
		toaster().removeToast(first);
		first.remove();
		await tick();
		expect(toaster().toasts).toEqual([second]);
	});

	test('removing and re-adding an id in the same tick still opens the replacement', async () => {
		render(Harness);
		const firstOpen = vi.fn();
		const first = toast.info({
			id: 'swap',
			title: 'Before',
			duration: false,
			onAfterOpen: firstOpen
		});
		await waitFor(() => expect(firstOpen).toHaveBeenCalledTimes(1));

		first.remove();
		const reopened = vi.fn();
		const second = toast.success({
			id: 'swap',
			title: 'After',
			duration: false,
			onAfterOpen: reopened
		});
		// A further call before the replacement joins merges into it.
		expect(toast.success({ id: 'swap', title: 'After all' })).toBe(second);
		await tick();

		expect(items()).toHaveLength(1);
		expect(screen.getByText('After all')).toBeInTheDocument();
		expect(second.element).toBe(items()[0]);
		expect(toaster().toasts).toEqual([second]);
		await waitFor(() => expect(reopened).toHaveBeenCalledWith(second));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(reopened).toHaveBeenCalledTimes(1);
		expect(firstOpen).toHaveBeenCalledTimes(1);
	});

	test('a replacement dismissed before it joins the stack never shows', async () => {
		render(Harness);
		const first = toast.info({ id: 'gone', title: 'Before', duration: false });
		await tick();
		first.remove();
		const onDismiss = vi.fn();
		const second = toast.success({ id: 'gone', title: 'After', onDismiss });
		second.remove();
		await tick();
		expect(toaster().toasts).toEqual([]);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('After')).not.toBeInTheDocument();
	});

	test('a toast swiped away and re-added mid-exit comes back to its slot', async () => {
		render(Harness, { position: 'bottom-right' });
		const opened = vi.fn();
		toast.info({ id: 'swipe', title: 'Swipe me', duration: false, onAfterOpen: opened });
		await waitFor(() => expect(opened).toHaveBeenCalled());
		holdAnimations();

		const li = items()[0] as HTMLElement;
		// Once the press becomes a drag the toast captures the pointer, so its moves arrive there.
		await fireEvent.pointerDown(li, { clientX: 100, clientY: 100 });
		await fireEvent.pointerMove(li, { clientX: 200, clientY: 100 });
		await fireEvent.pointerUp(li, { clientX: 200, clientY: 100 });
		expect(toaster().toasts).toEqual([]);
		expect(li.style.translate).toBe('100px 0px');

		const second = toast.success({ id: 'swipe', title: 'Again', duration: false });
		await tick();
		expect(toaster().toasts).toEqual([second]);
		expect(items()[0]).toBe(li);
		expect(li.style.translate).toBe('0px 0px');
	});

	test('toast() and remove() called from an effect do not subscribe it to the Toaster', async () => {
		render(Harness);
		let status = $state('Offline');
		let runs = 0;
		const stop = $effect.root(() => {
			$effect(() => {
				runs++;
				const shown = toast.warning({ id: 'net', title: status, duration: false });
				if (status === 'Online') {
					shown.remove();
					// No id: an effect re-run by its own call would add one toast per run.
					toast.success({ title: 'Back online' });
				}
			});
		});
		flushSync();
		expect(runs).toBe(1);
		expect(toaster().toasts.map((t) => t.opts.title)).toEqual(['Offline']);

		status = 'Online';
		flushSync();
		await tick();
		expect(runs).toBe(2);
		expect(toaster().toasts.map((t) => t.opts.title)).toEqual(['Back online']);
		stop();
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
		toaster().setHovering(null);
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

	test('an upsert that moves a toast off the hovered stack resumes its countdown', async () => {
		render(Harness);
		const onAutoDismiss = vi.fn();
		const shown = toast.success({
			id: 'move',
			title: 'Here',
			duration: 1000,
			position: 'bottom-right',
			onAutoDismiss
		});
		await tick();
		await fireEvent.pointerEnter(items()[0]);
		expect(shown.timer?.paused).toBe(true);

		toast.success({ id: 'move', title: 'There', position: 'top-left' });
		await tick();
		expect(shown.timer?.paused).toBe(false);
		run(1016);
		expect(onAutoDismiss).toHaveBeenCalledTimes(1);
	});

	test('a toast added to the hovered stack starts paused', async () => {
		render(Harness);
		toast.success({ title: 'First', duration: 1000 });
		await tick();
		await fireEvent.pointerEnter(items()[0]);

		const next = toast.info({ title: 'Second', duration: 1000 });
		await tick();
		expect(next.timer?.paused).toBe(true);
		run(2000);
		expect(next.timer?.remaining).toBe(1000);
	});

	test('the Toaster stops listening to the window when it unmounts', async () => {
		const { unmount } = render(Harness);
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		const timer = shown.timer!;
		unmount();

		// A leaked listener would still pause the toasts of the unmounted Toaster.
		window.dispatchEvent(new FocusEvent('blur'));
		expect(timer.paused).toBe(false);
		setVisibility('hidden');
		expect(timer.paused).toBe(false);
	});
});

describe('toast action handlers (CX-4)', () => {
	test("an action's onclick runs first, and preventDefault keeps the toast", async () => {
		render(Harness);
		const keep = vi.fn((event: MouseEvent) => event.preventDefault());
		const leave = vi.fn();
		toast.info({
			title: 'Archived',
			duration: false,
			actions: [
				{ content: 'Keep', onclick: keep },
				{ content: 'Undo', onclick: leave }
			]
		});
		await tick();

		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		await tick();
		expect(keep).toHaveBeenCalledOnce();
		expect(items()).toHaveLength(1);

		// Without a preventDefault the action dismisses the toast, after its own handler ran.
		await fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
		await tick();
		expect(leave).toHaveBeenCalledOnce();
		await waitFor(() => expect(items()).toHaveLength(0));
	});
});

// jsdom never matches `:focus-visible`; this stands in for a keyboard user's focus ring.
const focusVisible = (visible: boolean) =>
	vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
		this: Element,
		selector: string
	) {
		if (selector === ':focus-visible') return visible;
		return Element.prototype.matches.call(this, selector);
	});

describe('toast pause reasons (DF-2)', () => {
	test('a11y:toast.timers-pause-on-focus keyboard focus holds the stack and releases with the time that was left', async () => {
		render(Harness);
		const onAutoDismiss = vi.fn();
		const shown = toast.success({ title: 'Saved', duration: 1000, onAutoDismiss });
		await tick();
		run(400);

		const spy = focusVisible(true);
		items()[0].focus();
		expect(shown.timer?.heldBy).toEqual(['focus']);
		run(5000);
		expect(onAutoDismiss).not.toHaveBeenCalled();

		items()[0].blur();
		expect(shown.timer?.paused).toBe(false);
		run(560);
		expect(onAutoDismiss).not.toHaveBeenCalled();
		run(64);
		expect(onAutoDismiss).toHaveBeenCalledTimes(1);
		spy.mockRestore();
	});

	test('a focus that is not a keyboard focus (a click, a tap) holds nothing', async () => {
		render(Harness);
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		const spy = focusVisible(false);
		items()[0].focus();
		expect(shown.timer?.paused).toBe(false);
		spy.mockRestore();
	});

	test('hover and focus hold together: the stack resumes only when both are gone', async () => {
		render(Harness);
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		const spy = focusVisible(true);
		await fireEvent.pointerEnter(items()[0], { pointerType: 'mouse' });
		items()[0].focus();
		expect(shown.timer?.heldBy).toEqual(['hover', 'focus']);

		// Pointer first, focus second.
		toaster().setHovering(null);
		expect(shown.timer?.heldBy).toEqual(['focus']);
		await fireEvent.pointerEnter(items()[0], { pointerType: 'mouse' });
		items()[0].blur();
		expect(shown.timer?.heldBy).toEqual(['hover']);
		toaster().setHovering(null);
		expect(shown.timer?.paused).toBe(false);
		spy.mockRestore();
	});

	test('focus moving between two toasts of a stack keeps the hold', async () => {
		render(Harness);
		const first = toast.success({ title: 'First', duration: 1000 });
		const second = toast.success({ title: 'Second', duration: 1000 });
		await tick();
		const spy = focusVisible(true);
		items()[0].focus();
		items()[1].focus();
		expect(first.timer?.heldBy).toEqual(['focus']);
		expect(second.timer?.heldBy).toEqual(['focus']);
		items()[1].blur();
		expect(first.timer?.paused).toBe(false);
		spy.mockRestore();
	});

	test('a touch pointer entering a toast is not a hover', async () => {
		render(Harness);
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		await fireEvent.pointerEnter(items()[0], { pointerType: 'touch' });
		expect(toaster().hovering).toBeNull();
		expect(shown.timer?.paused).toBe(false);
		await fireEvent.pointerEnter(items()[0], { pointerType: 'mouse' });
		expect(toaster().hovering).toBe(shown.opts.position);
	});

	test('a press holds the stack until the pointer is released or cancelled', async () => {
		render(Harness, { position: 'bottom-right' });
		const shown = toast.success({ title: 'Saved', duration: 1000 });
		await tick();
		const li = items()[0] as HTMLElement;
		const touch = { pointerId: 9, pointerType: 'touch', clientX: 100, clientY: 100 };
		await fireEvent.pointerDown(li, touch);
		expect(shown.timer?.heldBy).toEqual(['swipe']);
		run(3000);
		expect(shown.timer?.remaining).toBe(1000);
		await fireEvent.pointerUp(li, touch);
		expect(shown.timer?.paused).toBe(false);

		await fireEvent.pointerDown(li, touch);
		expect(shown.timer?.heldBy).toEqual(['swipe']);
		await fireEvent.pointerCancel(li, touch);
		expect(shown.timer?.paused).toBe(false);
	});

	test('a dismissed toast takes its focus and hover holds with it', async () => {
		render(Harness);
		const keep = toast.info({ title: 'Other', duration: 1000, position: 'top-left' });
		const gone = toast.success({ title: 'Gone', duration: false, position: 'bottom-right' });
		await tick();
		const spy = focusVisible(true);
		(items()[1] as HTMLElement).focus();
		await fireEvent.pointerEnter(items()[1], { pointerType: 'mouse' });
		expect(toaster().focusedToast).toBe(gone);
		gone.remove();
		expect(toaster().focusedToast).toBeNull();
		expect(toaster().hovering).toBeNull();
		expect(keep.timer?.paused).toBe(false);
		spy.mockRestore();
	});
});

describe('toast.update, toast.dismiss and toast.promise (DF-3)', () => {
	test('update() takes a patch, keeps the other options, restarts the timer and bumps data-update-key', async () => {
		render(Harness);
		const shown = toast.info({
			id: 'job',
			title: 'Working',
			description: 'Step 1',
			duration: 1000
		});
		await tick();
		expect(items()[0]).toHaveAttribute('data-update-key', '0');
		run(600);

		expect(toast.update('job', { title: 'Still working' })).toBe(shown);
		await tick();
		expect(screen.getByText('Still working')).toBeInTheDocument();
		expect(screen.getByText('Step 1')).toBeInTheDocument();
		expect(items()[0]).toHaveAttribute('data-update-key', '1');
		expect(shown.timer?.remaining).toBe(1000);

		shown.update({ color: 'success' });
		await tick();
		expect(items()[0]).toHaveAttribute('data-color', 'success');
		expect(items()[0]).toHaveAttribute('data-update-key', '2');
	});

	test('a function update sees the current options, Toaster defaults included', async () => {
		render(Harness, { duration: 7000 });
		const shown = toast.info({ id: 'count', title: 'Items: 1', description: 'one' });
		await tick();
		let seen: { title?: unknown; duration?: unknown } = {};
		toast.update('count', (current) => {
			seen = { title: current.title, duration: current.duration };
			return { title: `${current.title}!` };
		});
		await tick();
		expect(seen).toEqual({ title: 'Items: 1', duration: 7000 });
		expect(shown.opts.title).toBe('Items: 1!');
		shown.update((current) => ({ title: `${current.title}?` }));
		expect(shown.opts.title).toBe('Items: 1!?');
	});

	test('update() with an id that is not on screen does nothing', async () => {
		render(Harness);
		expect(toast.update('nobody', { title: 'x' })).toBeUndefined();
		const shown = toast.info({ id: 'closed', title: 'Closed', duration: false });
		await tick();
		shown.remove();
		await tick();
		expect(toast.update('closed', { title: 'Back' })).toBeUndefined();
		// The handle of a dismissed toast stays dismissed too.
		shown.update({ title: 'Back' });
		await tick();
		expect(toaster().toasts).toEqual([]);
	});

	test('dismiss(id) closes one toast and dismiss() all of them, each onDismiss once', async () => {
		render(Harness);
		const onDismiss = vi.fn();
		toast.info({ id: 'a', title: 'A', duration: false, onDismiss });
		toast.info({ id: 'b', title: 'B', duration: false, onDismiss });
		toast.info({ id: 'c', title: 'C', duration: false, position: 'top-left', onDismiss });
		await tick();

		toast.dismiss('a');
		toast.dismiss('a');
		expect(toaster().toasts.map((t) => t.id)).toEqual(['b', 'c']);
		expect(onDismiss).toHaveBeenCalledTimes(1);

		toast.dismiss();
		expect(toaster().toasts).toEqual([]);
		expect(onDismiss).toHaveBeenCalledTimes(3);
		toast.dismiss();
		expect(onDismiss).toHaveBeenCalledTimes(3);
	});

	test('dismiss() also drops toasts still waiting for a Toaster', async () => {
		const onDismiss = vi.fn();
		const queued = toast.info({ title: 'Early', duration: false, onDismiss });
		toast.dismiss();
		expect(onDismiss).toHaveBeenCalledTimes(1);
		render(Harness);
		await tick();
		expect(queued.toaster).toBeNull();
		expect(items()).toHaveLength(0);
	});

	test('promise() shows a loading toast, then the success options computed from the result', async () => {
		render(Harness);
		let resolve!: (value: number) => void;
		const pending = new Promise<number>((done) => (resolve = done));
		const returned = toast.promise(pending, {
			id: 'save',
			loading: { title: 'Saving', description: 'Hold on' },
			success: (rows) => ({ title: `Saved ${rows} rows` }),
			error: 'Failed'
		});
		expect(returned).toBe(pending);
		await tick();
		const shown = toaster().find('save')!;
		expect(shown.loading).toBe(true);
		expect(shown.timer).toBeUndefined();
		expect(shown.opts.color).toBe('primary');
		expect(within(items()[0]).getByText('Hold on')).toBeInTheDocument();

		resolve(3);
		await returned;
		await tick();
		expect(shown.loading).toBe(false);
		expect(shown.opts.color).toBe('success');
		expect(within(items()[0]).getByText('Saved 3 rows')).toBeInTheDocument();
		// The pending toast's description does not leak into the result.
		expect(screen.queryByText('Hold on')).not.toBeInTheDocument();
		expect(shown.timer?.delay).toBe(4000);
		expect(items()).toHaveLength(1);
	});

	test('promise() turns a rejection into the error toast and still rejects for the caller', async () => {
		render(Harness);
		const failure = new Error('disk full');
		const returned = toast.promise(Promise.reject(failure), {
			id: 'upload',
			loading: 'Uploading',
			success: 'Uploaded',
			error: (reason) => `Failed: ${(reason as Error).message}`
		});
		await expect(returned).rejects.toBe(failure);
		await tick();
		expect(screen.getByText('Failed: disk full')).toBeInTheDocument();
		expect(toaster().find('upload')?.opts.color).toBe('danger');
	});

	test('a promise that settles after the user dismissed its toast does not bring it back', async () => {
		render(Harness);
		let resolve!: () => void;
		const pending = new Promise<void>((done) => (resolve = done));
		toast.promise(pending, { id: 'late', loading: 'Working', success: 'Done', error: 'Failed' });
		await tick();
		toast.dismiss('late');
		await tick();
		resolve();
		await pending;
		await tick();
		expect(toaster().toasts).toEqual([]);
		expect(screen.queryByText('Done')).not.toBeInTheDocument();
	});

	test('the reserved names are not colors: no toast is created by accident', async () => {
		render(Harness);
		toast.update('missing', {});
		toast.dismiss();
		await tick();
		expect(toaster().toasts).toEqual([]);
	});
});
