import { untrack } from 'svelte';

export type TimerOptions = {
	/** Creates the timer held by `pause()`: it counts nothing until `resume()`. @default false */
	startPaused?: boolean;
	/**
	 * Reason, or reasons, that hold the timer from the start, such as `'hover'` or `'window'` when
	 * the pointer or an inactive window already pauses its owner. It counts nothing until each one
	 * is released.
	 */
	heldBy?: string | Iterable<string>;
};

/** The reason `pause()` holds and `resume()` releases. */
export const PAUSE_REASON = 'pause';

/**
 * A countdown driven by requestAnimationFrame, with reactive `elapsed` and `remaining`.
 *
 * Several things can stop it at once (hover, keyboard focus, a swipe, an inactive window): each
 * one calls `hold(reason)` and later `release(reason)`, and the countdown runs only while no
 * reason holds it. `pause()` and `resume()` hold and release the `'pause'` reason.
 *
 * Frames stop while a tab is hidden but `performance.now()` keeps counting, so the owner has to
 * hold the timer while its window is inactive (see `watchWindowActivity`); otherwise the first
 * frame after the user comes back sees the whole hidden interval as elapsed.
 */
export class Timer {
	private rafId: number | null = null;
	private startTime: number = 0;
	private pausedTime: number = 0;
	private callback: () => void;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- read imperatively, so `hold()` in an effect doesn't subscribe it; `held` and `revision` are the reactive mirrors
	private holds = new Set<string>();
	// Bumped on every hold and release, so `heldBy` and `isHeldBy` are reactive.
	private revision = $state(0);
	// Bumps `revision` without reading it, so a `hold()` inside an effect doesn't subscribe it.
	private touch = () => untrack(() => (this.revision += 1));
	// Set once the callback ran or the timer was destroyed; only `update()` restarts it.
	private stopped: boolean = false;
	private held = $state(false);

	delay = $state(0);
	remaining = $state(0);
	elapsed = $state(0);
	elapsedInSeconds = $derived(Math.round(Math.min(this.elapsed / 1000, this.delay / 1000)));
	elapsedInPercent = $derived(Math.round(Math.min((this.elapsed / this.delay) * 100, 100)));

	constructor(
		callback: () => void,
		delay: number,
		{ startPaused = false, heldBy = [] }: TimerOptions = {}
	) {
		this.callback = callback;
		this.delay = delay;
		this.remaining = delay;
		for (const reason of typeof heldBy === 'string' ? [heldBy] : heldBy) this.holds.add(reason);
		if (startPaused) this.holds.add(PAUSE_REASON);
		this.held = this.holds.size > 0;
		if (delay > 0 && !this.held) {
			this.start();
		}
	}

	/** Whether any reason holds the countdown. Reactive. */
	get paused() {
		return this.held;
	}

	/** The reasons currently holding the countdown, in the order they were added. Reactive. */
	get heldBy(): readonly string[] {
		void this.revision;
		return [...this.holds];
	}

	/** Whether `reason` currently holds the countdown. Reactive. */
	isHeldBy = (reason: string) => {
		void this.revision;
		return this.holds.has(reason);
	};

	start = () => {
		this.cancelFrame();
		this.startTime = performance.now();
		this.rafId = requestAnimationFrame(this.scheduleFrame);
	};

	/**
	 * Stops the countdown for `reason`, keeping the time already elapsed. Holding with a reason
	 * that already holds it changes nothing.
	 */
	hold = (reason: string) => {
		if (this.holds.has(reason)) return;
		this.holds.add(reason);
		this.touch();
		if (this.holds.size > 1) return;
		this.cancelFrame();
		this.pausedTime = this.elapsed;
		this.held = true;
	};

	/**
	 * Drops `reason`. When no other reason holds the timer, the countdown resumes with the time it
	 * had left. Releasing a reason that doesn't hold it changes nothing.
	 */
	release = (reason: string) => {
		if (!this.holds.delete(reason)) return;
		this.touch();
		if (this.holds.size > 0) return;
		this.held = false;
		if (this.stopped || this.delay <= 0) return;
		this.startTime = performance.now() - this.pausedTime;
		this.cancelFrame();
		this.rafId = requestAnimationFrame(this.scheduleFrame);
	};

	/** Holds the countdown with the `'pause'` reason. */
	pause = () => this.hold(PAUSE_REASON);

	/** Releases the `'pause'` reason; other reasons keep holding the timer. */
	resume = () => this.release(PAUSE_REASON);

	destroy = () => {
		this.cancelFrame();
		this.stopped = true;
	};

	/**
	 * Restarts the countdown from the full `delay`. A held timer stays held, so a toast updated
	 * under the pointer or in a background tab does not start counting down.
	 */
	update = (delay: number) => {
		this.cancelFrame();
		this.stopped = false;
		this.delay = delay;
		this.remaining = delay;
		this.elapsed = 0;
		this.pausedTime = 0;
		if (delay > 0 && this.holds.size === 0) {
			this.start();
		}
	};

	private cancelFrame = () => {
		if (this.rafId === null) return;
		cancelAnimationFrame(this.rafId);
		this.rafId = null;
	};

	private scheduleFrame = (timestamp: number): void => {
		this.rafId = null;
		if (this.holds.size > 0 || this.stopped) return;

		// A frame's timestamp can precede the `performance.now()` read in `start()`.
		this.elapsed = Math.max(0, timestamp - this.startTime);
		this.remaining = Math.max(0, this.delay - this.elapsed);

		if (this.elapsed >= this.delay) {
			this.stopped = true;
			this.callback();
		} else {
			this.rafId = requestAnimationFrame(this.scheduleFrame);
		}
	};
}

/**
 * Reports when the window becomes inactive (blurred, or its document hidden) and active again:
 * `onChange(true)` on the way in, `onChange(false)` on the way out. A document that is already
 * hidden reports `true` at once; focus is assumed at the start. Returns the cleanup.
 */
export const watchWindowActivity = (
	onChange: (inactive: boolean) => void,
	targetWindow: Window | undefined = typeof window === 'undefined' ? undefined : window
): (() => void) => {
	if (!targetWindow) return () => {};
	const targetDocument = targetWindow.document;
	let blurred = false;
	let hidden = targetDocument.visibilityState === 'hidden';
	let inactive = hidden;
	const update = () => {
		const next = blurred || hidden;
		if (next === inactive) return;
		inactive = next;
		onChange(next);
	};
	// Blur and focus don't bubble, so these only see the window's own events; the target check
	// keeps element focus changes out all the same.
	const onBlur = (event: FocusEvent) => {
		if (event.target !== event.currentTarget) return;
		blurred = true;
		update();
	};
	const onFocus = (event: FocusEvent) => {
		if (event.target !== event.currentTarget) return;
		blurred = false;
		update();
	};
	const onVisibilityChange = () => {
		hidden = targetDocument.visibilityState === 'hidden';
		update();
	};
	targetWindow.addEventListener('blur', onBlur);
	targetWindow.addEventListener('focus', onFocus);
	targetDocument.addEventListener('visibilitychange', onVisibilityChange);
	if (inactive) onChange(true);
	return () => {
		targetWindow.removeEventListener('blur', onBlur);
		targetWindow.removeEventListener('focus', onFocus);
		targetDocument.removeEventListener('visibilitychange', onVisibilityChange);
	};
};

/** Reason `holdWhileWindowInactive` holds a timer with. */
export const WINDOW_INACTIVE_REASON = 'window';

/**
 * Holds `timer` with `reason` while the window is blurred or its tab hidden, and releases it when
 * the window is active again. Returns the cleanup, which also releases the reason.
 */
export const holdWhileWindowInactive = (
	timer: Pick<Timer, 'hold' | 'release'>,
	reason: string = WINDOW_INACTIVE_REASON
): (() => void) => {
	const stop = watchWindowActivity((inactive) =>
		inactive ? timer.hold(reason) : timer.release(reason)
	);
	return () => {
		stop();
		timer.release(reason);
	};
};
