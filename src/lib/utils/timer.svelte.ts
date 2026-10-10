export type TimerOptions = {
	/** Creates the timer paused: it counts nothing until `resume()`. @default false */
	startPaused?: boolean;
};

/**
 * A countdown driven by requestAnimationFrame, with reactive `elapsed` and `remaining`.
 *
 * Frames stop while a tab is hidden but `performance.now()` keeps counting, so the owner has to
 * `pause()` while its window is inactive; otherwise the first frame after the user comes back
 * sees the whole hidden interval as elapsed.
 */
export class Timer {
	private rafId: number | null = null;
	private startTime: number = 0;
	private pausedTime: number = 0;
	private callback: () => void;
	private isPaused: boolean = false;
	// Set once the callback ran or the timer was destroyed; only `update()` restarts it.
	private stopped: boolean = false;

	delay = $state(0);
	remaining = $state(0);
	elapsed = $state(0);
	elapsedInSeconds = $derived(Math.round(Math.min(this.elapsed / 1000, this.delay / 1000)));
	elapsedInPercent = $derived(Math.round(Math.min((this.elapsed / this.delay) * 100, 100)));

	constructor(callback: () => void, delay: number, { startPaused = false }: TimerOptions = {}) {
		this.callback = callback;
		this.delay = delay;
		this.remaining = delay;
		this.isPaused = startPaused;
		if (delay > 0 && !startPaused) {
			this.start();
		}
	}

	/** Whether the countdown is held by `pause()`. */
	get paused() {
		return this.isPaused;
	}

	start = () => {
		this.cancelFrame();
		this.startTime = performance.now();
		this.rafId = requestAnimationFrame(this.scheduleFrame);
	};

	pause = () => {
		if (this.isPaused) return;
		this.cancelFrame();
		this.isPaused = true;
		this.pausedTime = this.elapsed;
	};

	resume = () => {
		if (!this.isPaused) return;
		this.isPaused = false;
		if (this.stopped || this.delay <= 0) return;
		this.startTime = performance.now() - this.pausedTime;
		this.cancelFrame();
		this.rafId = requestAnimationFrame(this.scheduleFrame);
	};

	destroy = () => {
		this.cancelFrame();
		this.stopped = true;
	};

	/**
	 * Restarts the countdown from the full `delay`. A paused timer stays paused, so a toast
	 * updated under the pointer or in a background tab does not start counting down.
	 */
	update = (delay: number) => {
		this.cancelFrame();
		this.stopped = false;
		this.delay = delay;
		this.remaining = delay;
		this.elapsed = 0;
		this.pausedTime = 0;
		if (delay > 0 && !this.isPaused) {
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
		if (this.isPaused || this.stopped) return;

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
