// The ring variant's geometry: closed lines round a centre, bent by the voice. Pure maths over
// (size, voice, tuning) with no drawing surface; the painters in `voiceIndicator.paint.ts` draw
// what these return.
//
// Two looks share it. In light, a handful of rings lean a few degrees off the view axis, each
// drifting on its own heading, so the rim reads as one luminous ribbon that thickens where the
// rings part. Solid, three loops lie almost face-on and a voice opens them into a turning globe.
//
// @license Portions adapted from Voice Ring (libraries.dev/voice-ring).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT

import { clamp01, smoothstep } from './voiceIndicator.color.js';
import type { Voice } from './voiceIndicator.follower.js';
import type { VoiceIndicatorTuning } from './voiceIndicator.props.js';

const TAU = Math.PI * 2;

/** A closed line in the indicator's own CSS pixels (0 to size). */
export type Stroke = {
	/** Flat `[x0, y0, x1, y1, …]`. */
	points: number[];
	/** Light per point, 0 to 1. */
	light: number[];
	/** Depth per point, -1 far to 1 near: draw order and thickness of a solid loop. */
	depth?: number[];
	width: number;
};

/** How a frame drawn in light is lit. */
export type RingLight = {
	/** Where the spectrum starts, radians clockwise from +x. */
	angle: number;
	/** Overall brightness, about 0.5 at rest to 1 in full voice. */
	intensity: number;
	/** Strength of the soft halo around the rings. */
	halo: number;
	/** A specular hot spot: white light pooled where it touches the rings. */
	highlight: { x: number; y: number; radius: number; alpha: number };
	/** Chromatic fringe offset, as a share of the radius. */
	fringe: number;
};

export type RingFrame = {
	strokes: Stroke[];
	centre: [number, number];
	/** The rest radius the frame is built on. */
	radius: number;
	/** Present on a frame drawn in light. */
	light?: RingLight;
};

/** Line widths are tuned for a 200px indicator and shrink more slowly than it does. */
const widthScale = (size: number, power: number) => (size / 200) ** power;

/** How many segments a size carries, relative to the 200px design. */
const segments = (size: number, count: number, floor: number) =>
	Math.max(floor, Math.round(count * Math.min(1.4, Math.max(0.2, size / 200)) ** 0.5));

/** `value`, easing into `limit` instead of passing it. */
const ceiling = (value: number, limit: number) =>
	limit <= 0 ? 0 : limit * Math.tanh(value / limit);

/** Deterministic hash in [0, 1). */
const hash = (a: number, b: number) => {
	const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
	return h - Math.floor(h);
};

const sinc = (a: number) => (a < 1e-6 ? 1 : Math.sin(a) / a);
// |wave vector| of each term of the skin field, for its average over the sphere.
const K_LOBE_1 = Math.hypot(2.1, 1.3);
const K_LOBE_2 = Math.hypot(1.9, 1.7);
const K_FINE_DIFF = Math.hypot(4.3 - 2.9, -3.7, -3.1);
const K_FINE_SUM = Math.hypot(4.3 + 2.9, 3.7, -3.1);

/**
 * One smooth field over the unit sphere, broad lobes plus a finer ripple, so every ring sampling
 * it bends together like a skin. Its average over the sphere is taken out, so it changes the
 * shape and never the size: broad bulges would otherwise read as the whole ring pulsing.
 */
function skinField(lobe: number, fine: number, clock: number, radius: number) {
	const k = 1 / Math.max(0.05, radius);
	const p1 = 0.9 * clock;
	const p2 = -0.7 * clock + 1.3;
	const p3 = 2.1 * clock;
	const p4 = -1.6 * clock;
	const mean =
		lobe * (0.55 * Math.sin(p1) * sinc(K_LOBE_1 * k) + 0.45 * Math.sin(p2) * sinc(K_LOBE_2 * k)) +
		fine *
			0.5 *
			(Math.cos(p3 - p4) * sinc(K_FINE_DIFF * k) - Math.cos(p3 + p4) * sinc(K_FINE_SUM * k));
	return (x: number, y: number, z: number) => {
		x *= k;
		y *= k;
		z *= k;
		return (
			lobe * (0.55 * Math.sin(2.1 * x + 1.3 * y + p1) + 0.45 * Math.sin(1.7 * z - 1.9 * y + p2)) +
			fine * Math.sin(4.3 * x - 3.1 * z + p3) * Math.sin(3.7 * y + 2.9 * x + p4) -
			mean
		);
	};
}

/**
 * The ring in light. `response` scales how far a voice bends and swells it (the `motion` prop).
 * Thinking contracts it a touch, spins its colours round and sweeps the highlight like a loader.
 */
export function ringLightFrame(
	size: number,
	voice: Voice,
	tuning: VoiceIndicatorTuning,
	response: number
): RingFrame {
	const half = size / 2;
	const level = voice.level;
	// The shape rides the slow envelopes only: it flows with a phrase and does not bounce with
	// each syllable. The fast level goes to the light, which may flicker.
	const [low, mid, high] = voice.softBands;
	const t = voice.time;
	const clock = voice.drive;
	const thinking = voice.thinking;
	const loud = 0.5 * level + 0.5 * voice.soft;
	// Halo and bloom spill past the rings, so they rest well inside the box.
	const radius =
		half * (tuning.radius ?? 0.56) * (1 + 0.07 * response * voice.soft) * (1 - 0.06 * thinking);
	const deform = (tuning.deform ?? 1.45) * response;
	// How deep a bulge may get, whatever the voice and the tuning: past it the ring stops reading
	// as a ring. A livelier motion raises it a little, not in proportion.
	const reach = Math.sqrt(response);
	const field = skinField(
		0.02 + ceiling((0.14 * low + 0.06 * voice.soft) * deform, 0.22 * reach),
		0.01 + ceiling((0.07 * mid + 0.03 * high) * deform, 0.07 * reach),
		clock,
		1.75
	);
	const width = Math.max(0.6, (tuning.lineWidth ?? 1.85) * widthScale(size, 0.5));
	const rings = Math.max(1, Math.round(tuning.rings ?? 6));
	const count = segments(size, 140, 24);
	const spread = tuning.spread ?? 0.91;
	const gap = tuning.gap ?? 0.02;

	// Rings first as directions and skin values, then drawn: the rings lie near one circle rather
	// than over the sphere, so the field's sphere average does not quite cancel on them. Their own
	// shared average is taken out too, and the bulges never change the ring's size.
	const built: Array<{ directions: number[]; skin: number[]; light: number[]; radius: number }> =
		[];
	let sum = 0;
	let total = 0;
	for (let k = 0; k < rings; k++) {
		// Each ring tumbles on the voice clock, alternate rings turning opposite ways, and tips a
		// little further as it goes. Silence leaves only the slow ambient drift.
		const spin = 0.16 * (0.5 + hash(k, 2.1)) * (k % 2 ? 1 : -1);
		const lean = Math.max(
			0.02,
			spread * (0.2 + 0.8 * hash(k, 3.1)) +
				0.03 * Math.sin(t * 0.27 + k * 1.3) +
				0.08 * Math.sin(clock * 0.35 + k * 1.7)
		);
		const heading = hash(k, 7.7) * TAU + t * 0.05 * (k % 2 ? 1 : -1) + clock * spin;
		const nx = Math.sin(lean) * Math.cos(heading);
		const ny = Math.sin(lean) * Math.sin(heading);
		const nz = Math.cos(lean);
		const ul = Math.hypot(nx, nz);
		const ux = nz / ul;
		const uz = -nx / ul;
		const vx = ny * uz;
		const vy = nz * ux - nx * uz;
		const vz = -ny * ux;
		const sl = Math.sin(lean);
		const directions: number[] = [];
		const skin: number[] = [];
		const light: number[] = [];
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * TAU;
			const c = Math.cos(angle);
			const s = Math.sin(angle);
			const x = ux * c + vx * s;
			const y = vy * s;
			const z = uz * c + vz * s;
			const value = field(x, y, z);
			directions.push(x, y);
			skin.push(value);
			sum += value;
			total++;
			// The near half of a ring a touch brighter than the far half.
			light.push(0.62 + 0.38 * clamp01((z / sl + 1) / 2));
		}
		// A hair of concentric spread bundles the rings into one glassy tube.
		built.push({ directions, skin, light, radius: radius * (1 + gap * (k - (rings - 1) / 2)) });
	}
	const mean = total ? sum / total : 0;
	// The first harmonic round the ring is a shift, not a bend: a circle pushed out by
	// ε·cos(θ − φ) is the same circle moved over by ε. Broad bulges are mostly that, so the ring
	// would slide about instead of bending. It is measured across all rings and taken out.
	let c1 = 0;
	let s1 = 0;
	for (const { directions, skin } of built) {
		for (let i = 0; i < skin.length; i++) {
			const x = directions[2 * i];
			const y = directions[2 * i + 1];
			const length = Math.hypot(x, y) || 1;
			c1 += (skin[i] - mean) * (x / length);
			s1 += (skin[i] - mean) * (y / length);
		}
	}
	c1 = total ? (2 * c1) / total : 0;
	s1 = total ? (2 * s1) / total : 0;
	const strokes: Stroke[] = built.map(({ directions, skin, light, radius: own }) => {
		const points: number[] = [];
		for (let i = 0; i < skin.length; i++) {
			const x = directions[2 * i];
			const y = directions[2 * i + 1];
			const length = Math.hypot(x, y) || 1;
			const r = own * (1 + skin[i] - mean - c1 * (x / length) - s1 * (y / length));
			points.push(half + x * r, half - y * r);
		}
		return { points, light, width };
	});

	// The highlight rests low on the left; thinking sweeps it round.
	const highlightAt = 2.3 + 0.25 * Math.sin(t * 0.21) + 2 * voice.spin;
	return {
		strokes,
		centre: [half, half],
		radius,
		light: {
			// Warm at the top, cool below, swaying rather than turning: the spectrum flows with the
			// voice but keeps its sense of up. Thinking spins it all the way round.
			angle:
				-Math.PI / 2 - 0.35 + 0.5 * Math.sin(t * 0.07) + 0.4 * Math.sin(clock * 0.2) + voice.spin,
			intensity: (0.62 + 0.55 * loud + 0.5 * thinking) * 0.78,
			halo: (tuning.halo ?? 0.5) * (1 + 0.6 * thinking),
			highlight: {
				x: half + Math.cos(highlightAt) * radius,
				y: half + Math.sin(highlightAt) * radius,
				radius: radius * (0.5 + 0.25 * thinking),
				alpha: (0.5 + 0.35 * loud + 0.4 * thinking) * 1.4
			},
			fringe: 0.016 + 0.012 * loud
		}
	};
}

// The light on a solid loop: from the upper left, a little in front.
const LIGHT_X = -0.45;
const LIGHT_Y = 0.55;
const LIGHT_Z = 0.7;
const LIGHT_LENGTH = Math.hypot(LIGHT_X, LIGHT_Y, LIGHT_Z);

/**
 * The ring as solid loops. Waiting, they lie almost face-on, a few degrees apart, so it reads as
 * one round loop, barely bent; it never quite rests, the loops swaying apart and back. A voice
 * opens them out into a globe and sets them warping. Every motion is a sum of slow sines on the
 * voice clock and the voice comes in on the slow envelope only, so it morphs and never jumps.
 */
export function ringSolidFrame(
	size: number,
	voice: Voice,
	tuning: VoiceIndicatorTuning,
	response: number
): RingFrame {
	const half = size / 2;
	const thinking = voice.thinking;
	const loud = voice.soft;
	const mids = voice.softBands[1];
	const t = voice.time;
	// The loops reach out to about 1.25 radii at the most.
	const radius =
		half * (tuning.radius ?? 0.48) * (1 + 0.05 * response * loud) * (1 - 0.06 * thinking);
	const deform = (tuning.deform ?? 1.85) * response;
	const rings = Math.max(1, Math.round(tuning.rings ?? 3));
	const count = segments(size, 180, 48);
	const width = Math.max(0.8, (tuning.lineWidth ?? 3) * widthScale(size, 0.6));
	// How far the loops lean off the view axis: a few degrees waiting, a globe in voice.
	const lean = (tuning.tilt ?? 0.22) + (tuning.open ?? 0.75) * loud;
	// How bent they are: all but round waiting, warped in voice.
	// A livelier motion warps them further, but never all the way: fully warped, the loops stop
	// reading as a ring.
	const bend = 0.12 + 0.88 * ceiling(loud * deform * 0.8, Math.min(1, 0.6 * Math.sqrt(response)));
	const twist = (tuning.twist ?? 1.2) * bend;
	const wobble = (tuning.wobble ?? 0.31) * bend;
	const u = voice.drive * 1.5;

	// The waiting motion, gone once the voice has the loops.
	const calm = 1 - smoothstep(0.1, 0.5, loud);
	const sway = 0.18 * calm;
	const swell = 0.05 * calm;
	const drift = 0.03 * calm;
	const cx = half + radius * drift * Math.sin(0.9 * t + 0.6);
	const cy = half + radius * drift * Math.sin(0.7 * t + 2.1);

	const strokes: Stroke[] = [];
	for (let k = 0; k < rings; k++) {
		// Each loop on its own phases, a golden turn apart, so they never move in step.
		const phase = k * 2.399;
		// The loops tip opposite ways, so they cross like the lines of a globe.
		const tip =
			lean * (1 + 0.25 * Math.sin(0.17 * u + phase)) + sway * Math.sin(1.3 * t + 1.3 * phase);
		const heading =
			(k * TAU) / rings +
			0.23 * u * (k % 2 ? -1 : 1) +
			0.4 * Math.sin(0.11 * u + phase) +
			voice.spin;
		const nx = Math.sin(tip) * Math.cos(heading);
		const ny = Math.sin(tip) * Math.sin(heading);
		const nz = Math.cos(tip);
		const ul = Math.hypot(nx, nz) || 1;
		const ux = nz / ul;
		const uz = -nx / ul;
		const vx = ny * uz;
		const vy = nz * ux - nx * uz;
		const vz = -ny * ux;

		// Out of the plane: a saddle and a gentler three-fold.
		const b2 = 0.2 * twist * Math.sin(0.29 * u + 1.3 + phase);
		const p2 = 0.37 * u + phase;
		const b3 = 0.07 * twist * Math.sin(0.23 * u + 0.4 + phase);
		const p3 = -0.31 * u + 2.1 + phase;
		// In the plane: an oval and a three-lobed wobble; the mids add a four-fold swell.
		const a2 = 0.07 * wobble * Math.sin(0.33 * u + 0.4 + phase);
		const q2 = 0.41 * u + phase;
		const a3 = 0.04 * wobble * Math.sin(0.27 * u + 1 + phase);
		const q3 = -0.35 * u + 0.8 + phase;
		const a4 = 0.04 * ceiling(deform * mids, 1.1);
		const q4 = 0.5 * u + phase;
		// Waiting: a slow oval and three-lobed swell, turning round the loop.
		const s2 = swell * Math.sin(1.1 * t + 0.7 + phase);
		const r2 = 0.7 * t + phase;
		const s3 = 0.6 * swell * Math.sin(1.5 * t + 1.9 + phase);
		const r3 = -0.5 * t + phase;
		// Each a hair smaller than the last, so where they meet they part.
		const own = 1 - (tuning.gap ?? 0.035) * k;

		const xs: number[] = [];
		const ys: number[] = [];
		const zs: number[] = [];
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * TAU;
			const c = Math.cos(angle);
			const s = Math.sin(angle);
			const r =
				own *
				(1 +
					a2 * Math.cos(2 * angle + q2) +
					a3 * Math.cos(3 * angle + q3) +
					a4 * Math.cos(4 * angle + q4) +
					s2 * Math.cos(2 * angle + r2) +
					s3 * Math.cos(3 * angle + r3));
			const h = own * (b2 * Math.sin(2 * angle + p2) + b3 * Math.sin(3 * angle + p3));
			xs.push((ux * c + vx * s) * r + nx * h);
			ys.push(vy * s * r + ny * h);
			zs.push((uz * c + vz * s) * r + nz * h);
		}

		const points: number[] = [];
		const light: number[] = [];
		const depth: number[] = [];
		for (let i = 0; i < count; i++) {
			points.push(cx + xs[i] * radius, cy - ys[i] * radius);
			// A tube is brightest across the light, darkest along it: its tangent against the
			// light tells how much of its round face catches it.
			const next = (i + 1) % count;
			const previous = (i + count - 1) % count;
			const tx = xs[next] - xs[previous];
			const ty = ys[next] - ys[previous];
			const tz = zs[next] - zs[previous];
			const length = Math.hypot(tx, ty, tz) || 1;
			const along = (tx * LIGHT_X + ty * LIGHT_Y + tz * LIGHT_Z) / (length * LIGHT_LENGTH);
			const lit = Math.sqrt(Math.max(0, 1 - along * along));
			const near = clamp01((zs[i] + 1) / 2);
			light.push(clamp01(0.12 + 0.6 * lit * (0.55 + 0.45 * near) + 0.28 * near + 0.08 * loud));
			depth.push(near * 2 - 1);
		}
		strokes.push({ points, light, depth, width });
	}
	return { strokes, centre: [cx, cy], radius };
}

// How far the ring leans toward a voice, each as a share of its reach at full pan: the whole
// ring drifts, its near side is drawn out further than the far side, and the near flank bulges.
const LEAN_MOVE = 0.3;
const LEAN_PULL = 0.36;
const LEAN_BULGE = 0.28;
// The rings fill roughly this much of the box.
const LEAN_REACH = 0.36;

/** CSS pixels a leaning ring can carry a mark sideways: the room it needs either side. */
export const leanRoom = (size: number) =>
	Math.ceil(size * LEAN_REACH * (LEAN_MOVE + LEAN_PULL + 2 * LEAN_BULGE)) + 2;

/**
 * Bends `frame` in place toward `pan` (-1 left to 1 right). Points keep their height, so a bulge
 * reads as the ring leaning, not inflating.
 */
export function leanFrame(frame: RingFrame, pan: number, size: number): RingFrame {
	if (Math.abs(pan) < 0.002) return frame;
	const centre = size / 2;
	const reach = size * LEAN_REACH;
	const side = pan < 0 ? -1 : 1;
	const shift = (x: number, y: number) => {
		const nx = (x - centre) / reach;
		const ny = (y - centre) / reach;
		// 0 on the far side to 1 on the near side.
		const near = clamp01((nx * side + 1) / 2);
		const flank = Math.max(0, nx * side);
		return (
			pan *
			reach *
			(LEAN_MOVE + LEAN_PULL * near * near + LEAN_BULGE * flank * flank * Math.exp(-ny * ny * 1.5))
		);
	};
	for (const stroke of frame.strokes) {
		for (let i = 0; i < stroke.points.length; i += 2) {
			stroke.points[i] += shift(stroke.points[i], stroke.points[i + 1]);
		}
	}
	frame.centre[0] += pan * reach * LEAN_MOVE;
	if (frame.light) frame.light.highlight.x += pan * reach * LEAN_MOVE;
	return frame;
}

/**
 * How much a pointer at `rim` px outside the ring (negative inside) bends it: nothing beyond
 * 0.8 radius out, full from 0.2 radius out and inside.
 */
export const bendReach = (rim: number, radius: number) =>
	clamp01((0.8 * radius - rim) / (0.6 * radius));

/**
 * Bends `frame` in place toward a pointer: every point near it is drawn toward it, up to 90% of
 * the way at full `amount`, falling off a little narrower than the ring, so the ring bulges
 * toward the cursor like a membrane while its far side stays put.
 */
export function bendFrame(frame: RingFrame, x: number, y: number, amount: number): RingFrame {
	const spread = (frame.radius * 0.7) ** 2;
	const k = 0.9 * clamp01(amount);
	for (const stroke of frame.strokes) {
		const points = stroke.points;
		for (let i = 0; i < points.length; i += 2) {
			const dx = x - points[i];
			const dy = y - points[i + 1];
			const w = k * Math.exp(-(dx * dx + dy * dy) / spread);
			points[i] += dx * w;
			points[i + 1] += dy * w;
		}
	}
	return frame;
}
