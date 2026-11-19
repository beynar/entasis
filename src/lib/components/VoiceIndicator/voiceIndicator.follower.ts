// The voice follower: turns raw readings (an AnalyserNode, or a plain 0 to 1 level) into the
// shaped, smoothed voice every look draws from. One per indicator; it keeps its own clocks, so a
// paused or offscreen indicator resumes in phase.
//
// The shaping is gain, noise gate, a response curve, then a one-pole attack and release envelope.
// On top sit a slow envelope (shape and size, which look mechanical if they pump with every
// syllable), the thinking blend and the voice clock that motion speeds up on.
//
// @license Portions adapted from Voice Ring (libraries.dev/voice-ring).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT

import { clamp01, type Rgb } from './voiceIndicator.color.js';

export type Voice = {
	/** Loudness envelope, 0 to 1, with the idle breathing folded in. */
	level: number;
	/** Low, mid and high envelopes, 0 to 1: chest, vowels, sibilance. */
	bands: [number, number, number];
	/** `level` on a slow envelope, for shape and size. */
	soft: number;
	/** `bands` on the same slow envelope. */
	softBands: [number, number, number];
	/** The voice alone on the slow envelope, without the idle breathing. */
	heard: number;
	/** The ambient clock, in seconds: slow drift and sway. */
	time: number;
	/** The voice clock, in seconds: it runs faster while someone speaks, without a jump. */
	drive: number;
	/** How far into thinking, 0 to 1, eased. */
	thinking: number;
	/** Thinking's turn, in radians: it winds up, runs down and settles on a whole turn. */
	spin: number;
	/** Where the voice comes from, -1 left to 1 right, eased; back to 0 in silence. */
	pan: number;
};

export type FollowerConfig = {
	threshold: number;
	/** The curve a loudness above the gate is shown through. */
	curve: LevelCurve;
	attack: number;
	release: number;
	/** Breathing kept under the voice, so silence never looks dead. */
	idle: number;
	/** With no voice and no work, the clocks run at this share of their speed. */
	calm: number;
	/** The voice clock runs at 1 + driveGain × the voice on its slow envelope. */
	driveGain: number;
	/** Seconds of motion per real second. */
	rate: number;
	thinking: boolean;
	/** Where the source says the voice is, -1 left to 1 right. */
	direction: number;
};

// Thinking's turn, radians per second of motion, and the fastest it settles home.
const SPIN = 2.1;
const SETTLE_MAX = 0.3;
// The lean eases on a critically damped spring: stiffer to follow a side than to drift home.
const PAN_IN = 2.5;
const PAN_OUT = 1.6;
// A laptop microphone at speaking distance gives an RMS of about 0.03 to 0.2; this lifts it into
// the range the shaping curve expects.
const BASE_GAIN = 5;
const BAND_GAIN = 2.2;
// Voice bands in Hz: fundamentals and chest, vowels and presence, sibilance.
const BANDS: ReadonlyArray<readonly [number, number]> = [
	[80, 300],
	[300, 2000],
	[2000, 6000]
];
const SOFT_ATTACK = 0.35;
const SOFT_RELEASE = 0.9;
const TAU = Math.PI * 2;

/** Maps a gated loudness, 0 to 1, to the level shown, 0 to 1. */
export type LevelCurve = (level: number) => number;

const linear: LevelCurve = (level) => level;

/**
 * The curve a loudness is shown through. Each runs from 0 to 1 and `amount` sets how far it
 * bends away from the straight line; at 0 every one of them is the straight line.
 * - `soft` (amount 3): rises fast then rounds off, so a shout does not clip.
 * - `linear`: the loudness as it is. Anything past full scale clips.
 * - `log` (amount 9): lifts quiet sounds the most, as hearing does.
 * - `exp` (amount 3): keeps quiet sounds low and opens up on loud ones.
 */
export function levelCurve(type: 'soft' | 'linear' | 'log' | 'exp', amount?: number): LevelCurve {
	const a = Math.abs(amount ?? (type === 'log' ? 9 : 3));
	if (type === 'linear' || a < 1e-3) return linear;
	if (type === 'log') return (level) => Math.log1p(a * level) / Math.log1p(a);
	if (type === 'exp') return (level) => Math.expm1(a * level) / Math.expm1(a);
	return (level) => (1 - Math.exp(-a * level)) / (1 - Math.exp(-a));
}

/** Noise gate, then the curve: what is left above the gate, stretched back over 0 to 1. */
function shape(raw: number, threshold: number, curve: LevelCurve): number {
	if (raw <= threshold) return 0;
	const shown = curve(clamp01((raw - threshold) / Math.max(0.001, 1 - threshold)));
	return Number.isFinite(shown) ? clamp01(shown) : 0;
}

/** One-pole follower: `attack` seconds up, `release` seconds down. */
export function follow(
	previous: number,
	target: number,
	dt: number,
	attack: number,
	release: number
): number {
	const tau = target > previous ? attack : release;
	return previous + (target - previous) * (1 - Math.exp(-dt / Math.max(0.001, tau)));
}

export class VoiceFollower {
	/** Real seconds this indicator has run. */
	clock = 0;
	private time = 0;
	private drive = 0;
	private level = 0;
	private bands: [number, number, number] = [0, 0, 0];
	// Each band sits on a floor that drops at once and creeps up over about 8 seconds, so steady
	// room noise is taken out while a voice, which comes and goes, is not.
	private floor = [1, 1, 1];
	private heard = 0;
	private thinking = 0;
	private spin = 0;
	private pan = 0;
	private panVelocity = 0;
	private rawLevel = 0;
	private rawBands: [number, number, number] = [0, 0, 0];
	private timeBuffer: Float32Array<ArrayBuffer> | null = null;
	private frequencyBuffer: Uint8Array<ArrayBuffer> | null = null;
	private out: Voice = {
		level: 0,
		bands: [0, 0, 0],
		soft: 0,
		softBands: [0, 0, 0],
		heard: 0,
		time: 0,
		drive: 0,
		thinking: 0,
		spin: 0,
		pan: 0
	};

	/** Reads an analyser: RMS loudness and the three voice bands. */
	readAnalyser(analyser: AnalyserNode, sensitivity: number, dt: number): void {
		if (this.timeBuffer?.length !== analyser.fftSize) {
			this.timeBuffer = new Float32Array(analyser.fftSize);
		}
		if (this.frequencyBuffer?.length !== analyser.frequencyBinCount) {
			this.frequencyBuffer = new Uint8Array(analyser.frequencyBinCount);
		}
		const time = this.timeBuffer;
		const frequency = this.frequencyBuffer;
		analyser.getFloatTimeDomainData(time);
		let sum = 0;
		for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
		this.rawLevel = Math.sqrt(sum / time.length) * BASE_GAIN * sensitivity;

		analyser.getByteFrequencyData(frequency);
		const binHz = analyser.context.sampleRate / analyser.fftSize;
		for (let band = 0; band < 3; band++) {
			const from = Math.max(0, Math.floor(BANDS[band][0] / binHz));
			const to = Math.max(from, Math.min(frequency.length - 1, Math.ceil(BANDS[band][1] / binHz)));
			let total = 0;
			for (let i = from; i <= to; i++) total += frequency[i];
			const value = total / (to - from + 1) / 255;
			const floor = this.floor[band];
			this.floor[band] = value < floor ? value : floor + (value - floor) * (1 - Math.exp(-dt / 8));
			this.rawBands[band] =
				(Math.max(0, value - this.floor[band]) / Math.max(0.05, 1 - this.floor[band])) *
				BAND_GAIN *
				sensitivity;
		}
	}

	/**
	 * Reads a plain level. There is no spectrum behind it, so the bands get a little life of
	 * their own (slow, out-of-phase drifts scaled by the level) and a level-driven indicator
	 * still moves like a voice.
	 */
	readLevel(level: number, sensitivity: number): void {
		const raw = clamp01(Number.isFinite(level) ? level : 0) * sensitivity;
		const t = this.clock;
		this.rawLevel = raw;
		this.rawBands[0] = raw;
		this.rawBands[1] = raw * (0.72 + 0.28 * Math.sin(t * 2.3));
		this.rawBands[2] = raw * (0.6 + 0.4 * Math.sin(t * 3.7 + 2));
	}

	/** Nothing to read: every envelope settles. */
	readSilence(): void {
		this.rawLevel = 0;
		this.rawBands.fill(0);
	}

	/** Advances by `dt` real seconds. `still` (reduced motion, paused) holds the clocks. */
	step(dt: number, config: FollowerConfig, still: boolean): Voice {
		const { threshold, attack, release, rate } = config;
		// Thinking eases in over about a second and out a little slower.
		const p = (this.thinking = follow(this.thinking, config.thinking ? 1 : 0, dt, 0.35, 0.5));
		// How awake the indicator is: a voice or work brings the clocks up to speed; waiting, they
		// idle at `calm`. Read off the slow envelope, so the pace eases instead of stepping.
		const pace = config.calm + (1 - config.calm) * Math.min(1, Math.max(this.heard * 2.5, p));
		if (!still) {
			this.clock += dt;
			this.time += dt * rate * pace * (1 + 0.5 * p);
		}
		this.level = follow(
			this.level,
			shape(this.rawLevel, threshold, config.curve),
			dt,
			attack,
			release
		);
		this.heard = follow(this.heard, this.level, dt, SOFT_ATTACK, SOFT_RELEASE);
		for (let band = 0; band < 3; band++) {
			this.bands[band] = follow(
				this.bands[band],
				shape(this.rawBands[band], threshold * 0.6, config.curve),
				dt,
				attack,
				release * 1.15
			);
		}

		// Idle breathing folded under the voice; gone while thinking, which has its own motion.
		const breathe = still ? 0.5 : 0.5 + 0.5 * Math.sin((TAU * this.clock) / 6);
		const lift = config.idle * breathe * (1 - p);
		const out = this.out;
		out.level = this.level + (1 - this.level) * lift;
		out.soft = follow(out.soft, out.level, dt, SOFT_ATTACK, SOFT_RELEASE);
		for (let band = 0; band < 3; band++) {
			out.bands[band] = this.bands[band] + (1 - this.bands[band]) * lift * 0.6;
			out.softBands[band] = follow(
				out.softBands[band],
				out.bands[band],
				dt,
				SOFT_ATTACK,
				SOFT_RELEASE
			);
		}
		out.heard = this.heard;
		if (!still) {
			// On the slow envelope: the motion quickens over a phrase, not with each syllable.
			this.drive += dt * rate * (pace + config.driveGain * this.heard + 1.3 * p);
			// Thinking turns at SPIN scaled by the eased blend, so the spin winds up and runs down.
			// Out of thinking it coasts on, forward only, to the next whole turn: a spectrum comes
			// to rest where it started without winding back.
			const home = Math.ceil(this.spin / TAU - 1e-6) * TAU;
			const settle = Math.min(SETTLE_MAX, (home - this.spin) * 0.6);
			this.spin += dt * (SPIN * rate * p + settle * (1 - p));
		}
		out.time = this.time;
		out.drive = this.drive;
		out.thinking = p;
		out.spin = this.spin;
		// The indicator leans toward the voice only while it hears one, and drifts home slowly
		// after, so a pause mid-sentence does not snap it back to the centre.
		const raw = Math.max(-1, Math.min(1, config.direction || 0));
		const goal = this.heard > 0.06 && !config.thinking ? raw : 0;
		const w = Math.abs(goal) > Math.abs(this.pan) ? PAN_IN : PAN_OUT;
		this.panVelocity += (w * w * (goal - this.pan) - 2 * w * this.panVelocity) * dt;
		this.pan += this.panVelocity * dt;
		out.pan = this.pan;
		return out;
	}
}

/** A colour taking over a look, eased: how present it is and which colour it has reached. */
export type Wash = { color: Rgb; amount: number };

const WASH_IN = 0.7;
const WASH_OUT = 1.1;
const WASH_SHIFT = 0.6;

/** Eases a colour in, crossfades between colours and fades it out, so a colour never snaps. */
export class WashFollower {
	private wash: Wash = { color: [0, 0, 0], amount: 0 };

	/** Advances toward `target` (null: fade out). `still` jumps straight there. */
	step(dt: number, target: Rgb | null, still: boolean): Wash {
		const wash = this.wash;
		const ease = (tau: number) => (still ? 1 : 1 - Math.exp(-dt / tau));
		const goal = target ? 1 : 0;
		wash.amount += (goal - wash.amount) * ease(goal > wash.amount ? WASH_IN : WASH_OUT);
		if (target) {
			// From nothing the new colour simply appears; otherwise it crossfades.
			const k = wash.amount < 0.03 ? 1 : ease(WASH_SHIFT);
			for (let c = 0; c < 3; c++) wash.color[c] += (target[c] - wash.color[c]) * k;
		}
		return wash;
	}
}
