// What each state draws at each size. A drawing has a base profile (how many dots, how large),
// and each state is tuned by hand at two sizes: 64px (an avatar) and 20px (a line of text). They
// are two designs and not one design scaled: each has its own dot count, dot size and pace.
// Any other size is read between the two.
//
// @license Adapted from thinking-orbs (github.com/Jakubantalik/Libraries.dev).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT. Full notice in
// `thinkingOrb.core.ts`.

import type { ThinkingOrbOptions } from './thinkingOrb.core.js';
import type { ThinkingOrbMode } from './thinkingOrb.modes.js';
import type { ThinkingOrbState, ThinkingOrbTuning } from './thinkingOrb.props.js';

export const THINKING_ORB_MODES: Record<ThinkingOrbState, ThinkingOrbMode> = {
	working: 'orbits',
	searching: 'globe',
	solving: 'rubik',
	listening: 'wave',
	connecting: 'web',
	weaving: 'braid',
	composing: 'ribbon',
	breathing: 'ring',
	shaping: 'morph'
};

// Grids (rings by dots per ring) come in pairs: each side takes the root of the scale, so the
// total count follows the scale. Plain counts scale as they are.
const COUNT_PAIRS: ReadonlyArray<readonly [string, string]> = [
	['latRings', 'lonDensity'],
	['rings', 'lonDensity'],
	['lanes', 'segs']
];
const COUNT_KEYS = ['orbitN', 'ghostN', 'nodeN', 'strandN', 'signals'] as const;
// The sampling density of the morph's outline.
const ICON_DENSITY_KEYS = ['iconD'] as const;

// Every key that sets a dot's radius: scaling them all keeps the falloff from near to far.
const RADIUS_KEYS = [
	'rBase',
	'rDepth',
	'rActive',
	'rDot',
	'ghostR',
	'partR',
	'partRDepth',
	'nodeR',
	'nodeRDepth'
] as const;

export function scaleCounts(options: ThinkingOrbOptions, scale: number): ThinkingOrbOptions {
	const out: ThinkingOrbOptions = { ...options };
	const done = new Set<string>();
	const root = Math.sqrt(scale);
	for (const [a, b] of COUNT_PAIRS) {
		const va = out[a];
		const vb = out[b];
		if (va != null && vb != null && !done.has(a) && !done.has(b)) {
			out[a] = Math.max(2, Math.round(va * root));
			out[b] = Math.max(2, Math.round(vb * root));
			done.add(a);
			done.add(b);
		}
	}
	for (const key of COUNT_KEYS) {
		const value = out[key];
		// 0 means the drawing has no such layer (the ring has no sphere behind it): scaling must
		// not bring it back as one stray dot.
		if (value != null && value !== 0 && !done.has(key)) {
			out[key] = Math.max(1, Math.round(value * scale));
		}
	}
	for (const key of ICON_DENSITY_KEYS) {
		const value = out[key];
		if (value != null) out[key] = Math.max(0.02, value * scale);
	}
	return out;
}

export function scaleRadii(options: ThinkingOrbOptions, scale: number): ThinkingOrbOptions {
	const out: ThinkingOrbOptions = { ...options };
	for (const key of RADIUS_KEYS) {
		const value = out[key];
		if (value != null) out[key] = value * scale;
	}
	return out;
}

/** The base profile of each drawing, before a size is applied. */
const BASE_PROFILES: Record<ThinkingOrbMode, ThinkingOrbOptions> = {
	globe: {
		latRings: 17,
		lonDensity: 44,
		rBase: 0.6,
		rDepth: 1.7,
		rBoost: 1.0,
		inkFar: 0.62,
		inkSpan: 0.54,
		rsPow: 0.6,
		rMin: 0.3
	},
	orbits: {
		orbitN: 12,
		ghostN: 40,
		ghostR: 0.9,
		ghostA: 0.5,
		particles: 3,
		partR: 1.2,
		partRDepth: 1.6,
		rsPow: 0.6,
		rMin: 0.3
	},
	rubik: {
		latRings: 15,
		lonDensity: 40,
		moveCount: 14,
		rBase: 0.6,
		rDepth: 1.7,
		rActive: 0.3,
		inkFar: 0.62,
		inkSpan: 0.54,
		rsPow: 0.6,
		rMin: 0.3
	},
	wave: {
		rings: 15,
		lonDensity: 40,
		rBase: 0.6,
		rDepth: 1.7,
		rsPow: 0.6,
		rMin: 0.3
	},
	web: {
		nodeN: 30,
		thr: 0.72,
		signals: 5,
		nodeR: 1.4,
		nodeRDepth: 1.8,
		lineW: 0.8,
		rsPow: 0.6,
		rMin: 0.3
	},
	braid: {
		strandN: 52,
		turns: 3.0,
		ghostN: 150,
		rBase: 1.2,
		rDepth: 1.8,
		rsPow: 0.6,
		rMin: 0.3
	},
	ribbon: {
		lanes: 5,
		segs: 88,
		ghostN: 150,
		rBase: 1.1,
		rDepth: 1.7,
		rsPow: 0.6,
		rMin: 0.3
	},
	// The ring is the ribbon seen from the front, with no sphere behind it.
	ring: {
		lanes: 5,
		segs: 88,
		ghostN: 0,
		faceOn: 1,
		rBase: 1.1,
		rDepth: 1.7,
		rsPow: 0.6,
		rMin: 0.3
	},
	morph: {
		rDot: 0.021,
		iconD: 1,
		rMin: 0.25
	}
};

type Preset = {
	/** Multiplier on the clock. */
	speed: number;
	/** Multiplier on the profile's counts. */
	count: number;
	/** Multiplier on the profile's radii. */
	size: number;
	/** Options set as they are, after the scaling. */
	extra?: ThinkingOrbOptions;
};

/** The two sizes each state is tuned at, in CSS pixels. */
const LARGE = 64;
const SMALL = 20;

const PRESETS: Record<ThinkingOrbMode, { large: Preset; small: Preset }> = {
	orbits: {
		large: { speed: 1.885, count: 1, size: 1 },
		small: { speed: 3.9, count: 0.238, size: 2.4 }
	},
	globe: {
		large: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
		small: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } }
	},
	rubik: {
		large: { speed: 1.82, count: 0.35, size: 1.05 },
		small: { speed: 1.95, count: 0.088, size: 1.9 }
	},
	wave: {
		large: { speed: 4.388, count: 0.341, size: 1 },
		small: { speed: 3.998, count: 0.105, size: 1.6 }
	},
	web: {
		large: { speed: 3.315, count: 1.35, size: 0.95 },
		small: { speed: 6.63, count: 0.25, size: 1.52 }
	},
	braid: {
		large: { speed: 1.625, count: 0.5, size: 1 },
		small: { speed: 2.75, count: 0.1125, size: 1.36 }
	},
	ribbon: {
		large: {
			speed: 2.34,
			count: 0.25,
			size: 0.85,
			extra: { spin: 0, bandMul: 3.9, wobMul: 1 }
		},
		small: {
			speed: 3.12,
			count: 0.051,
			size: 1.073,
			extra: { spin: 0, bandMul: 4.94, wobMul: 1 }
		}
	},
	ring: {
		large: {
			speed: 3.24,
			count: 0.25,
			size: 0.956,
			extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 }
		},
		small: {
			speed: 3.78,
			count: 0.028,
			size: 1.622,
			extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 }
		}
	},
	morph: {
		large: { speed: 2.405, count: 0.702, size: 0.395, extra: { spread: 1.45 } },
		small: { speed: 2.08, count: 0.53, size: 1.011, extra: { spread: 1.45 } }
	}
};

/**
 * A value between its two tunings. These knobs are ratios, so the blend runs on their
 * logarithms; a value that is 0 at either end is blended in a straight line.
 */
const between = (large: number, small: number, share: number) =>
	share <= 0
		? large
		: share >= 1
			? small
			: large > 0 && small > 0
				? large * (small / large) ** share
				: large + (small - large) * share;

/** Where a size sits between the two tunings: 0 at 64px and above, 1 at 20px and below. */
const sizeShare = (size: number) =>
	Math.min(1, Math.max(0, Math.log(size / LARGE) / Math.log(SMALL / LARGE)));

const SHAPES = { circle: 0, triangle: 1, square: 2 } as const;

/** The public tuning names as the options the drawings read. */
function tuningOptions(tuning: ThinkingOrbTuning): ThinkingOrbOptions {
	const named: ThinkingOrbOptions = {
		ghostA: tuning.trailOpacity,
		particles: tuning.particles,
		scanMul: tuning.scanSpeed,
		dimBase: tuning.dim,
		thr: tuning.reach,
		signals: tuning.signals,
		lineW: tuning.lineWidth,
		spread: tuning.spread,
		turns: tuning.turns,
		wobMul: tuning.wobble,
		bandMul: tuning.bands,
		spin: tuning.spin,
		shape: tuning.shape ? SHAPES[tuning.shape] : undefined
	};
	const out: ThinkingOrbOptions = {};
	for (const key in named) if (named[key] != null) out[key] = named[key];
	return out;
}

export type ResolvedThinkingOrb = {
	mode: ThinkingOrbMode;
	/** Multiplier on the clock for this state at this size. */
	speed: number;
	options: ThinkingOrbOptions;
};

const cache = new Map<string, ResolvedThinkingOrb>();

/** The drawing, pace and options of a state at a size (CSS pixels), before any multiplier. */
export function resolveThinkingOrbPreset(
	state: ThinkingOrbState,
	size: number
): ResolvedThinkingOrb {
	// A tenth of a pixel is finer than any size an orb is laid out at.
	const key = `${state}-${Math.round(size * 10)}`;
	const hit = cache.get(key);
	if (hit) return hit;

	const mode = THINKING_ORB_MODES[state] ?? 'orbits';
	const { large, small } = PRESETS[mode];
	const share = sizeShare(size);
	const count = between(large.count, small.count, share);
	const radius = between(large.size, small.size, share);

	let options: ThinkingOrbOptions = { ...BASE_PROFILES[mode] };
	if (count !== 1) options = scaleCounts(options, count);
	if (radius !== 1) options = scaleRadii(options, radius);
	for (const name in large.extra) {
		options[name] = between(large.extra[name]!, small.extra?.[name] ?? large.extra[name]!, share);
	}

	const resolved = { mode, speed: between(large.speed, small.speed, share), options };
	// Sizes come from layout, so the cache is bounded.
	if (cache.size > 256) cache.clear();
	cache.set(key, resolved);
	return resolved;
}

/**
 * The preset with the instance's multipliers and tuning applied: `dots` on the counts, `dotSize`
 * on the radii, then `tuning`, which wins over both.
 */
export function resolveThinkingOrb(
	state: ThinkingOrbState,
	size: number,
	adjust: { dots?: number; dotSize?: number; tuning?: ThinkingOrbTuning } = {}
): ResolvedThinkingOrb {
	const preset = resolveThinkingOrbPreset(state, size);
	const { dots = 1, dotSize = 1, tuning } = adjust;
	if (dots === 1 && dotSize === 1 && !tuning) return preset;
	// The preset is cached and shared: never written to.
	let options = preset.options;
	if (dots !== 1) options = scaleCounts(options, Math.max(0.1, dots));
	if (dotSize !== 1) options = scaleRadii(options, Math.max(0.1, dotSize));
	if (tuning) options = { ...options, ...tuningOptions(tuning) };
	return { mode: preset.mode, speed: preset.speed, options };
}
