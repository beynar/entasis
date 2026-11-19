// The voice indicator's maths, without a canvas: the envelope a voice is shaped into, the ring's
// geometry and the cloud's tones.
import { describe, expect, test } from 'vitest';
import { cloudPalette } from './voiceIndicator.cloud.js';
import { colourfulness, smoothSpectrum, SPECTRUM, toHsl } from './voiceIndicator.color.js';
import {
	levelCurve,
	VoiceFollower,
	WashFollower,
	type FollowerConfig
} from './voiceIndicator.follower.js';
import { ringStops } from './voiceIndicator.paint.js';
import { leanFrame, ringLightFrame, ringSolidFrame } from './voiceIndicator.ring.js';

const config: FollowerConfig = {
	threshold: 0.04,
	curve: levelCurve('soft'),
	attack: 0.06,
	release: 0.32,
	idle: 0,
	calm: 0.4,
	driveGain: 2,
	rate: 1,
	thinking: false,
	direction: 0
};

/** Runs `follower` for `seconds` at a steady `level`. */
const run = (
	follower: VoiceFollower,
	level: number,
	seconds: number,
	over: Partial<FollowerConfig> = {}
) => {
	let voice = follower.step(0, { ...config, ...over }, false);
	for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
		follower.readLevel(level, 1);
		voice = follower.step(1 / 60, { ...config, ...over }, false);
	}
	return voice;
};

/** The mean distance of a frame's points from the centre of a box of `size`. */
const meanRadius = (frame: ReturnType<typeof ringLightFrame>, size: number) => {
	let total = 0;
	let count = 0;
	for (const stroke of frame.strokes) {
		for (let i = 0; i < stroke.points.length; i += 2) {
			total += Math.hypot(stroke.points[i] - size / 2, stroke.points[i + 1] - size / 2);
			count++;
		}
	}
	return total / count;
};

describe('the voice follower', () => {
	test('rises with a voice, settles in silence, and hears nothing below the gate', () => {
		const follower = new VoiceFollower();
		expect(run(follower, 0.8, 0.5).level).toBeGreaterThan(0.8);
		expect(run(follower, 0, 2).level).toBeLessThan(0.02);
		expect(run(new VoiceFollower(), 0.03, 0.5).level).toBe(0);
	});

	test('the voice clock runs faster while someone speaks', () => {
		const quiet = run(new VoiceFollower(), 0, 2).drive;
		const loud = run(new VoiceFollower(), 0.8, 2).drive;
		expect(loud).toBeGreaterThan(quiet * 2);
	});

	test('reduced motion holds the clocks but still shows the level', () => {
		const follower = new VoiceFollower();
		follower.readLevel(0.8, 1);
		follower.step(0.5, config, true);
		const voice = follower.step(0.5, config, true);
		expect(voice.time).toBe(0);
		expect(voice.drive).toBe(0);
		expect(voice.level).toBeGreaterThan(0.8);
	});

	test('thinking spins, then comes to rest on a whole turn', () => {
		const follower = new VoiceFollower();
		const spun = run(follower, 0, 2, { thinking: true }).spin;
		expect(spun).toBeGreaterThan(1);
		const rest = run(follower, 0, 40).spin;
		expect(rest).toBeGreaterThanOrEqual(spun);
		expect(Math.abs(rest / (Math.PI * 2) - Math.round(rest / (Math.PI * 2)))).toBeLessThan(0.01);
	});

	test('it leans toward a voice only while it hears one', () => {
		const follower = new VoiceFollower();
		expect(run(follower, 0, 2, { direction: 1 }).pan).toBeCloseTo(0, 3);
		expect(run(follower, 0.8, 3, { direction: 1 }).pan).toBeGreaterThan(0.8);
		expect(run(follower, 0, 6, { direction: 1 }).pan).toBeLessThan(0.1);
	});
});

describe('the response curve', () => {
	const types = ['soft', 'linear', 'log', 'exp'] as const;

	test('every curve runs from 0 to 1 and never comes back down', () => {
		for (const type of types) {
			const curve = levelCurve(type);
			expect(curve(0)).toBeCloseTo(0, 6);
			expect(curve(1)).toBeCloseTo(1, 6);
			for (let level = 0.05; level <= 1; level += 0.05) {
				expect(curve(level)).toBeGreaterThan(curve(level - 0.05));
			}
		}
	});

	test('log and soft lift a quiet sound, exp holds it down, linear leaves it', () => {
		expect(levelCurve('linear')(0.2)).toBe(0.2);
		expect(levelCurve('log')(0.2)).toBeGreaterThan(0.4);
		expect(levelCurve('soft')(0.2)).toBeGreaterThan(0.4);
		expect(levelCurve('exp')(0.2)).toBeLessThan(0.06);
	});

	test('the amount sets how far a curve bends; none is the straight line', () => {
		expect(levelCurve('log', 0)(0.3)).toBe(0.3);
		expect(levelCurve('exp', 0)(0.3)).toBe(0.3);
		expect(levelCurve('log', 40)(0.2)).toBeGreaterThan(levelCurve('log', 4)(0.2));
		expect(levelCurve('exp', 6)(0.5)).toBeLessThan(levelCurve('exp', 2)(0.5));
	});

	test('the follower shows a loudness through its curve', () => {
		const shown = (curve: FollowerConfig['curve']) =>
			run(new VoiceFollower(), 0.3, 1, { curve, threshold: 0 }).level;
		expect(shown(levelCurve('linear'))).toBeCloseTo(0.3, 2);
		expect(shown(levelCurve('log'))).toBeGreaterThan(0.5);
		expect(shown(levelCurve('exp'))).toBeLessThan(0.12);
		// A curve that leaves 0 to 1, or is not a number, is held inside it.
		expect(shown(() => 5)).toBeCloseTo(1, 2);
		expect(shown(() => Number.NaN)).toBe(0);
	});
});

describe('the wash of a colour', () => {
	test('eases in, crossfades to another colour and fades out', () => {
		const washer = new WashFollower();
		expect(washer.step(1 / 60, [255, 0, 0], false).amount).toBeLessThan(0.1);
		let wash = washer.step(1 / 60, [255, 0, 0], false);
		for (let i = 0; i < 300; i++) wash = washer.step(1 / 60, [255, 0, 0], false);
		expect(wash.amount).toBeGreaterThan(0.99);
		wash = washer.step(1 / 60, [0, 0, 255], false);
		// One frame into the change it is still nearly red.
		expect(wash.color[0]).toBeGreaterThan(200);
		for (let i = 0; i < 300; i++) wash = washer.step(1 / 60, null, false);
		expect(wash.amount).toBeLessThan(0.02);
	});

	test('jumps straight there when held still', () => {
		const wash = new WashFollower().step(0, [10, 200, 30], true);
		expect(wash.amount).toBe(1);
		expect(wash.color).toEqual([10, 200, 30]);
	});
});

describe('the ring', () => {
	const silent = run(new VoiceFollower(), 0, 1);

	test('a voice bends the ring in light without moving it or changing its size much', () => {
		const loud = run(new VoiceFollower(), 0.9, 2);
		const still = ringLightFrame(200, silent, {}, 0);
		const bent = ringLightFrame(200, loud, {}, 0);
		// With no response to the voice, the size is the rest size whatever the level.
		expect(meanRadius(bent, 200)).toBeCloseTo(meanRadius(still, 200), 0);
		const responsive = ringLightFrame(200, loud, {}, 1);
		expect(responsive.radius).toBeGreaterThan(still.radius);
		expect(responsive.light?.intensity).toBeGreaterThan(still.light!.intensity);
	});

	test('carries the rings and segments its tuning and size ask for', () => {
		expect(ringLightFrame(200, silent, {}, 1).strokes).toHaveLength(6);
		expect(ringLightFrame(200, silent, { rings: 3 }, 1).strokes).toHaveLength(3);
		expect(ringSolidFrame(200, silent, {}, 1).strokes).toHaveLength(3);
		const small = ringLightFrame(48, silent, {}, 1).strokes[0].points.length;
		const large = ringLightFrame(240, silent, {}, 1).strokes[0].points.length;
		expect(small).toBeLessThan(large);
	});

	test('solid loops carry a light and a depth for every point', () => {
		const [loop] = ringSolidFrame(200, silent, {}, 1).strokes;
		expect(loop.depth).toHaveLength(loop.light.length);
		expect(loop.points).toHaveLength(loop.light.length * 2);
		expect(Math.min(...loop.light)).toBeGreaterThanOrEqual(0);
		expect(Math.max(...loop.light)).toBeLessThanOrEqual(1);
	});

	test('leans toward the side the voice comes from', () => {
		const centred = meanX(ringLightFrame(200, silent, {}, 1));
		const right = meanX(leanFrame(ringLightFrame(200, silent, {}, 1), 1, 200));
		const left = meanX(leanFrame(ringLightFrame(200, silent, {}, 1), -1, 200));
		expect(right).toBeGreaterThan(centred + 20);
		expect(left).toBeLessThan(centred - 20);
	});
});

const meanX = (frame: ReturnType<typeof ringLightFrame>) => {
	const points = frame.strokes.flatMap((stroke) => stroke.points.filter((_, i) => i % 2 === 0));
	return points.reduce((sum, x) => sum + x, 0) / points.length;
};

describe('colours', () => {
	test('the smoothed spectrum closes on itself', () => {
		const stops = smoothSpectrum(SPECTRUM);
		const first = stops[0];
		const last = stops[stops.length - 1];
		expect(last[0]).toBe(1);
		for (let channel = 1; channel <= 3; channel++) {
			expect(Math.abs(first[channel] - last[channel])).toBeLessThan(3);
		}
	});

	test('a role takes the ring over in its own hue; a grey role leaves it grey', () => {
		const red = ringStops({ color: [220, 30, 30], amount: 1 }, true);
		for (const [, r, g, b] of red) {
			const hue = toHsl(r, g, b)[0];
			expect(Math.min(hue, 1 - hue)).toBeLessThan(0.09);
		}
		const grey = ringStops({ color: [120, 120, 120], amount: 1 }, true);
		for (const [, r, g, b] of grey) expect(colourfulness([r, g, b])).toBeLessThan(0.05);
	});

	test('the cloud keeps a role as its depths and pales toward its band', () => {
		const [deep, upper, lower, milk] = cloudPalette([60, 90, 230]);
		const lightness = (tone: [number, number, number]) => toHsl(...tone)[2];
		expect(lightness(deep)).toBeLessThan(lightness(upper));
		expect(lightness(upper)).toBeLessThan(lightness(lower));
		expect(lightness(lower)).toBeLessThan(lightness(milk));
		// A dark role is lifted to a mid tone: a cloud is lit from within.
		expect(lightness(cloudPalette([10, 10, 40])[0])).toBeGreaterThanOrEqual(0.5);
		expect(colourfulness(cloudPalette([128, 128, 128])[1])).toBe(0);
	});
});
