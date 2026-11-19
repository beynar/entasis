// The 2D painters of the voice indicator: a ring drawn as coloured light, a ring drawn as lit
// solid tubes, and the solid orb. Plain canvas strokes and fills, so every engine draws the same.
//
// @license Portions adapted from Voice Ring (libraries.dev/voice-ring).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT

import {
	blend,
	clamp01,
	colourfulness,
	css,
	fromHsl,
	sampleStops,
	smoothSpectrum,
	SPECTRUM,
	toHsl,
	type Rgb,
	type Stop
} from './voiceIndicator.color.js';
import type { Wash } from './voiceIndicator.follower.js';
import type { RingFrame } from './voiceIndicator.ring.js';

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const TAU = Math.PI * 2;
// How far a colour role's own hue swings round the ring, in turns: enough that the light still
// shimmers, little enough that the role reads as itself.
const SWING = 0.05;
// The chromatic fringes either side of each ring: a cool teal just outside, a deep blue just
// inside, the split a lens gives bright light.
const FRINGE_OUT: Rgb = [120, 232, 214];
const FRINGE_IN: Rgb = [64, 72, 255];

/**
 * The colours round the indicator: the spectrum, taken over by `wash` as far as it has come in.
 * A role recolours the spectrum as a gradient of its own hue's neighbours, each stop keeping its
 * lightness, so the light stays as vivid as it was. It comes as an even blend from each stop's own
 * colour, not a turn of the hue, which would tear the ring where neighbours turn opposite ways.
 */
export function ringStops(wash: Wash | null, dark: boolean): Stop[] {
	const active = wash && wash.amount > 0.005 ? wash : null;
	const [hue] = active ? toHsl(...active.color) : [0];
	const vivid = active ? colourfulness(active.color) : 0;
	const stops = SPECTRUM.map(([offset, r, g, b]): Stop => {
		if (active) {
			const [, saturation, lightness] = toHsl(r, g, b);
			const target = fromHsl(
				(hue + SWING * Math.sin(TAU * offset) + 1) % 1,
				saturation * vivid,
				lightness
			);
			[r, g, b] = blend([r, g, b], target, active.amount);
		}
		// On a light surface, light reads as deeper, saturated ink.
		const shade = dark ? 1 : 0.82;
		return [offset, r * shade, g * shade, b * shade];
	});
	return smoothSpectrum(stops);
}

// The halo and bloom are stacks of wide, faint, hard-edged strokes. Each edge is a small step in
// the light, so they are drawn on a layer of their own and laid down through a blur: the steps
// melt into a smooth falloff. Where the canvas has no blur filter, the layer is halved, halved
// again and doubled back up, each step a smooth bilinear pass.
const HAS_FILTER =
	typeof CanvasRenderingContext2D === 'function' && 'filter' in CanvasRenderingContext2D.prototype;

type GlowLayer = { full: Context; half?: Context; quarter?: Context };

const layers = new WeakMap<CanvasRenderingContext2D, GlowLayer>();

function surface(width: number, height: number): Context {
	const canvas =
		typeof OffscreenCanvas === 'function'
			? new OffscreenCanvas(width, height)
			: Object.assign(document.createElement('canvas'), { width, height });
	return canvas.getContext('2d') as Context;
}

/** The glow layer for `context`: its size, cleared, drawn in its coordinates. */
function glowLayer(context: CanvasRenderingContext2D): GlowLayer {
	const { width, height } = context.canvas;
	let layer = layers.get(context);
	if (!layer || layer.full.canvas.width !== width || layer.full.canvas.height !== height) {
		layer = { full: surface(width, height) };
		if (!HAS_FILTER) {
			layer.half = surface(Math.ceil(width / 2), Math.ceil(height / 2));
			layer.quarter = surface(Math.ceil(width / 4), Math.ceil(height / 4));
		}
		layers.set(context, layer);
	}
	layer.full.setTransform(1, 0, 0, 1, 0, 0);
	layer.full.clearRect(0, 0, width, height);
	layer.full.setTransform(context.getTransform());
	return layer;
}

function resample(to: Context, from: Context): void {
	to.globalCompositeOperation = 'copy';
	to.imageSmoothingEnabled = true;
	to.imageSmoothingQuality = 'high';
	to.drawImage(from.canvas, 0, 0, to.canvas.width, to.canvas.height);
}

/** Lays the glow layer over `context`, blurred by `soft` CSS pixels. */
function laySoftened(
	context: CanvasRenderingContext2D,
	layer: GlowLayer,
	operation: GlobalCompositeOperation,
	soft: number
): void {
	const matrix = context.getTransform();
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.globalCompositeOperation = operation;
	context.globalAlpha = 1;
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	if (HAS_FILTER) {
		context.filter = `blur(${soft * Math.hypot(matrix.a, matrix.b)}px)`;
		context.drawImage(layer.full.canvas, 0, 0);
	} else if (layer.half && layer.quarter) {
		resample(layer.half, layer.full);
		resample(layer.quarter, layer.half);
		resample(layer.half, layer.quarter);
		context.drawImage(
			layer.half.canvas,
			0,
			0,
			layer.half.canvas.width * 2,
			layer.half.canvas.height * 2
		);
	}
	context.restore();
}

function conic(context: Context, angle: number, x: number, y: number, stops: Stop[]) {
	const gradient = context.createConicGradient(angle, x, y);
	for (const [offset, r, g, b] of stops) gradient.addColorStop(clamp01(offset), css(r, g, b));
	return gradient;
}

/**
 * Paints `frame`'s rings as light. One conic gradient carries the colours round the ring, so every
 * pass (halo, bloom, core) is a handful of strokes however many points the rings have. On a dark
 * surface the passes add up, so overlaps run hot toward white, like light does.
 */
export function paintRingLight(
	context: CanvasRenderingContext2D,
	frame: RingFrame,
	stops: Stop[],
	dark: boolean
): void {
	const light = frame.light;
	if (!light) return;
	const [cx, cy] = frame.centre;
	// One path per ring, lit at its mean depth: light per segment would seam where the wide,
	// additive bloom strokes overlap.
	const rings = frame.strokes.map((stroke) => {
		const path = new Path2D();
		const count = stroke.points.length >> 1;
		let total = 0;
		for (let i = 0; i < count; i++) {
			if (i === 0) path.moveTo(stroke.points[0], stroke.points[1]);
			else path.lineTo(stroke.points[2 * i], stroke.points[2 * i + 1]);
			total += stroke.light[i];
		}
		path.closePath();
		return { path, light: count ? total / count : 1, width: stroke.width };
	});
	const count = Math.max(1, rings.length);
	const intensity = light.intensity;
	const operation: GlobalCompositeOperation = dark ? 'lighter' : 'source-over';
	const pass = (
		width: (own: number) => number,
		alpha: (own: number) => number,
		target: Context = context
	) => {
		for (const ring of rings) {
			target.lineWidth = width(ring.width);
			target.globalAlpha = clamp01(alpha(ring.light));
			target.stroke(ring.path);
		}
	};
	const begin = (target: Context) => {
		target.lineCap = 'round';
		target.lineJoin = 'round';
		target.globalCompositeOperation = operation;
		target.strokeStyle = conic(target, light.angle, cx, cy, stops);
	};

	const layer = glowLayer(context);
	begin(layer.full);
	// The halo: very wide, very faint, shared out between the rings so the total stays the same
	// however many there are.
	const halo = (light.halo * intensity * (dark ? 1 : 0.2)) / count;
	for (const [width, alpha] of [
		[0.7, 0.045],
		[0.42, 0.075],
		[0.24, 0.11],
		[0.12, 0.16]
	]) {
		pass(
			() => frame.radius * width,
			() => alpha * halo,
			layer.full
		);
	}
	// The bloom: three soft passes hugging each ring. Across a bundle of rings they sum into one
	// luminous band, the glassy ribbon.
	const bloom = intensity * (dark ? 1 : 0.6) * 0.55;
	for (const [width, alpha] of [
		[16, 0.05],
		[8, 0.11],
		[4, 0.2]
	]) {
		pass(
			(own) => own * width * 1.4,
			(own) => alpha * bloom * own,
			layer.full
		);
	}
	laySoftened(context, layer, operation, 3.7);

	context.save();
	begin(context);
	const spectrum = context.strokeStyle;

	// Chromatic fringes, scaled about the centre (dark surfaces only).
	if (dark && light.fringe > 0) {
		for (const [scale, color, alpha] of [
			[1 + light.fringe, FRINGE_OUT, 0.16],
			[1 - light.fringe, FRINGE_IN, 0.22]
		] as const) {
			context.save();
			context.translate(cx, cy);
			context.scale(scale, scale);
			context.translate(-cx, -cy);
			context.strokeStyle = css(...color);
			pass(
				(own) => (own * 1.4) / scale,
				(own) => alpha * intensity * own
			);
			context.restore();
		}
		context.strokeStyle = spectrum;
	}

	// The crisp core of every ring.
	pass(
		(own) => own,
		(own) => 0.7 * own * (0.75 + 0.25 * intensity)
	);

	// The specular hot spot: white pooled where the light sits.
	if (dark) {
		const { x, y, radius, alpha } = light.highlight;
		const spot = context.createRadialGradient(x, y, 0, x, y, radius);
		spot.addColorStop(0, 'rgba(255,255,255,1)');
		spot.addColorStop(0.35, 'rgba(255,255,255,0.45)');
		spot.addColorStop(1, 'rgba(255,255,255,0)');
		context.strokeStyle = spot;
		pass(
			(own) => own * 2.2,
			(own) => alpha * own
		);
	}
	context.restore();
}

// Segments per run of a solid loop: short enough that a crossing sorts cleanly, long enough that
// a loop is a few dozen strokes.
const RUN = 6;

/**
 * The colour of a solid surface for a light value. Grey without a tone; with one, the tone takes
 * the surface over by `share`, lit like the grey was: deep in the shadows, vivid in the light,
 * toward white only at the very brightest.
 */
function solidColor(light: number, dark: boolean, tone: Rgb, share: number): string {
	// On dark, lit parts read pale; on a light surface, as darker ink.
	const grey = dark ? 255 * (0.16 + 0.84 * light) : 255 * (0.1 + 0.6 * (1 - light));
	const lit = (channel: number) =>
		dark
			? Math.min(255, channel * (0.3 + 0.9 * light) + 90 * light ** 4)
			: Math.min(255, channel * (0.45 + 0.55 * (1 - light)));
	let r = grey + (lit(tone[0]) - grey) * share;
	let g = grey + (lit(tone[1]) - grey) * share;
	let b = grey + (lit(tone[2]) - grey) * share;
	// A touch past the colour itself, so a lit tube reads as coloured rather than washed out.
	const mean = (r + g + b) / 3;
	const saturation = 1 + 0.35 * share;
	r = mean + (r - mean) * saturation;
	g = mean + (g - mean) * saturation;
	b = mean + (b - mean) * saturation;
	return css(
		Math.max(0, Math.min(255, r)),
		Math.max(0, Math.min(255, g)),
		Math.max(0, Math.min(255, b))
	);
}

/**
 * The tone of a solid surface at `turn` round the indicator: the spectrum there, taken over by
 * the wash, and how much of the surface the tone colours (a grey role leaves it grey).
 */
function toneAt(stops: Stop[], wash: Wash | null, turn: number): [Rgb, number] {
	const spectrum = sampleStops(stops, turn);
	if (!wash || wash.amount <= 0.005) return [spectrum, 1];
	const k = wash.amount;
	return [
		[
			spectrum[0] + (wash.color[0] - spectrum[0]) * k,
			spectrum[1] + (wash.color[1] - spectrum[1]) * k,
			spectrum[2] + (wash.color[2] - spectrum[2]) * k
		],
		1 + (colourfulness(wash.color) - 1) * k
	];
}

/**
 * Paints `frame`'s loops as lit, solid tubes. Each loop is cut into short runs drawn far to near,
 * so where it passes in front of itself the near side covers the far one, a clear gap cut round
 * it. Each run is one gradient from its first point's light to its last's, with a thin highlight
 * laid along it toward the light, and starts a segment back into the run before it, so the runs
 * meet with no seam.
 */
export function paintRingSolid(
	context: CanvasRenderingContext2D,
	frame: RingFrame,
	spectrum: Stop[],
	wash: Wash | null,
	dark: boolean,
	turn: number
): void {
	const [cx, cy] = frame.centre;
	const runs: Array<{ stroke: RingFrame['strokes'][number]; from: number; to: number; z: number }> =
		[];
	for (const stroke of frame.strokes) {
		const count = stroke.points.length >> 1;
		for (let start = 0; start < count; start += RUN) {
			const end = Math.min(count, start + RUN);
			let z = 0;
			for (let i = start; i <= end; i++) z += stroke.depth?.[i % count] ?? 0;
			runs.push({ stroke, from: start - 1, to: end, z: z / (end - start + 1) });
		}
	}
	runs.sort((a, b) => a.z - b.z);

	const colorAt = (stroke: RingFrame['strokes'][number], i: number) => {
		const x = stroke.points[2 * i];
		const y = stroke.points[2 * i + 1];
		const [tone, share] = toneAt(spectrum, wash, Math.atan2(y - cy, x - cx) / TAU + turn);
		return solidColor(stroke.light[i], dark, tone, share);
	};

	context.save();
	context.lineCap = 'butt';
	context.lineJoin = 'round';
	for (const { stroke, from, to, z } of runs) {
		const count = stroke.points.length >> 1;
		const at = (i: number) => ((i % count) + count) % count;
		const path = new Path2D();
		for (let i = from; i <= to; i++) {
			const k = at(i);
			if (i === from) path.moveTo(stroke.points[2 * k], stroke.points[2 * k + 1]);
			else path.lineTo(stroke.points[2 * k], stroke.points[2 * k + 1]);
		}
		const first = at(from);
		const last = at(to);
		// Nearer runs a touch thicker.
		const width = stroke.width * (1 + 0.08 * z);

		// The gap: whatever the run passes in front of is cut back round it. Cut rather than
		// shaded, so overlapping runs never darken twice.
		context.globalCompositeOperation = 'destination-out';
		context.strokeStyle = '#000';
		context.lineWidth = width * 1.35;
		context.stroke(path);
		context.globalCompositeOperation = 'source-over';

		const x0 = stroke.points[2 * first];
		const y0 = stroke.points[2 * first + 1];
		const x1 = stroke.points[2 * last];
		const y1 = stroke.points[2 * last + 1];
		if (Math.hypot(x1 - x0, y1 - y0) > 0.5) {
			const body = context.createLinearGradient(x0, y0, x1, y1);
			body.addColorStop(0, colorAt(stroke, first));
			body.addColorStop(1, colorAt(stroke, last));
			context.strokeStyle = body;
		} else context.strokeStyle = colorAt(stroke, first);
		context.lineWidth = width;
		context.stroke(path);

		// The highlight, set toward the light (up and to the left), strongest where the run is
		// brightest.
		let lit = 0;
		for (let i = from; i <= to; i++) lit += stroke.light[at(i)];
		lit /= to - from + 1;
		const alpha = clamp01((dark ? 0.6 : 0.45) * lit * lit);
		if (alpha > 0.01) {
			context.save();
			context.translate(-0.17 * width, -0.19 * width);
			context.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
			context.lineWidth = width * 0.32;
			context.stroke(path);
			context.restore();
		}
	}
	context.restore();
}

/**
 * Three tones of the indicator's colours for the solid orb: the spectrum's cool end, its middle
 * and its warm end, taken over by the wash. Without a hue they are a pale grey on dark and a
 * deep one on a light surface.
 */
export function orbTones(spectrum: Stop[], wash: Wash | null, dark: boolean): [Rgb, Rgb, Rgb] {
	const grey = dark ? 214 : 96;
	const toneOf = (offset: number): Rgb => {
		const [tone, share] = toneAt(spectrum, wash, offset);
		return [
			grey + (tone[0] - grey) * share,
			grey + (tone[1] - grey) * share,
			grey + (tone[2] - grey) * share
		];
	};
	return [toneOf(0.62), toneOf(0.36), toneOf(0.08)];
}

/**
 * Paints the solid orb: a matt ball with a soft glow behind it that the voice brightens, and a
 * shade toward its rim for roundness. It carries no highlight: it is matter, not glass. `surface`
 * paints what is on the ball (its clouds) and returns false where it cannot; the ball is then
 * filled with a gradient of its tones, turning slowly.
 */
export function paintOrbSolid(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	tones: [Rgb, Rgb, Rgb],
	dark: boolean,
	turn: number,
	glow: number,
	surface?: () => boolean
): void {
	context.save();
	if (glow > 0.01) {
		// The glow is the ball's own colour, blurred wide behind it.
		context.save();
		context.globalAlpha = clamp01(glow) * (dark ? 0.55 : 0.35);
		context.shadowColor = css(...tones[1]);
		context.shadowBlur = radius * (0.35 + 0.5 * glow);
		context.fillStyle = css(...tones[1]);
		context.beginPath();
		context.arc(x, y, radius * 0.96, 0, TAU);
		context.fill();
		context.restore();
	}
	if (!surface?.()) {
		const angle = turn * TAU - 0.9;
		const dx = Math.cos(angle) * radius;
		const dy = Math.sin(angle) * radius;
		const fill = context.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
		fill.addColorStop(0, css(...tones[0]));
		fill.addColorStop(0.5, css(...tones[1]));
		fill.addColorStop(1, css(...tones[2]));
		context.fillStyle = fill;
		context.beginPath();
		context.arc(x, y, radius, 0, TAU);
		context.fill();
	}

	// The roundness: a shade that gathers toward the rim, away from the upper left.
	context.beginPath();
	context.arc(x, y, radius, 0, TAU);
	context.clip();
	const shade = context.createRadialGradient(
		x - radius * 0.3,
		y - radius * 0.34,
		radius * 0.55,
		x,
		y,
		radius * 1.05
	);
	shade.addColorStop(0, 'rgba(0,0,0,0)');
	shade.addColorStop(1, `rgba(0,0,0,${dark ? 0.2 : 0.16})`);
	context.fillStyle = shade;
	context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
	context.restore();
}
