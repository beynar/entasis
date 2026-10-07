import { rngFor } from './random.js';
import { kitType } from './kit.js';
import { directedSpace, pickVariant, traitsOf, validateParams } from './space.js';
import type {
	Direction,
	PageEntry,
	PageKit,
	PageRule,
	PageSlot,
	PageSpec,
	PageViolation,
	Params,
	SectionTraits,
	SectionType
} from './types.js';

/** Bounded repair: always terminates, and the same inputs always end the same way. */
export const MAX_REPAIR = 60;

const isFooterZone = (entry: PageEntry) => entry.type.placement === 'bottom';

/** Rules between sections. A direction lists the ids it enforces. */
export const pageRules: Record<string, PageRule> = {
	'adjacent-tones-differ': {
		id: 'adjacent-tones-differ',
		text: 'Adjacent sections never share a tone',
		automaton: {
			initial: '',
			step: (previous, entry) => (entry.traits.tone === previous ? null : entry.traits.tone)
		},
		check: (page) => {
			for (let position = 1; position < page.length; position += 1) {
				if (page[position].traits.tone === page[position - 1].traits.tone)
					return [page[position].index, page[position - 1].index];
			}
			return [];
		}
	},
	'single-inverse': {
		id: 'single-inverse',
		text: 'At most one inverse section above the footer',
		automaton: {
			initial: '0',
			step: (seen, entry) => {
				if (entry.traits.tone !== 'inverse' || entry.type.placement === 'bottom') return seen;
				return seen === '1' ? null : '1';
			}
		},
		check: (page) => {
			const inverse = page.filter(
				(entry) => entry.traits.tone === 'inverse' && !isFooterZone(entry)
			);
			// Later bands first; the first one is the last resort, but it is still a candidate.
			return inverse.length > 1
				? [...inverse.slice(1), inverse[0]].map((entry) => entry.index)
				: [];
		}
	},
	'single-brand': {
		id: 'single-brand',
		text: 'At most one brand-coloured band per page',
		automaton: {
			initial: '0',
			step: (seen, entry) => {
				if (entry.traits.tone !== 'brand') return seen;
				return seen === '1' ? null : '1';
			}
		},
		check: (page) => {
			const brand = page.filter((entry) => entry.traits.tone === 'brand');
			return brand.length > 1 ? [...brand.slice(1), brand[0]].map((entry) => entry.index) : [];
		}
	},
	'hero-leads-type': {
		id: 'hero-leads-type',
		text: 'The hero carries the largest headline on the page',
		check: (page) => {
			const hero = page.find((entry) => entry.type.category === 'hero');
			if (!hero || hero.traits.headline === null) return [];
			const heroStep = hero.traits.headline;
			const offenders = page
				.filter(
					(entry) =>
						entry !== hero && entry.traits.headline !== null && entry.traits.headline <= heroStep
				)
				.map((entry) => entry.index);
			// The hero is the last resort: re-pick the others first, then let the hero grow.
			return offenders.length ? [...offenders, hero.index] : [];
		}
	},
	'alternate-media': {
		id: 'alternate-media',
		text: 'Consecutive media sections alternate sides',
		automaton: {
			initial: '',
			step: (last, entry) => {
				const side = entry.traits.mediaSide;
				if (!side) return last;
				return side === last ? null : side;
			}
		},
		check: (page) => {
			let previous: PageEntry | null = null;
			for (const entry of page) {
				const side = entry.traits.mediaSide;
				if (!side) continue;
				if (previous && previous.traits.mediaSide === side) return [entry.index, previous.index];
				previous = entry;
			}
			return [];
		}
	},
	'no-compact-run': {
		id: 'no-compact-run',
		text: 'No two compact sections in a row',
		automaton: {
			initial: '0',
			step: (previous, entry) => {
				const compact = entry.traits.density === 'compact';
				if (compact && previous === '1') return null;
				return compact ? '1' : '0';
			}
		},
		check: (page) => {
			for (let position = 1; position < page.length; position += 1) {
				if (
					page[position].traits.density === 'compact' &&
					page[position - 1].traits.density === 'compact'
				)
					return [page[position].index, page[position - 1].index];
			}
			return [];
		}
	}
};

export type SectionLookup = (id: string) => SectionType | undefined;

export function pageEntries(slots: readonly PageSlot[], lookup: SectionLookup): PageEntry[] {
	return slots.flatMap((slot, index) => {
		const type = lookup(slot.type);
		return type ? [{ index, type, params: slot.params, traits: traitsOf(type, slot.params) }] : [];
	});
}

export function activePageRules(direction: Direction): PageRule[] {
	return direction.pageRules.flatMap((id) => (pageRules[id] ? [pageRules[id]] : []));
}

export function pageViolations(
	slots: readonly PageSlot[],
	direction: Direction,
	lookup: SectionLookup
): PageViolation[] {
	const entries = pageEntries(slots, lookup);
	return activePageRules(direction).flatMap((rule) => {
		const indices = rule.check(entries);
		return indices.length ? [{ id: rule.id, text: rule.text, indices }] : [];
	});
}

/** The sub-seed of one slot: page seed, slot id, reroll nonce and a salt. */
export function pickSlot(
	seed: string,
	slot: PageSlot,
	type: SectionType,
	direction: Direction,
	salt = ''
): Params {
	return pickVariant(directedSpace(type, direction), rngFor(seed, slot.id, slot.nonce, salt));
}

/** Weight of a page's violations: every broken rule, plus every section it implicates. */
function conflictScore(sections: readonly PageSlot[], direction: Direction, lookup: SectionLookup) {
	return pageViolations(sections, direction, lookup).reduce(
		(score, violation) => score + 100 + violation.indices.length,
		0
	);
}

/** Seeded draws a fitting pick may try before settling for the least-bad one. */
const FIT_CANDIDATES = 32;

/**
 * Pick levers for the slot at `position` of `context` that break as few page rules as possible.
 * Draws are seeded (`salt`, then `salt~1`, `salt~2`…) and weighted by the direction, and the first
 * draw that breaks nothing wins — so on an unconstrained page this is exactly the plain seeded pick.
 */
export function fittingPick(
	seed: string,
	context: readonly PageSlot[],
	position: number,
	type: SectionType,
	direction: Direction,
	lookup: SectionLookup,
	salt = ''
): { params: Params; score: number } {
	const slot = context[position];
	let best: Params | null = null;
	let bestScore = Infinity;
	for (let draw = 0; draw < FIT_CANDIDATES; draw += 1) {
		const params = pickSlot(seed, slot, type, direction, draw === 0 ? salt : `${salt}~${draw}`);
		const score = conflictScore(context.with(position, { ...slot, params }), direction, lookup);
		if (score < bestScore) {
			best = params;
			bestScore = score;
			if (score === 0) break;
		}
	}
	return { params: best as Params, score: bestScore };
}

export interface RepairLog {
	attempts: number;
	/** Rules still broken after the bounded repair — reported, never silently forced. */
	unresolved: PageViolation[];
}

/**
 * Re-pick offending sections until every page rule holds or the attempt budget runs out. Each
 * attempt tries a seeded fitting pick (salt `fixN`) for every unlocked offender and applies the
 * single change that leaves the fewest conflicts — steepest-descent min-conflicts. Sideways moves
 * are allowed so a plateau can be crossed; the attempt number in the salt keeps them from cycling.
 */
export function repairPage(
	spec: PageSpec,
	direction: Direction,
	lookup: SectionLookup
): { sections: PageSlot[]; log: RepairLog } {
	let sections = spec.sections.map((slot) => ({ ...slot, params: { ...slot.params } }));
	for (let attempt = 0; attempt < MAX_REPAIR; attempt += 1) {
		const violations = pageViolations(sections, direction, lookup);
		if (violations.length === 0) return { sections, log: { attempts: attempt, unresolved: [] } };
		// Offenders first, then their neighbours: a clash between two sections is often settled by
		// moving the section next to them (an alternation needs room on both sides).
		const flagged = violations.flatMap((violation) => violation.indices);
		const offenders = [
			...new Set([...flagged, ...flagged.flatMap((index) => [index - 1, index + 1])])
		].filter((index) => sections[index] && !sections[index].locked && lookup(sections[index].type));
		if (offenders.length === 0) break;
		let move: { index: number; params: Params; score: number } | null = null;
		for (const index of offenders) {
			const type = lookup(sections[index].type) as SectionType;
			const fit = fittingPick(spec.seed, sections, index, type, direction, lookup, `fix${attempt}`);
			if (!move || fit.score < move.score) move = { index, ...fit };
		}
		if (!move) break;
		sections = sections.with(move.index, { ...sections[move.index], params: move.params });
	}
	return {
		sections,
		log: { attempts: MAX_REPAIR, unresolved: pageViolations(sections, direction, lookup) }
	};
}

/** The kit's own sub-seed: page seed, the `kit` slot name and its reroll nonce. */
export function pickKit(seed: string, nonce: number, direction: Direction): Params {
	return pickVariant(directedSpace(kitType, direction), rngFor(seed, 'kit', nonce));
}

export interface GenerateOptions {
	/** Start every unlocked section's (and the kit's) reroll count over. */
	resetNonces?: boolean;
	/**
	 * Re-choose the section type of every unlocked slot — typically the other type of its
	 * category — so a regenerated page changes structure, not only levers.
	 */
	chooseType?: (slot: PageSlot) => string;
}

/**
 * Generate every unlocked section from the seed, left to right. Each pick is checked against the
 * page built so far (forward checking), so most pages come out legal in one pass; repair handles
 * whatever later locked sections or dead ends leave behind. The component kit is picked from the
 * same seed unless it is locked.
 */
export function generatePage(
	spec: PageSpec,
	direction: Direction,
	lookup: SectionLookup,
	options: GenerateOptions = {}
): { spec: PageSpec; log: RepairLog } {
	const sections: PageSlot[] = [];
	for (const slot of spec.sections) {
		if (slot.locked || !lookup(slot.type)) {
			sections.push(slot);
			continue;
		}
		const typeId = options.chooseType?.(slot) ?? slot.type;
		const type = lookup(typeId) ?? (lookup(slot.type) as SectionType);
		const next = { ...slot, type: type.id, nonce: options.resetNonces ? 0 : slot.nonce };
		const context = [...sections, next];
		next.params = fittingPick(spec.seed, context, sections.length, type, direction, lookup).params;
		sections.push(next);
	}
	const kit: PageKit = spec.kit?.locked
		? spec.kit
		: (() => {
				const nonce = options.resetNonces ? 0 : (spec.kit?.nonce ?? 0);
				return { params: pickKit(spec.seed, nonce, direction), locked: false, nonce };
			})();
	const repaired = repairPage({ ...spec, sections }, direction, lookup);
	return { spec: { ...spec, kit, sections: repaired.sections }, log: repaired.log };
}

/** Re-pick the component kit alone; its nonce moves on so the draw differs. */
export function rerollKit(spec: PageSpec, direction: Direction): PageSpec {
	const nonce = (spec.kit?.nonce ?? 0) + 1;
	return {
		...spec,
		kit: { params: pickKit(spec.seed, nonce, direction), locked: spec.kit?.locked ?? false, nonce }
	};
}

/**
 * Re-pick one section only (its nonce moves on), preferring a draw that keeps the page legal; if
 * none does, the other unlocked sections are repaired around it.
 */
export function rerollSection(
	spec: PageSpec,
	index: number,
	direction: Direction,
	lookup: SectionLookup
): { spec: PageSpec; log: RepairLog } {
	const slot = spec.sections[index];
	const type = slot && lookup(slot.type);
	if (!slot || !type) return { spec, log: { attempts: 0, unresolved: [] } };
	const next = { ...slot, nonce: slot.nonce + 1 };
	const context = spec.sections.with(index, next);
	next.params = fittingPick(spec.seed, context, index, type, direction, lookup).params;
	// Repair must not move the section the person just rerolled, so it is locked for the pass.
	const pinned = context.map((entry, position) =>
		position === index ? { ...next, locked: true } : entry
	);
	const repaired = repairPage({ ...spec, sections: pinned }, direction, lookup);
	return {
		spec: {
			...spec,
			sections: repaired.sections.map((entry, position) =>
				position === index ? { ...entry, locked: slot.locked } : entry
			)
		},
		log: repaired.log
	};
}

export interface SpecIssue {
	index: number;
	slotId: string;
	errors: string[];
}

/**
 * Validate a stored or hand-edited spec against the same rules generation uses. Unknown section
 * types and illegal params are reported per section; nothing is silently rewritten here.
 */
export function validateSpec(spec: PageSpec, direction: Direction, lookup: SectionLookup) {
	const issues: SpecIssue[] = [];
	spec.sections.forEach((slot, index) => {
		const type = lookup(slot.type);
		if (!type) {
			issues.push({ index, slotId: slot.id, errors: [`Unknown section type “${slot.type}”.`] });
			return;
		}
		const result = validateParams(directedSpace(type, direction), slot.params);
		if (!result.ok) issues.push({ index, slotId: slot.id, errors: result.errors });
	});
	if (spec.kit) {
		const result = validateParams(directedSpace(kitType, direction), spec.kit.params);
		if (!result.ok) issues.push({ index: -1, slotId: 'kit', errors: result.errors });
	}
	return { issues, violations: pageViolations(spec.sections, direction, lookup) };
}

// ---------------------------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------------------------

interface CountBucket {
	traits: SectionTraits;
	count: number;
}

/** A slot's variants folded by the traits page rules read: a handful of buckets, not thousands. */
function countBuckets(slot: PageSlot, type: SectionType, direction: Direction): CountBucket[] {
	const directed = directedSpace(type, direction);
	const variants = slot.locked
		? [slot.params]
		: directed.indices.map((index) => directed.space.variants[index]);
	const buckets = new Map<string, CountBucket>();
	for (const variant of variants) {
		const traits = traitsOf(type, variant);
		const key = `${traits.tone}|${traits.density}|${traits.mediaSide}|${traits.headline}`;
		const bucket = buckets.get(key);
		if (bucket) bucket.count += 1;
		else buckets.set(key, { traits, count: 1 });
	}
	return [...buckets.values()];
}

/**
 * Number of pages a spec's outline can produce under a direction; locked sections count once.
 * Every built-in page rule is an automaton, so the count is exact: dynamic programming over the
 * sections, with the product of the rules' states as the state. "The hero leads the type" is not
 * left-to-right (sections above the hero must know its step), so it is counted by fixing the
 * hero's heading step in turn and filtering everyone else against it.
 */
export function countPages(
	spec: PageSpec,
	direction: Direction,
	lookup: SectionLookup,
	options: { alternatives?: (slot: PageSlot) => SectionType[] } = {}
): { value: number; exact: boolean; passRate: number } {
	const slots = spec.sections.flatMap((slot) => {
		const type = lookup(slot.type);
		if (!type) return [];
		// Mixed types: an unlocked slot may become any of its alternatives, so their buckets add up.
		const types = slot.locked ? [type] : (options.alternatives?.(slot) ?? [type]);
		return [{ type, buckets: types.flatMap((each) => countBuckets(slot, each, direction)) }];
	});
	if (slots.length === 0) return { value: 0, exact: true, passRate: 1 };
	const rules = activePageRules(direction);
	const automata = rules.flatMap((rule) => (rule.automaton ? [rule.automaton] : []));
	const heroRule = rules.some((rule) => rule.id === 'hero-leads-type');
	const exact = rules.every((rule) => rule.automaton || rule.id === 'hero-leads-type');
	const unconstrained = slots.reduce(
		(product, slot) => product * slot.buckets.reduce((sum, bucket) => sum + bucket.count, 0),
		1
	);

	const run = (keep: (slotIndex: number, traits: SectionTraits) => boolean) => {
		let states = new Map([[automata.map((automaton) => automaton.initial).join('§'), 1]]);
		slots.forEach((slot, slotIndex) => {
			const next = new Map<string, number>();
			for (const [key, count] of states) {
				const parts = key.split('§');
				for (const bucket of slot.buckets) {
					if (!keep(slotIndex, bucket.traits)) continue;
					const stepped: string[] = [];
					let legal = true;
					for (const [index, automaton] of automata.entries()) {
						const state = automaton.step(parts[index], { type: slot.type, traits: bucket.traits });
						if (state === null) {
							legal = false;
							break;
						}
						stepped.push(state);
					}
					if (!legal) continue;
					const nextKey = stepped.join('§');
					next.set(nextKey, (next.get(nextKey) ?? 0) + count * bucket.count);
				}
			}
			states = next;
		});
		return [...states.values()].reduce((sum, count) => sum + count, 0);
	};

	const heroIndex = heroRule ? slots.findIndex((slot) => slot.type.category === 'hero') : -1;
	let value: number;
	if (heroIndex < 0) {
		value = run(() => true);
	} else {
		const steps = new Set(slots[heroIndex].buckets.map((bucket) => bucket.traits.headline));
		value = 0;
		for (const step of steps) {
			value += run((slotIndex, traits) => {
				if (slotIndex === heroIndex) return traits.headline === step;
				return step === null || traits.headline === null || traits.headline > step;
			});
		}
	}
	// The kit is independent of every page rule: it multiplies the count, once.
	const kits = spec.kit?.locked ? 1 : directedSpace(kitType, direction).indices.length;
	return {
		value: value * kits,
		exact,
		passRate: unconstrained > 0 ? value / unconstrained : 0
	};
}

const superscripts: Record<string, string> = {
	'0': '⁰',
	'1': '¹',
	'2': '²',
	'3': '³',
	'4': '⁴',
	'5': '⁵',
	'6': '⁶',
	'7': '⁷',
	'8': '⁸',
	'9': '⁹',
	'-': '⁻'
};

/** `1,248` below a million, `1.04 × 10²⁰` above. */
export function formatCount(value: number): string {
	if (!Number.isFinite(value) || value <= 0) return '0';
	if (value < 1e6) return Math.round(value).toLocaleString('en-US');
	const exponent = Math.floor(Math.log10(value));
	const mantissa = value / 10 ** exponent;
	const power = String(exponent)
		.split('')
		.map((digit) => superscripts[digit])
		.join('');
	return `${mantissa.toFixed(2)} × 10${power}`;
}
