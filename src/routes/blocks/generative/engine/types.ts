import type { RuntimeThemePresetName } from '../../../runtimeThemePlayground.svelte.js';
import type { RuntimeColorPaletteName } from '../../../playground/runtimeColorPalettes.js';

/** One lever position. Levers are short enums, never free ranges. */
export type DimValue = string | number | boolean;

/** A full set of lever positions for one section — the persisted, human-readable spec. */
export type Params = Record<string, DimValue>;

/** Finite design dimensions of a section type, in declaration order. */
export type Dims = Record<string, readonly DimValue[]>;

export interface DimMeta {
	label: string;
	/** Display labels for values whose raw form reads poorly (`true`, `12`, `media-end`). */
	values?: Record<string, string>;
	/** One line shown under the lever. */
	hint?: string;
}

/**
 * A unary or relational constraint on one section. `test` receives the lever positions merged
 * with everything `derive` computes, so rules can talk about derived spans too.
 */
export interface Rule {
	id: string;
	text: string;
	test: (params: Params) => boolean;
}

export type SectionPlacement = 'top' | 'flow' | 'bottom';

/**
 * What page rules can read from any section, whatever its own levers are called. `headline` is
 * the heading step (1 = largest); `mediaSide` is null when the variant has no side media.
 */
export interface SectionTraits {
	tone: string;
	density: string;
	headline: number | null;
	mediaSide: 'start' | 'end' | null;
}

export interface SectionType {
	/** Stable id, persisted in page specs. */
	id: string;
	/** Category slug this type belongs to — two types per category. */
	category: string;
	title: string;
	description: string;
	/** Svelte component rendering the section, relative to the `sections` directory. */
	file: string;
	dims: Dims;
	meta: Record<string, DimMeta>;
	/** Values computed from the levers rather than randomized (`mediaCols = 12 - textCols`). */
	derive?: (params: Params) => Params;
	rules: Rule[];
	placement?: SectionPlacement;
}

export interface SectionCategory {
	slug: string;
	title: string;
	description: string;
	/** Where the category sits in an outline, used to order the library. */
	order: number;
}

/** A rule between sections of one page; returns offending indices, preferred repair target first. */
export interface PageRule {
	id: string;
	text: string;
	check: (page: readonly PageEntry[]) => number[];
	/**
	 * The same rule as a left-to-right automaton, which lets pages be counted exactly by dynamic
	 * programming: `step` returns the next state, or null when the section breaks the rule.
	 */
	automaton?: {
		initial: string;
		step: (state: string, entry: Pick<PageEntry, 'type' | 'traits'>) => string | null;
	};
}

export interface PageEntry {
	/** Position of the section's slot in the page — what rules report back. */
	index: number;
	type: SectionType;
	params: Params;
	traits: SectionTraits;
}

/** Restriction table keyed by `'*'`, a category slug, or a section type id. */
export type DirectionTable<T> = Record<string, T>;

/**
 * The art-direction layer: fixed tokens (an Entasis theme preset and palette), narrowed levers,
 * bias weights, and the page rules that hold sections together. Weights never make an illegal
 * variant possible — narrowing is the only way to exclude one.
 */
export interface Direction {
	id: string;
	label: string;
	description: string;
	preset: RuntimeThemePresetName;
	palette: RuntimeColorPaletteName;
	narrow?: DirectionTable<Partial<Record<string, readonly DimValue[]>>>;
	rules?: DirectionTable<Rule[]>;
	weights?: DirectionTable<Partial<Record<string, Partial<Record<string, number>>>>>;
	pageRules: string[];
}

export interface PageSlot {
	/** Stable slot id: part of the slot's sub-seed, so reordering never repaints a section. */
	id: string;
	type: string;
	params: Params;
	locked: boolean;
	/** Bumped by a single-section reroll; resets when the whole page regenerates. */
	nonce: number;
}

/** The page's component kit: levers shared by every component, picked and locked as one. */
export interface PageKit {
	params: Params;
	locked: boolean;
	nonce: number;
}

export interface PageSpec {
	version: 1;
	seed: string;
	direction: string;
	/** Absent in specs written before the kit existed; read as the default kit. */
	kit?: PageKit;
	sections: PageSlot[];
}

export interface PageViolation {
	id: string;
	text: string;
	indices: number[];
}
