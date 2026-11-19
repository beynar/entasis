/**
 * @license
 * Adapted from thinking-orbs by Jakub Antalik (https://github.com/Jakubantalik/Libraries.dev,
 * packages/thinking-orbs). The original demo credits Jakub Antalik and Alex Brinza.
 *
 * MIT License
 *
 * Copyright (c) 2026 Jakub Antalik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { Rgb } from '$lib/utils/cssColor.js';

// Primitives shared by the orb's nine drawings. Each one is a real 3D figure made of dots:
// rotated, sorted by depth, and shaded by dot size and ink weight alone. Only filled circles and
// stroked lines are drawn, so every browser shows the same picture.

/** One dot of a frame, in CSS pixels inside a square of the orb's size. */
export type ThinkingOrbDot = {
	x: number;
	y: number;
	/** Depth: dots are drawn from the smallest `z` (far) to the largest (near). */
	z: number;
	/** Radius. */
	r: number;
	/** Ink weight: 0 is full ink, 1 is no ink (the dot fades into the surface). */
	white: number;
	/** Opacity, 0 to 1. Default 1. */
	a?: number;
};

/** One stroked line of a frame, drawn under the dots. */
export type ThinkingOrbLine = {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	/** Ink weight, as for a dot. */
	white: number;
	/** Opacity, 0 to 1. Default 1. */
	a?: number;
	/** Width in CSS pixels. */
	w: number;
};

/** One instant of an orb: everything to draw. */
export type ThinkingOrbFrame = {
	dots: ThinkingOrbDot[];
	lines: ThinkingOrbLine[];
};

/** The numbers a drawing is tuned by, after the size and the multipliers are applied. */
export type ThinkingOrbOptions = Record<string, number | undefined>;

/**
 * A drawing: the frame to paint at `time` (seconds, already multiplied by the speed) inside a
 * square of `size` CSS pixels.
 */
export type ThinkingOrbFrameFunction = (
	size: number,
	time: number,
	options: ThinkingOrbOptions
) => ThinkingOrbFrame;

type Projector = (x: number, y: number, z: number) => [number, number, number];

export const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export const frac = (x: number) => x - Math.floor(x);

/** Deterministic hash in [0, 1). */
export function hashD(a: number, b: number): number {
	const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
	return h - Math.floor(h);
}

/** Value noise on a 2D lattice: smooth, deterministic, cheap. */
export function vnoise(x: number, y: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	let fx = x - xi;
	let fy = y - yi;
	fx = fx * fx * (3 - 2 * fx);
	fy = fy * fy * (3 - 2 * fy);
	const a = hashD(xi, yi);
	const b = hashD(xi + 1, yi);
	const c = hashD(xi, yi + 1);
	const d = hashD(xi + 1, yi + 1);
	return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Stable directions on a unit sphere (Fibonacci lattice). */
export function fibDir(i: number, n: number): [number, number, number] {
	const golden = Math.PI * (3 - Math.sqrt(5));
	const y = 1 - (2 * (i + 0.5)) / n;
	const rad = Math.sqrt(1 - y * y);
	const a = i * golden;
	return [rad * Math.cos(a), y, rad * Math.sin(a)];
}

/** Shortest signed angular distance, wrapped to (-π, π]. */
export const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Spin, tilt and orthographic projection, shared by the drawings. */
export function makeProj(
	yaw: number,
	tilt: number,
	cx: number,
	cy: number,
	scale: number
): Projector {
	const st = Math.sin(tilt);
	const ct = Math.cos(tilt);
	const sy = Math.sin(yaw);
	const cyw = Math.cos(yaw);
	return (x, y, z) => {
		const x1 = x * cyw + z * sy;
		const z1 = -x * sy + z * cyw;
		const y1 = y * ct - z1 * st;
		const z2 = y * st + z1 * ct;
		return [cx + x1 * scale, cy - y1 * scale, z2];
	};
}

/**
 * Dot radii were tuned for a 300px frame; scaling them less than the size keeps a small orb
 * legible. A lower `pow` shrinks radii less.
 */
export const radiusScale = (size: number, pow: number) => (size / 300) ** pow;

/**
 * Turns what a drawing computed into a finished frame: drops what cannot be seen, holds radii
 * above the drawing's floor, and sorts the dots from far to near, the order they are drawn in.
 */
export function finalizeFrame(
	dots: ThinkingOrbDot[],
	lines: ThinkingOrbLine[],
	rMin = 0.3
): ThinkingOrbFrame {
	const visible: ThinkingOrbDot[] = [];
	for (const d of dots) {
		if ((d.a ?? 1) < 0.02) continue;
		d.r = Math.max(rMin, d.r);
		visible.push(d);
	}
	visible.sort((a, b) => a.z - b.z);
	return { dots: visible, lines: lines.filter((l) => (l.a ?? 1) >= 0.02) };
}

/**
 * One ink weight as a CSS colour. The weight is a ramp on the ink itself: on a dark surface the
 * ink fades toward black with depth, on a light one toward white, so depth reads the same way in
 * any colour.
 */
function inkColor(w: number, alpha: number, dark: boolean, ink: Rgb): string {
	const ramp = (c: number) => Math.round(dark ? c * (1 - w) : c + (255 - c) * w);
	return `rgba(${ramp(ink[0])},${ramp(ink[1])},${ramp(ink[2])},${alpha})`;
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * Paints a finished frame in `ink`: lines first, so dots sit on their edges. `opacity` fades the
 * whole frame, which is how one drawing crosses into the next.
 */
export function paintFrame(
	ctx: CanvasRenderingContext2D,
	frame: ThinkingOrbFrame,
	dark: boolean,
	ink: Rgb,
	opacity = 1
): void {
	for (const l of frame.lines) {
		ctx.strokeStyle = inkColor(clamp01(l.white), clamp01((l.a ?? 1) * opacity), dark, ink);
		ctx.lineWidth = l.w;
		ctx.beginPath();
		ctx.moveTo(l.x1, l.y1);
		ctx.lineTo(l.x2, l.y2);
		ctx.stroke();
	}
	for (const d of frame.dots) {
		ctx.fillStyle = inkColor(clamp01(d.white), clamp01((d.a ?? 1) * opacity), dark, ink);
		ctx.beginPath();
		ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
		ctx.fill();
	}
}
