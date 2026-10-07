import { rngFor, weightedIndex, weightedSample } from './random.js';
import type { DimValue, Direction, Params, Rule, SectionTraits, SectionType } from './types.js';

/**
 * The legal space of a section type: the cartesian product of its levers, filtered by its rules.
 * Built once per type and cached — randomness only ever picks an index into this list.
 */
export interface LegalSpace {
	type: SectionType;
	/** Lever names in declaration order; the enumeration order of `variants`. */
	order: string[];
	/** Every variant that passes every rule, in canonical (enumeration) order. */
	variants: Params[];
	/** Size of the raw product before rules ran. */
	raw: number;
}

/** A legal space seen through a direction: what it keeps, and how strongly it prefers each. */
export interface DirectedSpace {
	space: LegalSpace;
	direction: Direction;
	/** Indices into `space.variants` the direction allows. */
	indices: number[];
	/** Pick weight per entry of `indices` (product of per-lever weights). */
	weights: number[];
	/** Per lever, the values the direction narrows to (or every value when untouched). */
	allowed: Record<string, readonly DimValue[]>;
	rules: Rule[];
	/** True when the direction ruled out every variant and the type's own list stands in. */
	fallback: boolean;
}

const legalCache = new Map<string, LegalSpace>();
const directedCache = new Map<string, DirectedSpace>();

/** Lever positions merged with derived values — what rules and components read. */
export function resolveParams(type: SectionType, params: Params): Params {
	return type.derive ? { ...params, ...type.derive(params) } : params;
}

export function failingRules(type: SectionType, params: Params, extra: Rule[] = []): Rule[] {
	const resolved = resolveParams(type, params);
	return [...type.rules, ...extra].filter((rule) => !rule.test(resolved));
}

export function legalSpace(type: SectionType): LegalSpace {
	const cached = legalCache.get(type.id);
	if (cached) return cached;
	const order = Object.keys(type.dims);
	const variants: Params[] = [];
	let raw = 0;
	const walk = (index: number, current: Params) => {
		if (index === order.length) {
			raw += 1;
			if (failingRules(type, current).length === 0) variants.push({ ...current });
			return;
		}
		const name = order[index];
		for (const value of type.dims[name]) {
			current[name] = value;
			walk(index + 1, current);
		}
		delete current[name];
	};
	walk(0, {});
	const space = { type, order, variants, raw };
	legalCache.set(type.id, space);
	return space;
}

/** Direction tables are keyed `'*'`, then category, then type id; later keys refine earlier ones. */
function directionKeys(type: SectionType) {
	return ['*', type.category, type.id];
}

function allowedValues(type: SectionType, direction: Direction) {
	const allowed: Record<string, readonly DimValue[]> = {};
	for (const [name, values] of Object.entries(type.dims)) {
		let kept: readonly DimValue[] = values;
		for (const key of directionKeys(type)) {
			const narrowed = direction.narrow?.[key]?.[name];
			if (!narrowed) continue;
			const next = kept.filter((value) => narrowed.includes(value));
			// A narrowing that would empty a lever is ignored for that lever rather than emptying the
			// whole section — a direction written for one section type must not break another.
			if (next.length > 0) kept = next;
		}
		allowed[name] = kept;
	}
	return allowed;
}

function leverWeight(type: SectionType, direction: Direction, name: string, value: DimValue) {
	let weight = 1;
	for (const key of directionKeys(type)) {
		const table = direction.weights?.[key]?.[name];
		const entry = table?.[String(value)];
		if (entry !== undefined) weight = entry;
	}
	return weight;
}

export function directedSpace(type: SectionType, direction: Direction): DirectedSpace {
	const key = `${direction.id}::${type.id}`;
	const cached = directedCache.get(key);
	if (cached) return cached;
	const space = legalSpace(type);
	const allowed = allowedValues(type, direction);
	const rules = directionKeys(type).flatMap((name) => direction.rules?.[name] ?? []);
	const indices: number[] = [];
	const weights: number[] = [];
	space.variants.forEach((variant, index) => {
		for (const name of space.order) if (!allowed[name].includes(variant[name])) return;
		if (rules.length && failingRules(type, variant, rules).length) return;
		indices.push(index);
		weights.push(
			space.order.reduce(
				(product, name) => product * leverWeight(type, direction, name, variant[name]),
				1
			)
		);
	});
	// Never hand back an empty space: a direction that rules out every variant of a type falls
	// back to the type's own legal list, and `isFallback` lets the UI say so.
	const directed: DirectedSpace =
		indices.length > 0
			? { space, direction, indices, weights, allowed, rules, fallback: false }
			: {
					space,
					direction,
					indices: space.variants.map((_, index) => index),
					weights: space.variants.map(() => 1),
					allowed: { ...type.dims },
					rules: [],
					fallback: true
				};
	directedCache.set(key, directed);
	return directed;
}

/** Pick one variant: one RNG draw over the cumulative weights of the candidates. */
export function pickVariant(
	directed: DirectedSpace,
	random: () => number,
	filter?: (params: Params) => boolean
): Params {
	let candidates = directed.indices;
	let weights = directed.weights;
	if (filter) {
		const keptIndices: number[] = [];
		const keptWeights: number[] = [];
		directed.indices.forEach((index, position) => {
			if (filter(directed.space.variants[index])) {
				keptIndices.push(index);
				keptWeights.push(directed.weights[position]);
			}
		});
		// A filter is a preference (avoid the neighbour's tone), never a reason to fail.
		if (keptIndices.length > 0) {
			candidates = keptIndices;
			weights = keptWeights;
		}
	}
	const position = weightedIndex(weights, random);
	return { ...directed.space.variants[candidates[position]] };
}

export function seededVariant(directed: DirectedSpace, ...seed: Array<string | number>): Params {
	return pickVariant(directed, rngFor(...seed));
}

/** A sample of distinct variants, biased by the direction's weights. */
export function sampleVariants(
	directed: DirectedSpace,
	count: number,
	...seed: Array<string | number>
): Params[] {
	const weightOf = new Map(
		directed.indices.map((index, position) => [index, directed.weights[position]])
	);
	return weightedSample(
		directed.indices,
		(index) => weightOf.get(index) ?? 1,
		count,
		rngFor(...seed)
	).map((index) => ({ ...directed.space.variants[index] }));
}

export function sameParams(order: readonly string[], left: Params, right: Params) {
	return order.every((name) => left[name] === right[name]);
}

/** Position of `params` inside the directed list, or -1 when it is not legal there. */
export function variantIndex(directed: DirectedSpace, params: Params): number {
	const { order, variants } = directed.space;
	return directed.indices.findIndex((index) => sameParams(order, variants[index], params));
}

/**
 * Hand edits snap: setting one lever keeps every other lever that can stay, and moves the fewest
 * others needed to land on a legal variant. Among equally few moves, the smallest one wins — each
 * moved lever counts by how far its value sits from the current one in the lever's list (7 → 6
 * beats 7 → 5). Remaining ties resolve in canonical order, so an edit always lands the same way.
 */
export function snapTo(
	directed: DirectedSpace,
	current: Params,
	name: string,
	value: DimValue
): { params: Params; changed: string[] } | null {
	const { order, variants, type } = directed.space;
	const position = (lever: string, of: DimValue) => type.dims[lever].indexOf(of);
	let best: Params | null = null;
	let bestMoves = Infinity;
	let bestTravel = Infinity;
	for (const index of directed.indices) {
		const variant = variants[index];
		if (variant[name] !== value) continue;
		let moves = 0;
		let travel = 0;
		for (const lever of order) {
			if (lever === name || variant[lever] === current[lever]) continue;
			moves += 1;
			const from = position(lever, current[lever]);
			travel +=
				from < 0 ? type.dims[lever].length : Math.abs(position(lever, variant[lever]) - from);
		}
		if (moves < bestMoves || (moves === bestMoves && travel < bestTravel)) {
			best = variant;
			bestMoves = moves;
			bestTravel = travel;
			if (moves === 0) break;
		}
	}
	if (!best) return null;
	const chosen = best;
	const changed = order.filter((lever) => lever !== name && chosen[lever] !== current[lever]);
	return { params: { ...chosen }, changed };
}

export type OptionState =
	| { kind: 'legal' }
	| { kind: 'adjusts'; changed: string[]; rules: Rule[] }
	| { kind: 'narrowed'; reason: string }
	| { kind: 'impossible'; rules: Rule[] };

/**
 * What choosing `value` for lever `name` would do from the current variant: land directly, snap
 * other levers (and which rules force that), or nothing — the direction or the rules exclude it.
 */
export function optionState(
	directed: DirectedSpace,
	current: Params,
	name: string,
	value: DimValue
): OptionState {
	const { type } = directed.space;
	if (!directed.allowed[name]?.includes(value)) {
		return { kind: 'narrowed', reason: `${directed.direction.label} narrows this lever` };
	}
	const candidate = { ...current, [name]: value };
	const failing = failingRules(type, candidate, directed.rules);
	if (failing.length === 0 && variantIndex(directed, candidate) >= 0) return { kind: 'legal' };
	const snapped = snapTo(directed, current, name, value);
	if (!snapped) return { kind: 'impossible', rules: failing };
	return { kind: 'adjusts', changed: snapped.changed, rules: failing };
}

export type ValidationResult = { ok: true; index: number } | { ok: false; errors: string[] };

/** Validate hand-written params: known levers and values, every rule, then the direction. */
export function validateParams(directed: DirectedSpace, params: Params): ValidationResult {
	const { type, order } = directed.space;
	const errors: string[] = [];
	for (const name of order) {
		if (!(name in params)) errors.push(`Missing lever “${name}”.`);
		else if (!type.dims[name].includes(params[name]))
			errors.push(`“${String(params[name])}” is not a value of “${name}”.`);
	}
	for (const name of Object.keys(params))
		if (!order.includes(name)) errors.push(`Unknown lever “${name}”.`);
	if (errors.length) return { ok: false, errors };
	const failing = failingRules(type, params);
	if (failing.length) return { ok: false, errors: failing.map((rule) => `Breaks: ${rule.text}`) };
	const index = variantIndex(directed, params);
	if (index < 0) {
		const outside = order.filter((name) => !directed.allowed[name].includes(params[name]));
		const directionFailing = failingRules(type, params, directed.rules).map((rule) => rule.text);
		return {
			ok: false,
			errors: [
				...outside.map(
					(name) =>
						`${directed.direction.label} narrows “${name}” away from “${String(params[name])}”.`
				),
				...directionFailing.map((text) => `${directed.direction.label}: ${text}`)
			]
		};
	}
	return { ok: true, index };
}

export function traitsOf(type: SectionType, params: Params): SectionTraits {
	const resolved = resolveParams(type, params);
	const headline = resolved.headline;
	// A side only counts when there is media on it; levers pinned for canonicalisation don't.
	const side = resolved.media === 'none' ? null : resolved.mediaSide;
	return {
		tone: String(resolved.tone ?? 'canvas'),
		density: String(resolved.density ?? 'normal'),
		headline: typeof headline === 'string' ? Number(headline.slice(1)) : null,
		mediaSide: side === 'start' || side === 'end' ? side : null
	};
}
