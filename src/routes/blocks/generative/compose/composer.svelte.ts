import { findDirection } from '../engine/directions.js';
import {
	countPages,
	generatePage,
	pageViolations,
	fittingPick,
	repairPage,
	rerollKit,
	rerollSection,
	validateSpec,
	type RepairLog
} from '../engine/composition.js';
import { kitType } from '../engine/kit.js';
import { freshSeed, rngFor, weightedIndex } from '../engine/random.js';
import { directedSpace, seededVariant, validateParams, variantIndex } from '../engine/space.js';
import { parseSpec } from '../engine/spec.js';
import type { PageSlot, PageSpec, Params } from '../engine/types.js';
import { lookupSection, typesInCategory } from '../registry.js';
import { recipes, specFromRecipe, type Recipe } from '../recipes.js';

const STORAGE_KEY = 'entasis-generative-composer';
const HISTORY_LIMIT = 60;

/**
 * Everything the composer edits is one `PageSpec`: seed, direction, and ordered slots holding
 * lever params. Every mutation produces a new spec through the engine, so the page on screen is
 * always the pure function of what is stored — and undo is just the previous spec.
 */
export class Composer {
	spec = $state.raw<PageSpec>(Composer.initialSpec());
	selectedId = $state<string | null>(null);
	/** Randomizing also re-chooses each unlocked slot's type within its category. */
	mixTypes = $state(true);
	log = $state.raw<RepairLog>({ attempts: 0, unresolved: [] });
	#past = $state.raw<PageSpec[]>([]);
	#future = $state.raw<PageSpec[]>([]);

	static initialSpec(): PageSpec {
		const direction = findDirection('neutral');
		return generatePage(
			specFromRecipe(recipes[0], 'meridian-1', direction.id),
			direction,
			lookupSection,
			{
				resetNonces: true
			}
		).spec;
	}

	direction = $derived(findDirection(this.spec.direction));
	selectedIndex = $derived(this.spec.sections.findIndex((slot) => slot.id === this.selectedId));
	selected = $derived<PageSlot | undefined>(this.spec.sections[this.selectedIndex]);
	violations = $derived(pageViolations(this.spec.sections, this.direction, lookupSection));
	issues = $derived(validateSpec(this.spec, this.direction, lookupSection).issues);
	#countOptions = $derived(
		this.mixTypes
			? {
					alternatives: (slot: PageSlot) =>
						typesInCategory(lookupSection(slot.type)?.category ?? '')
				}
			: {}
	);
	count = $derived(countPages(this.spec, this.direction, lookupSection, this.#countOptions));
	/** Pages the same outline allows with no direction at all, for the "keeps 1 in N" ratio. */
	neutralCount = $derived(
		countPages(
			{ ...this.spec, direction: 'neutral' },
			findDirection('neutral'),
			lookupSection,
			this.#countOptions
		)
	);

	get canUndo() {
		return this.#past.length > 0;
	}

	get canRedo() {
		return this.#future.length > 0;
	}

	#commit(next: PageSpec, log?: RepairLog) {
		this.#past = [...this.#past, this.spec].slice(-HISTORY_LIMIT);
		this.#future = [];
		this.spec = next;
		if (log) this.log = log;
		this.#persist();
	}

	#persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.spec));
		} catch {
			// Storage can be unavailable (private mode); the page still works for this visit.
		}
	}

	restore(): boolean {
		try {
			const stored = parseSpec(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
			if (!stored) return false;
			this.spec = stored;
			this.log = { attempts: 0, unresolved: this.violations };
			return true;
		} catch {
			return false;
		}
	}

	/** Replace the whole spec with an imported one; rejects anything the engine cannot read. */
	load(value: unknown): string[] {
		const spec = parseSpec(value);
		if (!spec) return ['This is not a page spec (version 1 with seed, direction and sections).'];
		const report = validateSpec(spec, findDirection(spec.direction), lookupSection);
		if (report.issues.length)
			return report.issues.map(
				(issue) =>
					`${issue.index < 0 ? 'Component kit' : `Section ${issue.index + 1}`}: ${issue.errors.join(' ')}`
			);
		this.#commit(spec, { attempts: 0, unresolved: report.violations });
		this.selectedId = null;
		return [];
	}

	undo() {
		const previous = this.#past.at(-1);
		if (!previous) return;
		this.#past = this.#past.slice(0, -1);
		this.#future = [this.spec, ...this.#future];
		this.spec = previous;
		this.#persist();
	}

	redo() {
		const next = this.#future[0];
		if (!next) return;
		this.#future = this.#future.slice(1);
		this.#past = [...this.#past, this.spec];
		this.spec = next;
		this.#persist();
	}

	/** A seeded, even pick among the slot's category types — its own sub-seed, `type`. */
	#chooseType = (seed: string) => (slot: PageSlot) => {
		const types = typesInCategory(lookupSection(slot.type)?.category ?? '');
		if (types.length < 2) return slot.type;
		const index = weightedIndex(
			types.map(() => 1),
			rngFor(seed, slot.id, 'type')
		);
		return types[index]?.id ?? slot.type;
	};

	#generate(spec: PageSpec, mix = this.mixTypes) {
		const result = generatePage(spec, findDirection(spec.direction), lookupSection, {
			resetNonces: true,
			chooseType: mix ? this.#chooseType(spec.seed) : undefined
		});
		this.#commit(result.spec, result.log);
	}

	/** A new seed for every unlocked section. Locked sections keep their levers. */
	randomize(seed = freshSeed()) {
		this.#generate({ ...this.spec, seed });
	}

	setSeed(seed: string) {
		const trimmed = seed.trim();
		if (trimmed && trimmed !== this.spec.seed) this.#generate({ ...this.spec, seed: trimmed });
	}

	/** A new direction re-picks levers on the same outline, so its effect reads directly. */
	setDirection(id: string) {
		if (id !== this.spec.direction) this.#generate({ ...this.spec, direction: id }, false);
	}

	useRecipe(recipe: Recipe) {
		this.selectedId = null;
		// An outline names its types on purpose: load it as written, then let Randomize remix it.
		this.#generate(
			{ ...specFromRecipe(recipe, this.spec.seed, this.spec.direction), kit: this.spec.kit },
			false
		);
	}

	/** Hand-edited kit levers lock the kit, like a hand-edited section. */
	setKit(params: Params) {
		if (!validateParams(directedSpace(kitType, this.direction), params).ok) return;
		this.#commit({ ...this.spec, kit: { params, locked: true, nonce: this.spec.kit?.nonce ?? 0 } });
	}

	toggleKitLock() {
		const kit = this.spec.kit;
		if (!kit) return;
		this.#commit({ ...this.spec, kit: { ...kit, locked: !kit.locked } });
	}

	rerollKit() {
		this.#commit(rerollKit(this.spec, this.direction));
	}

	reroll(id: string) {
		const index = this.spec.sections.findIndex((slot) => slot.id === id);
		if (index < 0) return;
		const result = rerollSection(this.spec, index, this.direction, lookupSection);
		this.#commit(result.spec, result.log);
	}

	repair() {
		const result = repairPage(this.spec, this.direction, lookupSection);
		this.#commit({ ...this.spec, sections: result.sections }, result.log);
	}

	toggleLock(id: string) {
		this.#commit({
			...this.spec,
			sections: this.spec.sections.map((slot) =>
				slot.id === id ? { ...slot, locked: !slot.locked } : slot
			)
		});
	}

	/** A hand edit always lands on a legal variant (the lever panel snaps), and locks the section. */
	setParams(id: string, params: Params) {
		const slot = this.spec.sections.find((entry) => entry.id === id);
		const type = slot && lookupSection(slot.type);
		if (!slot || !type) return;
		if (!validateParams(directedSpace(type, this.direction), params).ok) return;
		const sections = this.spec.sections.map((entry) =>
			entry.id === id ? { ...entry, params, locked: true } : entry
		);
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
	}

	#nextId() {
		const used = this.spec.sections.map((slot) => slot.id);
		let counter = this.spec.sections.length + 1;
		while (used.includes(`s${counter}`)) counter += 1;
		return `s${counter}`;
	}

	/**
	 * Insert a section type at `index`. Its levers come from the page seed and its own slot id,
	 * and repair may only move the newcomer — the sections already composed stay as they are.
	 */
	insert(typeId: string, index = this.spec.sections.length, params?: Params) {
		const type = lookupSection(typeId);
		if (!type) return;
		const slot: PageSlot = {
			id: this.#nextId(),
			type: typeId,
			params: {},
			locked: false,
			nonce: 0
		};
		const directed = directedSpace(type, this.direction);
		const handPicked = params && variantIndex(directed, params) >= 0;
		const context = this.spec.sections.toSpliced(index, 0, slot);
		slot.params = handPicked
			? { ...params }
			: fittingPick(this.spec.seed, context, index, type, this.direction, lookupSection).params;
		// A hand-picked variant (from a block page) arrives locked; a drawn one stays free. Either
		// way the sections already composed are left alone — violations are reported, not forced.
		const sections = context.map((entry) =>
			entry.id === slot.id ? { ...slot, locked: Boolean(handPicked) } : entry
		);
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
		this.selectedId = slot.id;
	}

	duplicate(id: string) {
		const index = this.spec.sections.findIndex((slot) => slot.id === id);
		const slot = this.spec.sections[index];
		if (!slot) return;
		const copy = { ...slot, id: this.#nextId(), nonce: 0 };
		const sections = this.spec.sections.toSpliced(index + 1, 0, copy);
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
		this.selectedId = copy.id;
	}

	remove(id: string) {
		const sections = this.spec.sections.filter((slot) => slot.id !== id);
		if (this.selectedId === id) this.selectedId = null;
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
	}

	reorder(sections: PageSlot[]) {
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
	}

	/** Swap a section for the other type of its category, keeping its slot id and lock state. */
	swapType(id: string, typeId: string) {
		const slot = this.spec.sections.find((entry) => entry.id === id);
		const type = lookupSection(typeId);
		if (!slot || !type || slot.type === typeId) return;
		const next = { ...slot, type: typeId, nonce: 0 };
		next.params = seededVariant(
			directedSpace(type, this.direction),
			this.spec.seed,
			slot.id,
			typeId
		);
		const sections = this.spec.sections.map((entry) => (entry.id === id ? next : entry));
		this.#commit(
			{ ...this.spec, sections },
			{ attempts: 0, unresolved: pageViolations(sections, this.direction, lookupSection) }
		);
	}

	siblingsOf(slot: PageSlot) {
		const type = lookupSection(slot.type);
		return type ? typesInCategory(type.category) : [];
	}
}
