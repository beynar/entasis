/**
 * Seeded randomness for the generative blocks. Generation is a pure function of its seed: the same
 * seed paints the same page on the server, on hydration, and next year. `Math.random()` is never
 * called inside generation — only to mint a brand-new seed when someone asks for one.
 */

/** 32-bit FNV-1a: a stable string hash, identical in every JavaScript engine. */
export function fnv1a(input: string): number {
	let hash = 0x811c9dc5;
	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/** mulberry32: a small, portable PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

/** A generator for one decision, keyed by every input that should change it. */
export function rngFor(...parts: Array<string | number>): () => number {
	return mulberry32(fnv1a(parts.join('|')));
}

/**
 * One draw over cumulative weights. Zero-weight entries can never be picked; an all-zero list
 * falls back to a uniform pick so a caller never receives `-1` from a non-empty list.
 */
export function weightedIndex(weights: readonly number[], random: () => number): number {
	if (weights.length === 0) return -1;
	let total = 0;
	for (const weight of weights) total += Math.max(0, weight);
	if (total <= 0) return Math.floor(random() * weights.length);
	let target = random() * total;
	for (let index = 0; index < weights.length; index += 1) {
		target -= Math.max(0, weights[index]);
		if (target < 0) return index;
	}
	return weights.length - 1;
}

/**
 * Weighted sampling without replacement (Efraimidis–Spirakis): each entry gets the key
 * `ln(u) / w` and the largest keys win. Used for variant galleries, so a sample of six never
 * repeats and still honours a direction's bias.
 */
export function weightedSample<T>(
	entries: readonly T[],
	weight: (entry: T) => number,
	count: number,
	random: () => number
): T[] {
	return entries
		.map((entry) => {
			const w = Math.max(weight(entry), 1e-9);
			return { entry, key: Math.log(Math.max(random(), 1e-12)) / w };
		})
		.sort((left, right) => right.key - left.key)
		.slice(0, count)
		.map(({ entry }) => entry);
}

const seedWords = [
	'amber',
	'basalt',
	'cedar',
	'delta',
	'ember',
	'fjord',
	'granite',
	'harbor',
	'indigo',
	'juniper',
	'kelp',
	'linen',
	'meadow',
	'nimbus',
	'ochre',
	'pebble',
	'quartz',
	'river',
	'sable',
	'tundra',
	'umber',
	'velvet',
	'willow',
	'yarrow',
	'zephyr'
];

/** A short, readable seed. The only place generation touches `Math.random()`. */
export function freshSeed(): string {
	const word = seedWords[Math.floor(Math.random() * seedWords.length)];
	return `${word}-${Math.floor(Math.random() * 9000 + 1000)}`;
}
