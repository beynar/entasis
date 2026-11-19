// Colour maths shared by the voice indicator's painters: sRGB triples (0 to 255) to and from HSL
// and OKLab, where a straight line between two colours looks like an even blend.

import type { Rgb } from '$lib/utils/cssColor.js';

export { luminance, readCssColor, type Rgb } from '$lib/utils/cssColor.js';

/** A colour stop around a ring: `[offset 0 to 1, r, g, b]`. */
export type Stop = [number, number, number, number];

export const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

export const smoothstep = (from: number, to: number, value: number) => {
	const t = clamp01((value - from) / (to - from));
	return t * t * (3 - 2 * t);
};

export const css = (r: number, g: number, b: number) =>
	`rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

export function toHsl(r: number, g: number, b: number): Rgb {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h =
		max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [h / 6, s, l];
}

export function fromHsl(h: number, s: number, l: number): Rgb {
	const k = (n: number) => (n + h * 12) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
	return [f(0) * 255, f(8) * 255, f(4) * 255];
}

const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) =>
	255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);

export function toLab(r: number, g: number, b: number): Rgb {
	const [R, G, B] = [linear(r), linear(g), linear(b)];
	const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
	const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
	const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

export function fromLab(L: number, A: number, B: number): Rgb {
	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
	const c = (v: number) => Math.max(0, Math.min(255, gamma(v)));
	return [
		c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
	];
}

/** An even blend of two colours, `k` of the way from `from` to `to`. */
export function blend(from: Rgb, to: Rgb, k: number): Rgb {
	const a = toLab(from[0], from[1], from[2]);
	const z = toLab(to[0], to[1], to[2]);
	return fromLab(a[0] + (z[0] - a[0]) * k, a[1] + (z[1] - a[1]) * k, a[2] + (z[2] - a[2]) * k);
}

/**
 * How much of its hue a colour carries, 0 for a grey to 1 for a plain colour. A role such as
 * `neutral` resolves to a grey: painted with its hue it would turn red, so painters fade the
 * hue out by this share.
 */
export const colourfulness = ([r, g, b]: Rgb) => clamp01(toHsl(r, g, b)[1] * 2.5);

/** The spectrum the indicator shows without a colour role, read clockwise from the top. */
export const SPECTRUM: Stop[] = [
	[0, 255, 150, 90],
	[0.12, 255, 110, 120],
	[0.24, 255, 80, 170],
	[0.4, 190, 80, 255],
	[0.58, 90, 92, 255],
	[0.74, 60, 132, 255],
	// Violet warms through magenta into the gold at the top, so the gold fades in.
	[0.84, 170, 90, 255],
	[0.93, 240, 104, 165],
	[1, 255, 150, 90]
];

/**
 * A ring's colours resampled along a smooth curve through its stops, in OKLab. Joined in straight
 * lines the colours turn sharply at a stop, and an additive bloom makes that corner a visible edge.
 */
export function smoothSpectrum(stops: Stop[], samples = 36): Stop[] {
	// The ring closes on itself: the stop at 1 is the one at 0 again.
	const ring = stops.filter(([offset]) => offset < 1);
	const count = ring.length;
	if (count < 3) return stops;
	const lab = ring.map(([, r, g, b]) => toLab(r, g, b));
	const at = (i: number) => ((i % count) + count) % count;
	const position = (i: number) => ring[at(i)][0] + Math.floor(i / count);
	const slope = (i: number) => {
		const d = position(i + 1) - position(i - 1);
		return lab[at(i + 1)].map((v, c) => (v - lab[at(i - 1)][c]) / d);
	};
	const out: Stop[] = [];
	for (let k = 0; k <= samples; k++) {
		const u = k / samples;
		let i = -1;
		while (i < count - 1 && position(i + 1) <= u) i++;
		const h = position(i + 1) - position(i);
		const t = (u - position(i)) / h;
		const t2 = t * t;
		const t3 = t2 * t;
		const a = lab[at(i)];
		const b = lab[at(i + 1)];
		const ma = slope(i);
		const mb = slope(i + 1);
		const v = [0, 1, 2].map(
			(c) =>
				(2 * t3 - 3 * t2 + 1) * a[c] +
				(t3 - 2 * t2 + t) * h * ma[c] +
				(-2 * t3 + 3 * t2) * b[c] +
				(t3 - t2) * h * mb[c]
		);
		out.push([u, ...fromLab(v[0], v[1], v[2])]);
	}
	return out;
}

/** The colour of a smoothed ring of stops at `turn` (any number; 1 is a whole turn). */
export function sampleStops(stops: Stop[], turn: number): Rgb {
	const u = turn - Math.floor(turn);
	for (let i = 1; i < stops.length; i++) {
		if (stops[i][0] >= u) {
			const [o0, r0, g0, b0] = stops[i - 1];
			const [o1, r1, g1, b1] = stops[i];
			const k = o1 > o0 ? (u - o0) / (o1 - o0) : 0;
			return [r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k];
		}
	}
	const last = stops[stops.length - 1];
	return [last[1], last[2], last[3]];
}
