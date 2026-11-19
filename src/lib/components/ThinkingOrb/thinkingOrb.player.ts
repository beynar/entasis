// Plays an orb on a canvas: sizes the canvas to its box, picks the drawing for the state and the
// size, and paints a frame per animation frame while the orb can be seen. Every orb reads the
// same clock, so two orbs in the same state move together, and one loop drives them all.

import type { Rgb } from '$lib/utils/cssColor.js';
import {
	finalizeFrame,
	paintFrame,
	type ThinkingOrbFrameFunction,
	type ThinkingOrbOptions
} from './thinkingOrb.core.js';
import { THINKING_ORB_FRAMES } from './thinkingOrb.modes.js';
import { resolveThinkingOrb } from './thinkingOrb.presets.js';
import type { ThinkingOrbState, ThinkingOrbTuning } from './thinkingOrb.props.js';

export type ThinkingOrbPlayerInputs = {
	state: ThinkingOrbState;
	speed: number;
	paused: boolean;
	reducedMotion: boolean;
	/** Whether the orb sits on a dark surface: the ink then fades toward black with depth. */
	dark: boolean;
	/** The ink, or null until it is read from the page. */
	ink: Rgb | null;
	dots: number;
	dotSize: number;
	tuning?: ThinkingOrbTuning;
	frame?: ThinkingOrbFrameFunction;
};

export type ThinkingOrbPlayer = {
	/** Takes the inputs into account now, also while the loop is held. */
	sync: () => void;
	destroy: () => void;
};

/** Seconds one state takes to cross into the next. */
const FADE = 0.28;
/** How much smaller a drawing is as it arrives and as it leaves. */
const FADE_SCALE = 0.08;
/** The instant shown under reduced motion: a frame where every drawing reads well. */
const STILL = 0.6;
/** Canvas pixels per CSS pixel, at most: the dots of a 20px orb need every device pixel. */
const MAX_RATIO = 3;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

const seconds = () => performance.now() / 1000;

// One loop for every orb on the page. Each frame reads the clock once for all of them, so orbs
// in the same state paint the very same instant.
type Draw = (clock: number) => void;
const playing = new Set<Draw>();
let request = 0;
const tick = () => {
	request = 0;
	const clock = seconds();
	for (const draw of playing) draw(clock);
	if (playing.size && !request) request = requestAnimationFrame(tick);
};
const join = (draw: Draw) => {
	playing.add(draw);
	if (!request) request = requestAnimationFrame(tick);
};
const leave = (draw: Draw) => {
	playing.delete(draw);
	if (!playing.size && request) {
		cancelAnimationFrame(request);
		request = 0;
	}
};

type Scene = {
	/** What makes it a different drawing: the state, or a custom frame function. */
	state: ThinkingOrbState;
	custom: ThinkingOrbFrameFunction | undefined;
	draw: ThinkingOrbFrameFunction;
	options: ThinkingOrbOptions;
	/** Drawing time per second of the clock. */
	rate: number;
	/** Added to `clock * rate`, so a change of pace does not jump. 0 keeps orbs in phase. */
	offset: number;
	/** The time held while paused. */
	held: number | null;
};

export function createThinkingOrbPlayer(
	canvas: HTMLCanvasElement,
	read: () => ThinkingOrbPlayerInputs
): ThinkingOrbPlayer {
	let ctx: CanvasRenderingContext2D | null = null;
	let inputs = read();
	let scene: Scene | null = null;
	let leaving: Scene | null = null;
	let fadeStart = 0;
	// The side of the square the orb is drawn in, and the box it is centred in, in CSS pixels.
	let size = 0;
	let width = 0;
	let height = 0;
	let ratio = 1;
	let visible = true;
	let destroyed = false;

	const measure = () => {
		width = canvas.clientWidth;
		height = canvas.clientHeight;
		size = Math.min(width, height);
		ratio = Math.min(MAX_RATIO, window.devicePixelRatio || 1);
		const w = Math.round(width * ratio);
		const h = Math.round(height * ratio);
		// Setting a canvas's size clears it, also to the size it has.
		if (canvas.width !== w) canvas.width = w;
		if (canvas.height !== h) canvas.height = h;
	};

	const timeOf = (of: Scene, clock: number) =>
		inputs.reducedMotion ? STILL : (of.held ?? clock * of.rate + of.offset);

	const stage = () => {
		const { state, frame: custom } = inputs;
		const resolved = resolveThinkingOrb(state, size, inputs);
		const rate = resolved.speed * inputs.speed;
		const clock = seconds();
		if (scene && scene.state === state && scene.custom === custom) {
			// The same drawing, retuned: it goes on from where it is.
			if (scene.rate !== rate) scene.offset += clock * (scene.rate - rate);
			scene.rate = rate;
			scene.options = resolved.options;
		} else {
			const still = inputs.reducedMotion || inputs.paused || !visible;
			leaving = scene && !still ? scene : null;
			fadeStart = clock;
			scene = {
				state,
				custom,
				// A custom frame is finished here: sorted from far to near, with what cannot be
				// seen left out.
				draw: custom
					? (s, t, o) => {
							const made = custom(s, t, o);
							return finalizeFrame(made.dots ?? [], made.lines ?? []);
						}
					: THINKING_ORB_FRAMES[resolved.mode],
				options: resolved.options,
				rate,
				offset: 0,
				held: null
			};
		}
		if (inputs.paused) scene.held ??= clock * scene.rate + scene.offset;
		else scene.held = null;
	};

	const paint = (of: Scene, clock: number, opacity: number, scale: number) => {
		const frame = of.draw(size, timeOf(of, clock), of.options);
		const dx = (width - size) / 2 + (size / 2) * (1 - scale);
		const dy = (height - size) / 2 + (size / 2) * (1 - scale);
		ctx!.setTransform(ratio * scale, 0, 0, ratio * scale, dx * ratio, dy * ratio);
		paintFrame(ctx!, frame, inputs.dark, inputs.ink ?? (inputs.dark ? WHITE : BLACK), opacity);
	};

	const draw: Draw = (clock) => {
		if (!scene || size <= 0) return;
		ctx ??= canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const progress = leaving ? (clock - fadeStart) / FADE : 1;
		if (!leaving || progress >= 1) {
			leaving = null;
			paint(scene, clock, 1, 1);
			return;
		}
		const eased = progress * progress * (3 - 2 * progress);
		paint(leaving, clock, 1 - eased, 1 - FADE_SCALE * eased);
		paint(scene, clock, eased, 1 - FADE_SCALE * (1 - eased));
	};

	const sync = () => {
		if (destroyed) return;
		inputs = read();
		if (size <= 0) measure();
		stage();
		if (visible && size > 0 && !inputs.paused && !inputs.reducedMotion) join(draw);
		else {
			leave(draw);
			leaving = null;
		}
		draw(seconds());
	};

	const resizes =
		typeof ResizeObserver === 'undefined'
			? null
			: new ResizeObserver(() => {
					measure();
					sync();
				});
	resizes?.observe(canvas);
	const sights =
		typeof IntersectionObserver === 'undefined'
			? null
			: new IntersectionObserver((entries) => {
					visible = entries[entries.length - 1].isIntersecting;
					sync();
				});
	sights?.observe(canvas);

	sync();

	return {
		sync,
		destroy() {
			destroyed = true;
			leave(draw);
			resizes?.disconnect();
			sights?.disconnect();
		}
	};
}
