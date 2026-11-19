// The voice indicator's render loop: reads the voice, steps the follower and draws one look on a
// canvas. It reads its inputs through a function each frame, so a changing prop never restarts
// it, and it stops drawing while the canvas is off screen, the page is hidden or it is paused.

import { acquireAnalyser, type AnalyserLease } from './voiceIndicator.audio.js';
import {
	blendCloud,
	cloudPalette,
	paintCloud,
	solidCloudPalette,
	SPECTRUM_CLOUD,
	type CloudPalette
} from './voiceIndicator.cloud.js';
import { clamp01, smoothSpectrum, SPECTRUM, type Rgb } from './voiceIndicator.color.js';
import {
	follow,
	levelCurve,
	VoiceFollower,
	WashFollower,
	type LevelCurve,
	type Voice,
	type Wash
} from './voiceIndicator.follower.js';
import {
	orbTones,
	paintOrbSolid,
	paintRingLight,
	paintRingSolid,
	ringStops
} from './voiceIndicator.paint.js';
import type {
	VoiceIndicatorAppearance,
	VoiceIndicatorCurve,
	VoiceIndicatorMotion,
	VoiceIndicatorSource,
	VoiceIndicatorState,
	VoiceIndicatorTuning,
	VoiceIndicatorVariant
} from './voiceIndicator.props.js';
import {
	bendFrame,
	bendReach,
	leanFrame,
	leanRoom,
	ringLightFrame,
	ringSolidFrame
} from './voiceIndicator.ring.js';

export type VoiceIndicatorEngineInputs = {
	variant: VoiceIndicatorVariant;
	appearance: VoiceIndicatorAppearance;
	state: VoiceIndicatorState;
	input: VoiceIndicatorSource | null | undefined;
	output: VoiceIndicatorSource | null | undefined;
	motion: VoiceIndicatorMotion;
	speed: number;
	sensitivity: number;
	threshold: number;
	curve: VoiceIndicatorCurve;
	curveAmount: number | undefined;
	direction: number | (() => number) | null | undefined;
	/** Strength of the bend toward the pointer, 0 for none. */
	hoverBend: number;
	paused: boolean;
	reducedMotion: boolean;
	dark: boolean;
	/** The colour taking the look over, resolved; null for the spectrum. */
	color: Rgb | null;
	tuning: VoiceIndicatorTuning;
	onLevelChange: ((level: number) => void) | undefined;
};

export type VoiceIndicatorEngine = {
	/** Takes the current inputs into account: draws a frame and starts or stops the loop. */
	sync: () => void;
	destroy: () => void;
};

const TAU = Math.PI * 2;
// A display refreshing faster than this gains nothing from more frames.
const FRAME_MS = 1000 / 62;
// Where the orb's flow clock starts over: 1311 turns of the solid orb's colours.
const FLOW_WRAP = 65550;
// Under reduced motion the loop keeps running this long after a change, so the envelopes settle.
const SETTLE_MS = 1500;

const MOTION: Record<VoiceIndicatorMotion, { rate: number; response: number }> = {
	calm: { rate: 0.7, response: 0.6 },
	balanced: { rate: 1, response: 1 },
	expressive: { rate: 1.3, response: 1.3 }
};

// Each look's own pace, and how far a voice speeds its voice clock up.
const PACE = {
	ringLight: { rate: 1.6, driveGain: 1.1 },
	ringSolid: { rate: 1.2, driveGain: 2.2 },
	orb: { rate: 1, driveGain: 2 }
};

// The orb per state: its rest size, how fast its cloud flows (plus a share of the voice), how
// stirred the cloud is (plus a share of the voice) and the glow round it (plus a share).
const ORB: Record<
	VoiceIndicatorState,
	{ scale: number; flow: [number, number]; activity: [number, number]; glow: [number, number] }
> = {
	idle: { scale: 0.9, flow: [0.24, 0], activity: [0.1, 0], glow: [0.05, 0] },
	connecting: { scale: 0.84, flow: [0.5, 0], activity: [0.2, 0], glow: [0.05, 0] },
	listening: { scale: 1, flow: [0.72, 0.78], activity: [0.28, 0.32], glow: [0.08, 0.1] },
	thinking: { scale: 0.94, flow: [1.1, 0], activity: [0.45, 0], glow: [0.2, 0] },
	speaking: { scale: 1, flow: [1.65, 1.55], activity: [0.66, 0.34], glow: [0.25, 0.6] },
	error: { scale: 0.9, flow: [0.12, 0], activity: [0.05, 0], glow: [0.05, 0] }
};

const isStream = (source: unknown): source is MediaStream =>
	typeof source === 'object' && source !== null && 'getAudioTracks' in source;
const isAnalyser = (source: unknown): source is AnalyserNode =>
	typeof source === 'object' && source !== null && 'getFloatTimeDomainData' in source;

/** The engine drawing on `canvas`, a child of the indicator's root. */
export function createVoiceIndicatorEngine(
	canvas: HTMLCanvasElement,
	read: () => VoiceIndicatorEngineInputs
): VoiceIndicatorEngine {
	const root = canvas.parentElement ?? canvas;
	const follower = new VoiceFollower();
	const washer = new WashFollower();
	const spectrum = smoothSpectrum(SPECTRUM);
	const context = canvas.getContext('2d');

	// Layout: the artwork is a square of `size` centred in the root; a leaning ring is drawn
	// `room` pixels past it on either side.
	let width = 0;
	let height = 0;
	let size = 0;
	let room = 0;
	let ratio = 1;
	const layout = (inputs: VoiceIndicatorEngineInputs) => {
		const box = root.getBoundingClientRect();
		// The laid-out box, not the painted one: a press scales the root.
		const nextWidth = root.clientWidth || box.width;
		const nextHeight = root.clientHeight || box.height;
		const nextSize = Math.min(nextWidth, nextHeight);
		const nextRoom = inputs.variant === 'ring' && inputs.direction != null ? leanRoom(nextSize) : 0;
		const nextRatio = Math.min(2, window.devicePixelRatio || 1);
		if (nextWidth === width && nextHeight === height && nextRoom === room && nextRatio === ratio) {
			return;
		}
		width = nextWidth;
		height = nextHeight;
		size = nextSize;
		room = nextRoom;
		ratio = nextRatio;
		canvas.style.left = `${-room}px`;
		canvas.style.width = `${width + 2 * room}px`;
		canvas.width = Math.max(1, Math.round((width + 2 * room) * ratio));
		canvas.height = Math.max(1, Math.round(height * ratio));
	};

	// One analyser per stream passed in, kept while the stream is still an input or an output.
	const leases = new Map<MediaStream, AnalyserLease | null>();
	const analyserOf = (source: VoiceIndicatorSource | null | undefined): AnalyserNode | null => {
		if (isAnalyser(source)) return source;
		if (!isStream(source)) return null;
		if (!leases.has(source)) leases.set(source, acquireAnalyser(source));
		return leases.get(source)?.analyser ?? null;
	};
	const pruneLeases = (inputs: VoiceIndicatorEngineInputs) => {
		for (const [stream, lease] of leases) {
			if (stream === inputs.input || stream === inputs.output) continue;
			lease?.release();
			leases.delete(stream);
		}
	};

	// The pointer, in the artwork's own pixels, for the bend.
	const pointer = { x: 0, y: 0, over: false };
	let bend = 0;
	let bendX = 0;
	let bendY = 0;
	let tracking = false;
	const onPointerMove = (event: PointerEvent) => {
		if (event.pointerType === 'touch') return;
		const box = root.getBoundingClientRect();
		const scale = width / (box.width || 1);
		pointer.x = (event.clientX - box.left) * scale - (width - size) / 2;
		pointer.y = (event.clientY - box.top) * scale - (height - size) / 2;
		pointer.over = true;
	};
	const onPointerLeave = () => {
		pointer.over = false;
	};
	const track = (wanted: boolean) => {
		if (wanted === tracking) return;
		tracking = wanted;
		const page = root.ownerDocument;
		const view = page.defaultView;
		if (wanted) {
			view?.addEventListener('pointermove', onPointerMove, { passive: true });
			page.documentElement.addEventListener('pointerleave', onPointerLeave);
		} else {
			view?.removeEventListener('pointermove', onPointerMove);
			page.documentElement.removeEventListener('pointerleave', onPointerLeave);
			pointer.over = false;
		}
	};

	// The curve is rebuilt only when the props that describe it change.
	let curve: LevelCurve = levelCurve('soft');
	let curveKey: VoiceIndicatorCurve | undefined;
	let curveAmount: number | undefined;
	const curveOf = (inputs: VoiceIndicatorEngineInputs) => {
		if (inputs.curve !== curveKey || inputs.curveAmount !== curveAmount) {
			curveKey = inputs.curve;
			curveAmount = inputs.curveAmount;
			curve = typeof curveKey === 'function' ? curveKey : levelCurve(curveKey, curveAmount);
		}
		return curve;
	};

	// What eases from frame to frame, beside the follower.
	let palette: CloudPalette | null = null;
	let orbScale = 0;
	let orbVelocity = 0;
	let orbSwell = 1;
	let orbFlowSpeed = 0;
	let orbFlow = 0;
	let orbActivity = 0;
	let orbGlow = 0;
	let presence = 1;
	let reported = -1;

	const drawRing = (
		target: CanvasRenderingContext2D,
		inputs: VoiceIndicatorEngineInputs,
		voice: Voice,
		wash: Wash,
		dt: number,
		still: boolean
	) => {
		const response = MOTION[inputs.motion].response;
		const light = inputs.appearance === 'light';
		let frame = light
			? ringLightFrame(size, voice, inputs.tuning, response)
			: ringSolidFrame(size, voice, inputs.tuning, response);
		frame = leanFrame(frame, voice.pan, size);
		if (inputs.hoverBend > 0) {
			// Only while the indicator waits or works: a voice moving it leaves the pointer be.
			const quiet = inputs.state === 'idle' || inputs.state === 'thinking';
			const rim = Math.hypot(pointer.x - frame.centre[0], pointer.y - frame.centre[1]);
			const near =
				pointer.over && quiet && !still ? bendReach(rim - frame.radius, frame.radius) : 0;
			bend += (near - bend) * (1 - Math.exp(-dt / 0.14));
			const catchUp = bend < 0.01 ? 1 : 1 - Math.exp(-dt / 0.05);
			bendX += (pointer.x - bendX) * catchUp;
			bendY += (pointer.y - bendY) * catchUp;
			if (bend > 0.002) frame = bendFrame(frame, bendX, bendY, bend * inputs.hoverBend);
		}
		if (light) paintRingLight(target, frame, ringStops(wash, inputs.dark), inputs.dark);
		else {
			const turn = 0.25 + voice.spin / TAU + 0.02 * voice.time;
			paintRingSolid(target, frame, spectrum, wash, inputs.dark, turn);
		}
	};

	/** Steps the orb's own eased values and returns where and how big it is. */
	const stepOrb = (
		inputs: VoiceIndicatorEngineInputs,
		voice: Voice,
		dt: number,
		still: boolean
	) => {
		const { rate, response } = MOTION[inputs.motion];
		const tone = ORB[inputs.state];
		// The size follows the voice a little behind the level, so it swells and does not flicker.
		const loud = 0.5 * voice.heard + 0.5 * Math.max(0, voice.level - (inputs.tuning.idle ?? 0.1));
		let swell = 1;
		if (inputs.state === 'listening') {
			swell = 1 - clamp01(loud * response) * (1 - (inputs.tuning.listeningScale ?? 0.8));
		} else if (inputs.state === 'speaking') {
			swell = 1 + clamp01(loud * response) * ((inputs.tuning.speakingScale ?? 1.2) - 1);
		}
		if (still || orbScale === 0) {
			orbScale = tone.scale;
			orbVelocity = 0;
			orbSwell = swell;
		} else {
			// A change of state lands on a spring, with a slight overshoot. The voice does not:
			// its swell eases, or the orb would bounce with every word.
			const w = 11;
			const steps = Math.max(1, Math.ceil(dt * 240));
			const h = dt / steps;
			for (let i = 0; i < steps; i++) {
				orbVelocity += (w * w * (tone.scale - orbScale) - 2 * 0.7 * w * orbVelocity) * h;
				orbScale += orbVelocity * h;
			}
			orbSwell = follow(orbSwell, swell, dt, 0.16, 0.3);
		}
		const settle = (current: number, [base, share]: [number, number], tau: number) =>
			still ? base + share * loud : follow(current, base + share * loud, dt, tau, tau);
		orbFlowSpeed = settle(orbFlowSpeed, tone.flow, 0.35);
		orbActivity = settle(orbActivity, tone.activity, 0.3);
		orbGlow = settle(orbGlow, tone.glow, 0.25);
		// Wrapped, so the shader's numbers stay small however long the orb runs: the cloud changes
		// pattern once at the wrap, hours apart. A whole number of the solid orb's turns.
		if (!still) orbFlow = (orbFlow + dt * orbFlowSpeed * rate * inputs.speed) % FLOW_WRAP;
		// Thinking breathes; the breath comes and goes with the eased blend.
		const breath = 1 + 0.03 * voice.thinking * Math.sin(follower.clock * 2.4);
		return {
			x: room + width / 2 + voice.pan * size * 0.15,
			y: height / 2,
			radius: (size / 2) * (inputs.tuning.radius ?? 0.55) * orbScale * orbSwell * breath
		};
	};

	const step = (dt: number) => {
		const inputs = read();
		layout(inputs);
		if (size <= 0) return;
		const still = inputs.paused || inputs.reducedMotion;
		const hears = inputs.state === 'listening' || inputs.state === 'speaking';
		const pace =
			inputs.variant === 'orb'
				? PACE.orb
				: inputs.appearance === 'light'
					? PACE.ringLight
					: PACE.ringSolid;
		const { rate } = MOTION[inputs.motion];

		const source = hears
			? inputs.state === 'speaking'
				? (inputs.output ?? inputs.input)
				: (inputs.input ?? inputs.output)
			: null;
		const analyser = analyserOf(source);
		// The curve was tuned at a gain of 0.85; `sensitivity` multiplies it.
		const gain = 0.85 * inputs.sensitivity;
		if (analyser) follower.readAnalyser(analyser, gain, dt);
		else if (typeof source === 'number') follower.readLevel(source, gain);
		else if (typeof source === 'function') follower.readLevel(source(), gain);
		else follower.readSilence();

		const direction =
			typeof inputs.direction === 'function' ? inputs.direction() : (inputs.direction ?? 0);
		const voice = follower.step(
			inputs.paused ? 0 : dt,
			{
				threshold: inputs.threshold,
				curve: curveOf(inputs),
				attack: inputs.tuning.attack ?? 0.06,
				release: inputs.tuning.release ?? 0.32,
				idle: inputs.tuning.idle ?? 0.1,
				calm: inputs.tuning.calm ?? 0.4,
				driveGain: pace.driveGain,
				rate: pace.rate * rate * inputs.speed,
				thinking: inputs.state === 'thinking' || inputs.state === 'connecting',
				direction
			},
			still
		);
		if (Math.abs(voice.level - reported) > 0.002) {
			reported = voice.level;
			inputs.onLevelChange?.(voice.level);
		}
		const wash = washer.step(dt, inputs.color, still);

		// Connecting dims the indicator, pulsing slowly; every other state shows it in full.
		const dim =
			inputs.state === 'connecting' ? (still ? 0.7 : 0.62 + 0.2 * Math.sin(follower.clock * 3)) : 1;
		presence = still ? dim : follow(presence, dim, dt, 0.25, 0.25);
		canvas.style.opacity = presence > 0.995 ? '' : presence.toFixed(3);

		if (!context) return;
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width + 2 * room, height);
		if (inputs.variant === 'orb') {
			const orb = stepOrb(inputs, voice, dt, still);
			if (inputs.appearance === 'light') {
				const goal = inputs.color ? cloudPalette(inputs.color) : SPECTRUM_CLOUD;
				palette = !palette || still ? goal : blendCloud(palette, goal, 1 - Math.exp(-dt / 0.45));
				context.setTransform(1, 0, 0, 1, 0, 0);
				const painted = paintCloud(context, {
					x: orb.x * ratio,
					y: orb.y * ratio,
					radius: orb.radius * ratio,
					time: orbFlow,
					activity: orbActivity,
					glow: orbGlow,
					palette
				});
				if (painted) return;
				// Without WebGL the orb in light is drawn as the solid orb.
				context.setTransform(ratio, 0, 0, ratio, 0, 0);
			}
			const turn = 0.02 * orbFlow + voice.spin / TAU;
			const tones = orbTones(spectrum, wash, inputs.dark);
			// The solid orb carries the same clouds as the orb in light, in its own full tones and
			// with no glow of their own. Fallen back from the orb in light, there is no WebGL to
			// draw them with.
			const clouds =
				inputs.appearance === 'solid'
					? () => {
							context.save();
							context.setTransform(1, 0, 0, 1, 0, 0);
							const painted = paintCloud(context, {
								x: orb.x * ratio,
								y: orb.y * ratio,
								radius: orb.radius * ratio,
								time: orbFlow,
								activity: orbActivity,
								glow: 0,
								palette: solidCloudPalette(tones)
							});
							context.restore();
							return painted;
						}
					: undefined;
			paintOrbSolid(context, orb.x, orb.y, orb.radius, tones, inputs.dark, turn, orbGlow, clouds);
			return;
		}
		// The artwork's own square, centred in the root, past the room a lean is given.
		context.setTransform(
			ratio,
			0,
			0,
			ratio,
			(room + (width - size) / 2) * ratio,
			((height - size) / 2) * ratio
		);
		drawRing(context, inputs, voice, wash, dt, still);
	};

	let frame = 0;
	let running = false;
	let visible = true;
	let lastStep = 0;
	let lastPaint = 0;
	let settleUntil = 0;
	let destroyed = false;

	/** Whether the loop has anything to animate with the inputs as they are. */
	const wantsLoop = (now: number) => {
		const inputs = read();
		if (inputs.paused || !visible || root.ownerDocument.visibilityState === 'hidden') return false;
		if (!inputs.reducedMotion) return true;
		// Under reduced motion the clocks hold: only a voice, or a change settling, needs frames.
		const hears = inputs.state === 'listening' || inputs.state === 'speaking';
		return (hears && (inputs.input != null || inputs.output != null)) || now < settleUntil;
	};
	const loop = (now: number) => {
		if (!running) return;
		if (!wantsLoop(now)) {
			running = false;
			return;
		}
		frame = requestAnimationFrame(loop);
		if (now - lastPaint < FRAME_MS) return;
		lastPaint = now;
		const dt = lastStep ? Math.min(0.05, (now - lastStep) / 1000) : 1 / 60;
		lastStep = now;
		step(dt);
	};
	const start = () => {
		if (running || destroyed) return;
		running = true;
		lastStep = 0;
		frame = requestAnimationFrame(loop);
	};
	const stop = () => {
		running = false;
		cancelAnimationFrame(frame);
	};

	function sync() {
		if (destroyed) return;
		const inputs = read();
		pruneLeases(inputs);
		const fine =
			typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
		track(inputs.variant === 'ring' && inputs.hoverBend > 0 && !inputs.reducedMotion && fine);
		const now = performance.now();
		settleUntil = now + SETTLE_MS;
		if (wantsLoop(now)) start();
		else {
			stop();
			// Held, the indicator still shows its inputs as they are now.
			step(0);
		}
	}

	const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : null;
	resize?.observe(root);
	const intersection =
		typeof IntersectionObserver === 'function'
			? new IntersectionObserver(([entry]) => {
					visible = entry.isIntersecting;
					if (visible) sync();
					else stop();
				})
			: null;
	intersection?.observe(root);
	const onVisibility = () => sync();
	root.ownerDocument.addEventListener('visibilitychange', onVisibility);

	step(1 / 60);
	sync();

	return {
		sync,
		destroy() {
			destroyed = true;
			stop();
			track(false);
			resize?.disconnect();
			intersection?.disconnect();
			root.ownerDocument.removeEventListener('visibilitychange', onVisibility);
			for (const lease of leases.values()) lease?.release();
			leases.clear();
		}
	};
}
