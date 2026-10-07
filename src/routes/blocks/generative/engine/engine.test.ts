import { describe, expect, it } from 'vitest';
import { directions, findDirection } from './directions.js';
import {
	countPages,
	formatCount,
	generatePage,
	pageViolations,
	repairPage,
	rerollSection,
	validateSpec
} from './composition.js';
import { fnv1a, mulberry32, rngFor, weightedIndex } from './random.js';
import {
	directedSpace,
	failingRules,
	legalSpace,
	optionState,
	sampleVariants,
	snapTo,
	validateParams,
	variantIndex
} from './space.js';
import { defaultKitParams, kitType } from './kit.js';
import { decodeSpec, encodeSpec } from './spec.js';
import type { Direction, PageSpec, SectionType } from './types.js';
import { lookupSection, sectionCategories, sectionTypes, typesInCategory } from '../registry.js';
import { recipes, specFromRecipe } from '../recipes.js';

const toy: SectionType = {
	id: 'toy',
	category: 'toy',
	title: 'Toy',
	description: '',
	file: 'toy/Toy.svelte',
	dims: {
		textCols: [4, 6, 8],
		layout: ['text', 'split'],
		offset: [0, 2],
		tone: ['plain', 'inverse']
	},
	meta: {},
	derive: (p) => ({ mediaCols: p.layout === 'split' ? 12 - Number(p.textCols) : 0 }),
	rules: [
		{
			id: 'min',
			text: 'text ≥ 6 when split',
			test: (p) => p.layout !== 'split' || Number(p.textCols) >= 6
		},
		{
			id: 'canon',
			text: 'offset only for text layout',
			test: (p) => p.layout === 'text' || p.offset === 0
		}
	]
};

describe('seeded randomness', () => {
	it('hashes and generates deterministically', () => {
		expect(fnv1a('meridian')).toBe(fnv1a('meridian'));
		expect(fnv1a('a')).not.toBe(fnv1a('b'));
		const left = mulberry32(42);
		const right = mulberry32(42);
		expect([left(), left(), left()]).toEqual([right(), right(), right()]);
	});

	it('never picks a zero weight', () => {
		const random = rngFor('weights');
		for (let draw = 0; draw < 200; draw += 1)
			expect(weightedIndex([0, 1, 0, 3], random)).not.toBe(0);
	});
});

describe('legal space', () => {
	it('enumerates the product and keeps only rule-passing, canonical variants', () => {
		const space = legalSpace(toy);
		expect(space.raw).toBe(3 * 2 * 2 * 2);
		// text: 3 cols × 2 offsets × 2 tones = 12; split: 2 cols (6, 8) × 1 offset × 2 tones = 4.
		expect(space.variants).toHaveLength(16);
		for (const variant of space.variants) expect(failingRules(toy, variant)).toEqual([]);
	});

	it('snaps a hand edit to the nearest legal variant', () => {
		const neutral = directedSpace(toy, findDirection('neutral'));
		const current = { textCols: 4, layout: 'text', offset: 2, tone: 'plain' };
		const snapped = snapTo(neutral, current, 'layout', 'split');
		expect(snapped?.params.layout).toBe('split');
		expect(snapped?.params.offset).toBe(0);
		expect(Number(snapped?.params.textCols)).toBeGreaterThanOrEqual(6);
		expect(snapped?.changed.sort()).toEqual(['offset', 'textCols']);
		expect(optionState(neutral, current, 'tone', 'inverse')).toEqual({ kind: 'legal' });
		expect(optionState(neutral, current, 'layout', 'split').kind).toBe('adjusts');
	});

	it('validates hand-written params with precise reasons', () => {
		const neutral = directedSpace(toy, findDirection('neutral'));
		expect(
			validateParams(neutral, { textCols: 6, layout: 'split', offset: 0, tone: 'plain' }).ok
		).toBe(true);
		const broken = validateParams(neutral, {
			textCols: 4,
			layout: 'split',
			offset: 0,
			tone: 'plain'
		});
		expect(broken.ok).toBe(false);
		if (!broken.ok) expect(broken.errors[0]).toContain('text ≥ 6');
		const unknown = validateParams(neutral, {
			textCols: 5,
			layout: 'split',
			offset: 0,
			tone: 'plain'
		});
		expect(unknown.ok).toBe(false);
	});
});

describe('the catalogue', () => {
	it('has two section types in every category', () => {
		for (const category of sectionCategories) {
			expect(typesInCategory(category.slug), category.slug).toHaveLength(2);
		}
	});

	it('gives every type a unique id, a file, metadata for each lever, and a stable shared vocabulary', () => {
		const ids = new Set<string>();
		for (const type of sectionTypes) {
			expect(ids.has(type.id), type.id).toBe(false);
			ids.add(type.id);
			expect(type.file.startsWith(`${type.category}/`), type.id).toBe(true);
			expect(type.dims.tone, `${type.id} has a tone lever`).toBeDefined();
			expect(type.dims.density, `${type.id} has a density lever`).toBeDefined();
			for (const lever of Object.keys(type.dims)) {
				expect(type.meta[lever]?.label, `${type.id}.${lever} has a label`).toBeTruthy();
			}
			for (const tone of type.dims.tone)
				expect(['plain', 'muted', 'tint', 'inverse', 'brand']).toContain(tone);
			for (const density of type.dims.density)
				expect(['compact', 'normal', 'comfortable']).toContain(density);
			for (const headline of type.dims.headline ?? [])
				expect(['h1', 'h2', 'h3']).toContain(headline);
		}
	});

	it('keeps every type usable: a real but bounded legal space, every lever value reachable', () => {
		for (const type of sectionTypes) {
			const space = legalSpace(type);
			expect(space.variants.length, type.id).toBeGreaterThanOrEqual(24);
			expect(space.raw, type.id).toBeLessThanOrEqual(200_000);
			for (const [lever, values] of Object.entries(type.dims)) {
				for (const value of values) {
					expect(
						space.variants.some((variant) => variant[lever] === value),
						`${type.id}.${lever}=${String(value)} is reachable`
					).toBe(true);
				}
			}
		}
	});

	it('never empties a type under any direction', () => {
		for (const direction of directions) {
			for (const type of sectionTypes) {
				const directed = directedSpace(type, direction);
				expect(directed.fallback, `${direction.id} keeps ${type.id}`).toBe(false);
				expect(directed.indices.length).toBeGreaterThan(0);
			}
		}
	});

	it('samples distinct variants deterministically', () => {
		for (const type of sectionTypes) {
			const directed = directedSpace(type, findDirection('neutral'));
			const left = sampleVariants(directed, 6, 'sample', type.id);
			const right = sampleVariants(directed, 6, 'sample', type.id);
			expect(left).toEqual(right);
			const keys = new Set(left.map((variant) => JSON.stringify(variant)));
			expect(keys.size).toBe(Math.min(6, directed.indices.length));
			for (const variant of left) expect(variantIndex(directed, variant)).toBeGreaterThanOrEqual(0);
		}
	});
});

describe('pages', () => {
	const landing = () => specFromRecipe(recipes[0], 'granite-4242', 'neutral');

	it('generates the same page from the same seed', () => {
		for (const direction of directions) {
			const spec = { ...landing(), direction: direction.id };
			const left = generatePage(spec, direction, lookupSection);
			const right = generatePage(spec, direction, lookupSection);
			expect(left.spec).toEqual(right.spec);
			const other = generatePage({ ...spec, seed: 'other-1' }, direction, lookupSection);
			expect(other.spec).not.toEqual(left.spec);
		}
	});

	it('repairs pages so every direction’s page rules hold, or reports what it could not', () => {
		for (const direction of directions) {
			for (const seed of ['a-1', 'b-2', 'c-3', 'd-4', 'e-5']) {
				const spec = { ...landing(), seed, direction: direction.id };
				const { spec: page, log } = generatePage(spec, direction, lookupSection);
				const violations = pageViolations(page.sections, direction, lookupSection);
				expect(violations).toEqual(log.unresolved);
				expect(violations, `${direction.id}/${seed}`).toEqual([]);
				expect(validateSpec(page, direction, lookupSection).issues).toEqual([]);
			}
		}
	});

	it('generates legal pages for every outline, direction and many seeds', () => {
		const failures: string[] = [];
		for (const recipe of recipes) {
			for (const direction of directions) {
				for (let index = 0; index < 12; index += 1) {
					const seed = `sweep-${index}`;
					const { spec, log } = generatePage(
						specFromRecipe(recipe, seed, direction.id),
						direction,
						lookupSection
					);
					if (log.unresolved.length)
						failures.push(
							`${recipe.id}/${direction.id}/${seed}: ${log.unresolved.map((v) => v.id)}`
						);
					expect(validateSpec(spec, direction, lookupSection).issues).toEqual([]);
				}
			}
		}
		expect(failures).toEqual([]);
	});

	it('rerolls one section and leaves locked sections alone', () => {
		const direction = findDirection('swiss');
		const { spec } = generatePage({ ...landing(), direction: 'swiss' }, direction, lookupSection);
		const locked: PageSpec = {
			...spec,
			sections: spec.sections.map((slot, index) => (index === 0 ? { ...slot, locked: true } : slot))
		};
		const { spec: next } = rerollSection(locked, 2, direction, lookupSection);
		expect(next.sections[0]).toEqual(locked.sections[0]);
		expect(next.sections[2].nonce).toBe(1);
		const regenerated = generatePage({ ...locked, seed: 'zzz-9' }, direction, lookupSection);
		expect(regenerated.spec.sections[0]).toEqual(locked.sections[0]);
	});

	it('reports clashes between locked sections instead of mutating them', () => {
		const direction = findDirection('swiss');
		const { spec } = generatePage({ ...landing(), direction: 'swiss' }, direction, lookupSection);
		const forced: PageSpec = {
			...spec,
			sections: spec.sections.map((slot) => ({
				...slot,
				locked: true,
				params: {
					...slot.params,
					tone: slot.type.startsWith('footer') ? slot.params.tone : 'plain'
				}
			}))
		};
		const { sections, log } = repairPage(forced, direction, lookupSection);
		expect(sections).toEqual(forced.sections);
		expect(log.unresolved.length).toBeGreaterThan(0);
	});

	it('counts pages and narrows them per direction', () => {
		const spec = landing();
		const neutral = countPages(spec, findDirection('neutral'), lookupSection);
		expect(neutral.value).toBeGreaterThan(1e12);
		for (const direction of directions.slice(1)) {
			const directed = countPages({ ...spec, direction: direction.id }, direction, lookupSection);
			expect(directed.value).toBeGreaterThan(0);
			expect(directed.value).toBeLessThan(neutral.value);
		}
		expect(neutral.exact).toBe(true);
		expect(formatCount(1248)).toBe('1,248');
		expect(formatCount(1.04e20)).toBe('1.04 × 10²⁰');
	});

	it('counts exactly: the dynamic programme agrees with brute force on a small outline', () => {
		// Small synthetic types keep brute force cheap while exercising every built-in page rule.
		const shared = { tone: ['plain', 'muted', 'inverse', 'brand'], density: ['compact', 'normal'] };
		const mini = (
			id: string,
			category: string,
			extra: SectionType['dims'],
			placement?: 'top' | 'bottom'
		) =>
			({
				id,
				category,
				title: id,
				description: '',
				file: `${category}/X.svelte`,
				dims: { ...shared, ...extra },
				meta: {},
				rules: [],
				placement
			}) satisfies SectionType;
		const types = [
			mini('mini-hero', 'hero', { headline: ['h1', 'h2'], mediaSide: ['start', 'end'] }),
			mini('mini-feature', 'feature', { headline: ['h2', 'h3'], mediaSide: ['start', 'end'] }),
			mini('mini-split', 'stats', { headline: ['h1', 'h3'], mediaSide: ['start', 'end'] }),
			mini('mini-footer', 'footer', {}, 'bottom')
		];
		const lookup = (id: string) => types.find((type) => type.id === id);
		const spec: PageSpec = {
			version: 1,
			seed: 'tiny',
			direction: 'all',
			// A locked kit counts once, so the count is the sections' alone.
			kit: { params: defaultKitParams, locked: true, nonce: 0 },
			sections: types.map((type, index) => ({
				id: `s${index}`,
				type: type.id,
				params: {},
				locked: false,
				nonce: 0
			}))
		};
		const every = {
			id: 'all',
			label: 'All rules',
			description: '',
			preset: 'balanced',
			palette: 'default',
			pageRules: [
				'adjacent-tones-differ',
				'single-inverse',
				'single-brand',
				'hero-leads-type',
				'alternate-media',
				'no-compact-run'
			]
		} satisfies Direction;
		const spaces = types.map((type) => legalSpace(type).variants);
		let brute = 0;
		const walk = (index: number, chosen: PageSpec['sections']) => {
			if (index === types.length) {
				if (pageViolations(chosen, every, lookup).length === 0) brute += 1;
				return;
			}
			for (const params of spaces[index])
				walk(index + 1, [...chosen, { ...spec.sections[index], params }]);
		};
		walk(0, []);
		const counted = countPages(spec, every, lookup);
		expect(counted.exact).toBe(true);
		expect(brute).toBeGreaterThan(0);
		expect(counted.value).toBe(brute);
	});

	it('picks a legal kit with the page, keeps a locked one, and multiplies the count', () => {
		for (const direction of directions) {
			const kits = directedSpace(kitType, direction);
			expect(kits.fallback, direction.id).toBe(false);
			const { spec } = generatePage(landing(), direction, lookupSection);
			expect(spec.kit).toBeDefined();
			expect(variantIndex(kits, spec.kit!.params)).toBeGreaterThanOrEqual(0);
			const locked = { ...spec, kit: { ...spec.kit!, locked: true } };
			const again = generatePage({ ...locked, seed: 'other-9' }, direction, lookupSection);
			expect(again.spec.kit).toEqual(locked.kit);
			const free = countPages(spec, direction, lookupSection).value;
			const pinned = countPages(locked, direction, lookupSection).value;
			expect(free / pinned).toBeCloseTo(kits.indices.length, 6);
		}
		const rejected = validateSpec(
			{
				...landing(),
				kit: {
					params: { ...defaultKitParams, primary: 'soft', accent: 'neutral' },
					locked: false,
					nonce: 0
				}
			},
			findDirection('neutral'),
			lookupSection
		);
		expect(rejected.issues.some((issue) => issue.slotId === 'kit')).toBe(true);
	});

	it('mixes section types within a category when asked, and counts the union', () => {
		const direction = findDirection('neutral');
		const chooseType = (slot: PageSpec['sections'][number]) => {
			const category = lookupSection(slot.type)!.category;
			return typesInCategory(category).at(-1)!.id;
		};
		const { spec } = generatePage(landing(), direction, lookupSection, { chooseType });
		for (const slot of spec.sections) expect(slot.type).toBe(chooseType(slot));
		const single = countPages(landing(), direction, lookupSection).value;
		const mixed = countPages(landing(), direction, lookupSection, {
			alternatives: (slot) => typesInCategory(lookupSection(slot.type)!.category)
		}).value;
		expect(mixed).toBeGreaterThan(single);
	});

	it('round-trips a spec through its URL encoding and rejects garbage', () => {
		const { spec } = generatePage(landing(), findDirection('neutral'), lookupSection);
		expect(decodeSpec(encodeSpec(spec))).toEqual(spec);
		expect(decodeSpec('not-a-spec')).toBeNull();
	});
});
