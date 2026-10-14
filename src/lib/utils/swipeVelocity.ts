/**
 * Release speed for swipe gestures (drawer dismissal, Sidebar view swipes, Toast flicks).
 *
 * The speed is measured over a time window that ends at the last sample where the pointer was
 * still moving, rather than from the last pair of samples. That keeps it stable whatever the
 * input rate (60 Hz and 120 Hz report the same flick) and survives the effectively stationary
 * move some Android devices emit right before release, which would otherwise read as a stop.
 * A pointer that rests longer than the window before release has no speed left.
 */

/** Width of the measuring window, in ms. */
export const SWIPE_VELOCITY_WINDOW_MS = 80;
/** Shortest interval a speed is divided by, so near-simultaneous samples cannot spike it. */
const MIN_INTERVAL_MS = 4;
/** Samples closer than this to the resting position count as stationary. */
const STATIONARY_PX = 1;
/** Samples kept: comfortably more than a window's worth at 240 Hz. */
const MAX_SAMPLES = 64;

type Sample = { position: number; time: number };

export type VelocityTrackerOptions = {
	/** Width of the measuring window, in ms. Default `SWIPE_VELOCITY_WINDOW_MS`. */
	windowMs?: number;
	/** Shortest interval a speed is divided by, in ms. Default 4. */
	minIntervalMs?: number;
};

export type VelocityTracker = {
	/** Forgets every sample: call it when a gesture starts. */
	reset(): void;
	/**
	 * Records the pointer's position along the gesture axis at `time` (an event's `timeStamp`).
	 * Record the release event too: a release that moved still counts.
	 */
	add(position: number, time: number): void;
	/**
	 * The speed along the axis in px/ms (signed: positive toward increasing positions) at `time`,
	 * usually the release event's `timeStamp`. Defaults to the newest sample's time.
	 */
	velocity(time?: number): number;
};

export const createVelocityTracker = ({
	windowMs = SWIPE_VELOCITY_WINDOW_MS,
	minIntervalMs = MIN_INTERVAL_MS
}: VelocityTrackerOptions = {}): VelocityTracker => {
	let samples: Sample[] = [];

	/** Index of the first sample of the stationary tail: where the pointer came to rest. */
	const restingIndex = () => {
		const newest = samples[samples.length - 1];
		let index = samples.length - 1;
		while (index > 0 && Math.abs(samples[index - 1].position - newest.position) < STATIONARY_PX) {
			index -= 1;
		}
		return index;
	};

	return {
		reset() {
			samples = [];
		},
		add(position, time) {
			if (!Number.isFinite(position) || !Number.isFinite(time)) return;
			const newest = samples[samples.length - 1];
			if (newest && time < newest.time) return;
			samples.push({ position, time });
			if (samples.length > MAX_SAMPLES) samples = samples.slice(-MAX_SAMPLES);
		},
		velocity(time) {
			if (samples.length < 2) return 0;
			const end = restingIndex();
			const last = samples[end];
			const now = time ?? samples[samples.length - 1].time;
			// Resting for longer than the window is a hold, not a flick.
			if (end === 0 || now - last.time > windowMs) return 0;
			let start = end - 1;
			while (start > 0 && last.time - samples[start - 1].time <= windowMs) start -= 1;
			const first = samples[start];
			return (last.position - first.position) / Math.max(last.time - first.time, minIntervalMs);
		}
	};
};
