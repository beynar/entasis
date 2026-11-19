// The orb's geometry and presets, with no canvas: every state yields a finished frame at every
// size, and the sizes, multipliers and tuning change what they say they change.
import { describe, expect, test } from 'vitest';
import type { ThinkingOrbFrame } from './thinkingOrb.core.js';
import { THINKING_ORB_FRAMES } from './thinkingOrb.modes.js';
import {
	resolveThinkingOrb,
	resolveThinkingOrbPreset,
	THINKING_ORB_MODES
} from './thinkingOrb.presets.js';
import type { ThinkingOrbState } from './thinkingOrb.props.js';

const states = Object.keys(THINKING_ORB_MODES) as ThinkingOrbState[];

const frameOf = (
	state: ThinkingOrbState,
	size: number,
	time: number,
	adjust?: Parameters<typeof resolveThinkingOrb>[2]
): ThinkingOrbFrame => {
	const { mode, options } = resolveThinkingOrb(state, size, adjust);
	return THINKING_ORB_FRAMES[mode](size, time, options);
};

describe('ThinkingOrb frames', () => {
	test.each(states)('%s draws a finished frame inside its square at every size', (state) => {
		for (const size of [20, 32, 64, 160]) {
			for (const time of [0, 0.6, 3.7, 41.2, 900.5]) {
				const { dots, lines } = frameOf(state, size, time);
				expect(dots.length).toBeGreaterThan(5);
				for (let i = 0; i < dots.length; i++) {
					const dot = dots[i];
					for (const value of [dot.x, dot.y, dot.z, dot.r, dot.white]) {
						expect(Number.isFinite(value)).toBe(true);
					}
					expect(dot.r).toBeGreaterThan(0);
					expect(dot.x + dot.r).toBeGreaterThan(0);
					expect(dot.x - dot.r).toBeLessThan(size);
					expect(dot.y + dot.r).toBeGreaterThan(0);
					expect(dot.y - dot.r).toBeLessThan(size);
					// Far to near: the order the dots are painted in.
					if (i > 0) expect(dot.z).toBeGreaterThanOrEqual(dots[i - 1].z);
				}
				for (const line of lines) {
					for (const value of [line.x1, line.y1, line.x2, line.y2, line.w]) {
						expect(Number.isFinite(value)).toBe(true);
					}
				}
			}
		}
	});

	test('a frame depends on its time alone, and moves with it', () => {
		for (const state of states) {
			expect(frameOf(state, 64, 12.5)).toEqual(frameOf(state, 64, 12.5));
			expect(frameOf(state, 64, 12.5)).not.toEqual(frameOf(state, 64, 13.1));
		}
	});

	test('only the constellation draws lines', () => {
		for (const state of states) {
			const { lines } = frameOf(state, 64, 5);
			if (state === 'connecting') expect(lines.length).toBeGreaterThan(0);
			else expect(lines).toHaveLength(0);
		}
	});
});

describe('ThinkingOrb presets', () => {
	test('a small orb draws fewer, bolder dots and keeps its own pace', () => {
		for (const state of states) {
			const small = frameOf(state, 20, 2);
			const large = frameOf(state, 64, 2);
			expect(small.dots.length).toBeLessThan(large.dots.length);
		}
		expect(resolveThinkingOrbPreset('working', 64).speed).toBe(1.885);
		expect(resolveThinkingOrbPreset('working', 20).speed).toBe(3.9);
		expect(resolveThinkingOrbPreset('searching', 20).options.rBase).toBeCloseTo(0.6 * 1.75);
		expect(resolveThinkingOrbPreset('searching', 64).options.rBase).toBeCloseTo(0.6 * 1.15);
	});

	test('a size between the two tunings is read between them, on their ratios', () => {
		// The values thinking-orbs ships for 32px.
		expect(resolveThinkingOrbPreset('working', 32).speed).toBeCloseTo(2.9072, 3);
		expect(resolveThinkingOrbPreset('connecting', 32).speed).toBeCloseTo(5.0104, 3);
		expect(resolveThinkingOrbPreset('searching', 32).options.scanMul).toBeCloseTo(4.2301, 3);
		expect(resolveThinkingOrbPreset('breathing', 32).options.wobMul).toBeCloseTo(0.4751, 3);
		// A band that does not spin at either size does not spin between them.
		expect(resolveThinkingOrbPreset('composing', 32).options.spin).toBe(0);

		const speeds = [20, 26, 32, 44, 64].map(
			(size) => resolveThinkingOrbPreset('working', size).speed
		);
		expect([...speeds].sort((a, b) => b - a)).toEqual(speeds);
	});

	test('past either tuning the nearest one is kept', () => {
		expect(resolveThinkingOrbPreset('solving', 200)).toEqual(
			resolveThinkingOrbPreset('solving', 64)
		);
		expect(resolveThinkingOrbPreset('solving', 12)).toEqual(
			resolveThinkingOrbPreset('solving', 20)
		);
	});

	test('`dots` changes how many dots are drawn and `dotSize` how large they are', () => {
		const base = frameOf('searching', 64, 1);
		expect(frameOf('searching', 64, 1, { dots: 2 }).dots.length).toBeGreaterThan(
			base.dots.length * 1.6
		);
		expect(frameOf('searching', 64, 1, { dots: 0.5 }).dots.length).toBeLessThan(
			base.dots.length * 0.65
		);

		const bold = frameOf('searching', 64, 1, { dotSize: 1.5 });
		expect(bold.dots).toHaveLength(base.dots.length);
		const mean = (frame: ThinkingOrbFrame) =>
			frame.dots.reduce((sum, dot) => sum + dot.r, 0) / frame.dots.length;
		expect(mean(bold) / mean(base)).toBeGreaterThan(1.3);
	});

	test('the multipliers never write to the shared preset', () => {
		const before = structuredClone(resolveThinkingOrbPreset('weaving', 64));
		resolveThinkingOrb('weaving', 64, { dots: 2, dotSize: 2, tuning: { turns: 6 } });
		expect(resolveThinkingOrbPreset('weaving', 64)).toEqual(before);
	});

	test('tuning reaches the drawing it names', () => {
		expect(resolveThinkingOrb('weaving', 64, { tuning: { turns: 5 } }).options.turns).toBe(5);
		expect(resolveThinkingOrb('searching', 64, { tuning: { dim: 0.2 } }).options.dimBase).toBe(0.2);
		expect(frameOf('connecting', 64, 4, { tuning: { reach: 1.2 } }).lines.length).toBeGreaterThan(
			frameOf('connecting', 64, 4).lines.length
		);

		// A held shape stays the same outline across the whole cycle: four corners, on a square.
		const corners = (time: number) => {
			const { dots } = frameOf('shaping', 64, time, { tuning: { shape: 'square' } });
			const xs = dots.map((dot) => dot.x);
			const ys = dots.map((dot) => dot.y);
			const onEdge = dots.filter(
				(dot) =>
					Math.abs(dot.x - Math.min(...xs)) < 0.8 ||
					Math.abs(dot.x - Math.max(...xs)) < 0.8 ||
					Math.abs(dot.y - Math.min(...ys)) < 0.8 ||
					Math.abs(dot.y - Math.max(...ys)) < 0.8
			);
			return onEdge.length / dots.length;
		};
		for (const time of [0, 1.8, 2.6, 4.4, 6.2]) expect(corners(time)).toBe(1);
	});
});
