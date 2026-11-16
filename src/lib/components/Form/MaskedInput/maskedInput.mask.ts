// The mask syntax MaskedInput accepts, compiled to what Maskito runs. A pattern string reads one
// character at a time: a token (`#`, `A`, `*` or an app token) is a slot the user fills, `?` after
// a token makes it optional, `+` lets it repeat, `\` makes the next character literal, and any
// other character is a literal the mask writes itself. Nothing here touches the DOM.
import type { MaskitoMaskExpression } from '@maskito/core';

/** How a token rewrites a typed character before checking it: upper case, lower case, or a function. */
export type MaskedInputTransform = 'upper' | 'lower' | ((char: string) => string);

/** One slot kind of a mask: the single character it accepts, and how a typed character is rewritten. */
export type MaskedInputToken = {
	/** Matches one accepted character, after `transform`. Flags `g` and `y` are ignored. */
	pattern: RegExp;
	/** Rewrites each typed character before `pattern` checks it, such as `'upper'`. */
	transform?: MaskedInputTransform;
};

/** App tokens by their one-character name; they add to, or replace, `#`, `A` and `*`. */
export type MaskedInputTokens = Record<string, MaskedInputToken>;

/**
 * A pattern string, a list of patterns (the first one the text fits is used), or a function
 * receiving the characters typed so far, without separators, and returning the pattern to use.
 */
export type MaskedInputMask = string | readonly string[] | ((raw: string) => string);

/** What a masked text holds: the text as shown, the typed characters only, and whether it is whole. */
export type MaskedInputValueDetails = {
	/** The text as the input shows it, separators included, without the placeholder. */
	masked: string;
	/** The characters the user typed into slots, without the separators the mask writes. */
	raw: string;
	/** True when every required slot is filled. */
	complete: boolean;
};

/** The built-in tokens: `#` a digit, `A` a letter, `*` a letter or a digit. */
export const MASKED_INPUT_TOKENS: Readonly<MaskedInputTokens> = Object.freeze({
	'#': { pattern: /[0-9]/ },
	A: { pattern: /\p{L}/u },
	'*': { pattern: /[\p{L}\p{N}]/u }
});

type Literal = { kind: 'literal'; char: string };
type Slot = {
	kind: 'slot';
	token: string;
	accepts: (char: string) => boolean;
	transform: (char: string) => string;
	optional: boolean;
	repeat: boolean;
};
export type MaskItem = Literal | Slot;

export type CompiledMaskPattern = {
	source: string;
	items: readonly MaskItem[];
	/** Slots that must be filled; a repeating slot counts once. */
	requiredSlots: number;
};

const toTransform = (transform: MaskedInputTransform | undefined): ((char: string) => string) => {
	if (transform === 'upper') return (char) => char.toUpperCase();
	if (transform === 'lower') return (char) => char.toLowerCase();
	if (typeof transform === 'function') return transform;
	return (char) => char;
};

// A token's pattern checks one whole character, whatever flags or anchors the app wrote.
const anchored = (pattern: RegExp) =>
	new RegExp(`^(?:${pattern.source})$`, pattern.flags.replace(/[gy]/g, ''));

type CompiledToken = Pick<Slot, 'accepts' | 'transform'>;

const compileTokens = (tokens: MaskedInputTokens | undefined): Map<string, CompiledToken> => {
	const compiled = new Map<string, CompiledToken>();
	for (const [name, token] of Object.entries({ ...MASKED_INPUT_TOKENS, ...tokens })) {
		if (Array.from(name).length !== 1) continue;
		const pattern = anchored(token.pattern);
		const transform = toTransform(token.transform);
		compiled.set(name, {
			transform,
			accepts: (char) => pattern.test(transform(char))
		});
	}
	return compiled;
};

/** Compiles one pattern string against a token table. */
export const compileMaskPattern = (
	source: string,
	tokens: MaskedInputTokens | undefined = undefined
): CompiledMaskPattern => compilePattern(source, compileTokens(tokens));

const compilePattern = (
	source: string,
	tokens: Map<string, CompiledToken>
): CompiledMaskPattern => {
	const chars = Array.from(source);
	const items: MaskItem[] = [];
	for (let index = 0; index < chars.length; index += 1) {
		const char = chars[index];
		if (char === '\\') {
			index += 1;
			items.push({ kind: 'literal', char: chars[index] ?? '\\' });
			continue;
		}
		const token = tokens.get(char);
		if (!token) {
			items.push({ kind: 'literal', char });
			continue;
		}
		const slot: Slot = { kind: 'slot', token: char, ...token, optional: false, repeat: false };
		// `?` and `+` right after a token modify it, in either order, once each.
		while (true) {
			const next = chars[index + 1];
			if (next === '?' && !slot.optional) slot.optional = true;
			else if (next === '+' && !slot.repeat) slot.repeat = true;
			else break;
			index += 1;
		}
		items.push(slot);
	}
	return {
		source,
		items,
		requiredSlots: items.filter((item) => item.kind === 'slot' && !item.optional).length
	};
};

/** How one character of a text was read, or a separator the mask wrote without it being typed. */
export type MaskStep =
	| { kind: 'literal'; item: number; auto: boolean }
	| { kind: 'slot'; item: number; char: string }
	| { kind: 'skip'; item: number }
	| { kind: 'drop'; char: string };

/** One way a text fits a pattern. */
export type MaskReading = {
	pattern: CompiledMaskPattern;
	steps: readonly MaskStep[];
	/** The characters read into slots, transformed. */
	raw: string;
	/** Slot characters plus dropped characters some token accepts: what a function mask receives. */
	looseRaw: string;
	/** Dropped characters that a slot of the pattern would accept. */
	cost: number;
	/** Every dropped character. */
	drops: number;
	/** Where the reading stopped: the item index, and whether a repeating slot there has a character. */
	end: { item: number; repeated: boolean };
	/** Every item of the pattern the text spans, then the rest of the pattern. */
	expansion: readonly MaskItem[];
	/** Items of `expansion` the text covers (characters read plus separators written). */
	covered: number;
	complete: boolean;
};

type Choice =
	| { type: 'end' }
	| { type: 'consume'; item: number; repeated: boolean; step: MaskStep }
	| { type: 'epsilon'; item: number; step: MaskStep | null; skip: boolean }
	| { type: 'drop' };

type Best = { cost: number; drops: number; skips: number; choice: Choice; next: Best | null };

const better = (a: Best, b: Best) =>
	a.cost < b.cost ||
	(a.cost === b.cost && (a.drops < b.drops || (a.drops === b.drops && a.skips < b.skips)));

/**
 * Reads a text against one pattern: each character is a separator the pattern writes there, a
 * slot character, or dropped. Separators the text leaves out are written by the mask. The reading
 * drops as few slot characters as it can, then as few characters, then skips as few optional
 * slots; on a tie it fills the earliest slot, so a repeating slot takes every character it accepts.
 */
export const readMaskPattern = (
	value: string,
	pattern: CompiledMaskPattern,
	anyToken: (char: string) => boolean = () => false
): MaskReading => {
	const chars = Array.from(value);
	const { items } = pattern;
	const memo = new Map<number, Best>();
	const slotAccepts = (char: string) =>
		items.some((item) => item.kind === 'slot' && item.accepts(char));

	const best = (position: number, item: number, repeated: boolean): Best => {
		const key = (position * (items.length + 1) + item) * 2 + (repeated ? 1 : 0);
		const cached = memo.get(key);
		if (cached) return cached;
		let result: Best;
		if (position === chars.length) {
			result = { cost: 0, drops: 0, skips: 0, choice: { type: 'end' }, next: null };
		} else {
			const char = chars[position];
			const current = items[item];
			const candidates: Best[] = [];
			const consider = (candidate: Best) => candidates.push(candidate);
			// Read the character here.
			if (current?.kind === 'literal' && current.char === char) {
				const next = best(position + 1, item + 1, false);
				consider({
					...next,
					choice: {
						type: 'consume',
						item: item + 1,
						repeated: false,
						step: { kind: 'literal', item, auto: false }
					},
					next
				});
			} else if (current?.kind === 'slot' && current.accepts(char)) {
				const nextItem = current.repeat ? item : item + 1;
				const next = best(position + 1, nextItem, current.repeat);
				consider({
					...next,
					choice: {
						type: 'consume',
						item: nextItem,
						repeated: current.repeat,
						step: { kind: 'slot', item, char: current.transform(char) }
					},
					next
				});
			}
			// Move past the item without reading: a separator the mask writes, a skipped optional
			// slot, or the end of a repeat.
			if (current?.kind === 'literal') {
				const next = best(position, item + 1, false);
				consider({
					...next,
					choice: {
						type: 'epsilon',
						item: item + 1,
						step: { kind: 'literal', item, auto: true },
						skip: false
					},
					next
				});
			} else if (current?.kind === 'slot' && (current.optional || (current.repeat && repeated))) {
				const next = best(position, item + 1, false);
				const skip = !repeated;
				consider({
					...next,
					skips: next.skips + (skip ? 1 : 0),
					choice: {
						type: 'epsilon',
						item: item + 1,
						step: skip ? { kind: 'skip', item } : null,
						skip
					},
					next
				});
			}
			// Drop the character.
			const next = best(position + 1, item, repeated);
			consider({
				...next,
				cost: next.cost + (slotAccepts(char) ? 1 : 0),
				drops: next.drops + 1,
				choice: { type: 'drop' },
				next
			});
			// The first candidate wins a tie: reading beats moving on, which beats dropping.
			result = candidates.reduce((kept, candidate) => (better(candidate, kept) ? candidate : kept));
		}
		memo.set(key, result);
		return result;
	};

	const steps: MaskStep[] = [];
	let raw = '';
	let looseRaw = '';
	let position = 0;
	let item = 0;
	let repeated = false;
	const root = best(0, 0, false);
	for (let node: Best | null = root; node && node.choice.type !== 'end'; node = node.next) {
		const { choice } = node;
		if (choice.type === 'consume') {
			steps.push(choice.step);
			if (choice.step.kind === 'slot') {
				raw += choice.step.char;
				looseRaw += choice.step.char;
			}
			item = choice.item;
			repeated = choice.repeated;
			position += 1;
		} else if (choice.type === 'epsilon') {
			if (choice.step) steps.push(choice.step);
			item = choice.item;
			repeated = false;
		} else {
			const char = chars[position];
			steps.push({ kind: 'drop', char });
			if (anyToken(char)) looseRaw += char;
			position += 1;
		}
	}

	const expansion: MaskItem[] = [];
	for (const step of steps) {
		if (step.kind === 'literal' || step.kind === 'slot') expansion.push(items[step.item]);
	}
	const covered = expansion.length;
	for (let index = item; index < items.length; index += 1) {
		// A repeating slot that already holds a character needs no further position.
		if (index === item && repeated) continue;
		expansion.push(items[index]);
	}
	const rest = items.slice(item);
	const complete =
		root.drops === 0 &&
		rest.every(
			(entry, index) =>
				entry.kind === 'literal' || entry.optional || (index === 0 && entry.repeat && repeated)
		);

	return {
		pattern,
		steps,
		raw,
		looseRaw,
		cost: root.cost,
		drops: root.drops,
		end: { item, repeated },
		expansion,
		covered,
		complete
	};
};

/** A matcher Maskito can hold in a mask array: it reads a character as its slot would. */
const slotMatcher = (slot: Slot): RegExp => {
	const matcher = /[\s\S]/u;
	Object.defineProperty(matcher, Symbol.match, {
		value: (char: string) => (slot.accepts(char) ? [char] : null)
	});
	return matcher;
};

export type MaskEngineOptions = {
	mask: MaskedInputMask;
	tokens?: MaskedInputTokens;
	/** The character shown in empty slots. Defaults to `_`. */
	placeholderChar?: string;
};

export type MaskEngine = {
	/** The reading of a text against the pattern it fits. */
	read: (value: string) => MaskReading;
	/** The Maskito mask array for a text. */
	expression: (value: string) => MaskitoMaskExpression;
	/** Rewrites slot characters with their token's transform, keeping the length. */
	transform: (value: string) => string;
	/** What follows a clean text when the placeholder shows: empty slots and the separators between. */
	tail: (clean: string) => string;
	/** The masked text, raw characters and completeness of a clean text. */
	details: (clean: string) => MaskedInputValueDetails;
	/** True when every slot takes digits only, so a numeric keyboard fits. */
	numeric: boolean;
};

/** Builds the engine MaskedInput runs for one mask, token table and placeholder character. */
export const createMaskEngine = ({
	mask,
	tokens,
	placeholderChar = '_'
}: MaskEngineOptions): MaskEngine => {
	const table = compileTokens(tokens);
	const anyToken = (char: string) => [...table.values()].some((token) => token.accepts(char));
	const cache = new Map<string, CompiledMaskPattern>();
	const compile = (source: string) => {
		let compiled = cache.get(source);
		if (!compiled) {
			compiled = compilePattern(source, table);
			cache.set(source, compiled);
		}
		return compiled;
	};
	const filler = Array.from(placeholderChar)[0] ?? '_';
	const matchers = new WeakMap<Slot, RegExp>();
	const matcherFor = (slot: Slot) => {
		let matcher = matchers.get(slot);
		if (!matcher) {
			matcher = slotMatcher(slot);
			matchers.set(slot, matcher);
		}
		return matcher;
	};

	const readFunction = (value: string, fn: (raw: string) => string): MaskReading => {
		// The pattern depends on what was typed, which depends on the pattern: settle it in a few rounds.
		let source = fn('');
		let reading = readMaskPattern(value, compile(source), anyToken);
		for (let round = 0; round < 4; round += 1) {
			const next = fn(reading.looseRaw);
			if (next === source) break;
			source = next;
			reading = readMaskPattern(value, compile(source), anyToken);
		}
		return reading;
	};

	const read = (value: string): MaskReading => {
		if (typeof mask === 'function') return readFunction(value, mask);
		const sources: readonly string[] = typeof mask === 'string' ? [mask] : mask;
		const readings = (sources.length > 0 ? sources : ['']).map((source) =>
			readMaskPattern(value, compile(source), anyToken)
		);
		// The first pattern the text fits as typed, then the first it fits once separators of
		// another pattern are set aside, then the one that drops the fewest characters.
		return (
			readings.find((reading) => reading.drops === 0) ??
			readings.find((reading) => reading.cost === 0) ??
			readings.reduce((kept, reading) =>
				reading.cost < kept.cost || (reading.cost === kept.cost && reading.drops < kept.drops)
					? reading
					: kept
			)
		);
	};

	const numericSources =
		typeof mask === 'function' ? [mask('')] : typeof mask === 'string' ? [mask] : mask;
	const numeric =
		!tokens?.['#'] &&
		numericSources.every((source) =>
			compile(source).items.every((item) => item.kind === 'literal' || item.token === '#')
		) &&
		numericSources.some((source) => compile(source).items.some((item) => item.kind === 'slot'));

	return {
		read,
		numeric,
		expression: (value) =>
			read(value).expansion.map((item) => (item.kind === 'literal' ? item.char : matcherFor(item))),
		transform: (value) => {
			const reading = read(value);
			let index = 0;
			let output = '';
			const chars = Array.from(value);
			for (const step of reading.steps) {
				if (step.kind === 'slot') output += step.char;
				else if (step.kind === 'literal' && !step.auto) output += chars[index];
				else if (step.kind === 'drop') output += chars[index];
				else continue;
				index += 1;
			}
			return output;
		},
		tail: (clean) => {
			const reading = read(clean);
			return reading.expansion
				.slice(reading.covered)
				.map((item) => (item.kind === 'literal' ? item.char : filler))
				.join('');
		},
		details: (clean) => {
			const reading = read(clean);
			return { masked: clean, raw: reading.raw, complete: clean !== '' && reading.complete };
		}
	};
};

/**
 * What an agent reads about a masked field's value: the format, and that it may send the
 * characters alone. Form's WebMCP tool uses it.
 */
export const describeMaskForTool = (
	mask: MaskedInputMask | undefined,
	tokens: MaskedInputTokens | undefined = undefined
): string => {
	if (mask === undefined || typeof mask === 'function') {
		return 'Formatted as it is typed. Send the characters only; the field adds the separators.';
	}
	const patterns = (typeof mask === 'string' ? [mask] : [...mask]).map((source) =>
		JSON.stringify(source)
	);
	const custom = Object.keys(tokens ?? {}).filter((name) => !(name in MASKED_INPUT_TOKENS));
	return [
		`Format ${patterns.join(' or ')}: # is a digit, A a letter, * a letter or a digit${
			custom.length > 0 ? `, ${custom.join(', ')} app-defined characters` : ''
		}; ? marks an optional character and + one that repeats.`,
		'Send the characters only, or the formatted text; the field adds the separators.'
	].join(' ');
};
