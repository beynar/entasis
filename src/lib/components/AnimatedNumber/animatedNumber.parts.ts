/**
 * A formatted number cut into the pieces AnimatedNumber animates: one per digit and one per
 * symbol, each with a key that says which piece of the previous number it continues.
 *
 * The keying is NumberFlow's (github.com/barvian/number-flow, Copyright (c) 2024 Maxwell Barvian,
 * MIT): integer digits and their group separators are counted from the decimal point outwards,
 * so the units stay the units when the number gains or loses a digit, and fraction digits are
 * counted from the decimal point too.
 */
import { getNumberFormatter } from '$lib/utils/number.js';

export type AnimatedNumberValue = number | bigint;

/** The four runs of a number: what is before it, its integer part, its fraction, what follows. */
export type AnimatedNumberSectionName = 'pre' | 'integer' | 'fraction' | 'post';

export const ANIMATED_NUMBER_SECTIONS: readonly AnimatedNumberSectionName[] = [
	'pre',
	'integer',
	'fraction',
	'post'
];

export type AnimatedNumberDigit = {
	kind: 'digit';
	key: string;
	type: 'integer' | 'fraction';
	/** Which of the ten digits, whatever the numbering system writes it as. */
	value: number;
	/** The power of ten it counts: 0 for the units, 1 for the tens, -1 for the tenths. */
	pos: number;
};

export type AnimatedNumberSymbol = {
	kind: 'symbol';
	key: string;
	/** The `Intl.NumberFormat` part type, with both signs as `sign`, or `prefix` and `suffix`. */
	type: string;
	value: string;
};

export type AnimatedNumberPart = AnimatedNumberDigit | AnimatedNumberSymbol;

export type AnimatedNumberParts = Record<AnimatedNumberSectionName, AnimatedNumberPart[]> & {
	/** The whole text, as a person reads it. */
	text: string;
	value: AnimatedNumberValue;
	/** The ten digits of the numbering system, in order. */
	glyphs: readonly string[];
	/** Whether the locale is written from right to left. */
	rtl: boolean;
	/** Equal for two results that draw the same thing. */
	signature: string;
};

const LATIN_GLYPHS: readonly string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

type FormatterFacts = { glyphs: readonly string[]; index: Map<string, number>; rtl: boolean };
const factsCache = new WeakMap<Intl.NumberFormat, FormatterFacts>();

const RTL_SCRIPTS = new Set([
	'Adlm',
	'Arab',
	'Hebr',
	'Mand',
	'Nkoo',
	'Rohg',
	'Samr',
	'Syrc',
	'Thaa'
]);

/** Whether `locale` is written from right to left, by the script it is most likely written in. */
export const isRightToLeftLocale = (locale: string): boolean => {
	try {
		const script = new Intl.Locale(locale).maximize().script;
		return script !== undefined && RTL_SCRIPTS.has(script);
	} catch {
		return false;
	}
};

const formatterFacts = (formatter: Intl.NumberFormat): FormatterFacts => {
	const cached = factsCache.get(formatter);
	if (cached) return cached;
	const { locale, numberingSystem } = formatter.resolvedOptions();
	// The ten digits as this numbering system writes them, read off a number that has them all.
	let glyphs = LATIN_GLYPHS;
	try {
		const written = Array.from(
			getNumberFormatter(locale, { numberingSystem, useGrouping: false }).format(9876543210)
		).reverse();
		if (written.length === 10 && new Set(written).size === 10) glyphs = written;
	} catch {
		// An unknown numbering system: the Latin digits.
	}
	const facts = {
		glyphs,
		index: new Map(glyphs.map((glyph, digit) => [glyph, digit])),
		rtl: isRightToLeftLocale(locale)
	};
	factsCache.set(formatter, facts);
	return facts;
};

/**
 * Cuts `value`, as `formatter` writes it, into keyed digits and symbols. `prefix` and `suffix`
 * are symbols of their own at either end.
 */
export const toAnimatedNumberParts = (
	value: AnimatedNumberValue,
	formatter: Intl.NumberFormat,
	prefix?: string,
	suffix?: string
): AnimatedNumberParts => {
	const { glyphs, index, rtl } = formatterFacts(formatter);
	const written: Array<{ type: string; value: string }> = formatter.formatToParts(value);
	if (prefix) written.unshift({ type: 'prefix', value: prefix });
	if (suffix) written.push({ type: 'suffix', value: suffix });

	const counts = new Map<string, number>();
	const keyOf = (type: string) => {
		const count = counts.get(type) ?? 0;
		counts.set(type, count + 1);
		return `${type}:${count}`;
	};

	const pre: AnimatedNumberPart[] = [];
	const fraction: AnimatedNumberPart[] = [];
	const post: AnimatedNumberPart[] = [];
	// Keyed in a second pass, from the decimal point outwards.
	const integerRun: Array<{ type: 'integer' | 'group' | 'literal'; value: string; digit: number }> =
		[];

	let text = '';
	let inNumber = false;
	for (const part of written) {
		text += part.value;
		const type = part.type === 'minusSign' || part.type === 'plusSign' ? 'sign' : part.type;
		if (type === 'integer') {
			inNumber = true;
			for (const glyph of Array.from(part.value)) {
				const digit = index.get(glyph);
				integerRun.push(
					digit === undefined
						? { type: 'literal', value: glyph, digit: -1 }
						: { type: 'integer', value: glyph, digit }
				);
			}
		} else if (type === 'group') {
			integerRun.push({ type: 'group', value: part.value, digit: -1 });
		} else if (type === 'decimal') {
			inNumber = true;
			fraction.push({ kind: 'symbol', key: keyOf(type), type, value: part.value });
		} else if (type === 'fraction') {
			for (const glyph of Array.from(part.value)) {
				const digit = index.get(glyph);
				if (digit === undefined) {
					fraction.push({ kind: 'symbol', key: keyOf('literal'), type: 'literal', value: glyph });
				} else {
					const key = keyOf(type);
					fraction.push({ kind: 'digit', key, type, value: digit, pos: -counts.get(type)! });
				}
			}
		} else {
			(inNumber ? post : pre).push({
				kind: 'symbol',
				key: keyOf(type),
				type,
				value: part.value
			});
		}
	}

	const integer: AnimatedNumberPart[] = [];
	for (let i = integerRun.length - 1; i >= 0; i--) {
		const item = integerRun[i];
		const key = keyOf(item.type);
		integer.unshift(
			item.type === 'integer'
				? {
						kind: 'digit',
						key,
						type: 'integer',
						value: item.digit,
						pos: counts.get('integer')! - 1
					}
				: { kind: 'symbol', key, type: item.type, value: item.value }
		);
	}

	const sections = { pre, integer, fraction, post };
	const signature = `${rtl ? 'r' : 'l'}${glyphs[0]}|${ANIMATED_NUMBER_SECTIONS.map((name) =>
		sections[name].map((part) => `${part.key}=${part.value}`).join('\u0001')
	).join('\u0002')}`;

	return { ...sections, text, value, glyphs, rtl, signature };
};

/** The direction digits travel: 1 upwards, -1 downwards, 0 each its own nearest way. */
export type AnimatedNumberDirection = -1 | 0 | 1;

export type AnimatedNumberTrend = 'auto' | 'up' | 'down' | 'nearest';

/** The direction of a change from `previous` to `value` under `trend`. */
export const resolveTrend = (
	trend: AnimatedNumberTrend,
	previous: AnimatedNumberValue,
	value: AnimatedNumberValue
): AnimatedNumberDirection => {
	if (trend === 'up') return 1;
	if (trend === 'down') return -1;
	if (trend === 'nearest') return 0;
	return value > previous ? 1 : value < previous ? -1 : 0;
};

/**
 * How many steps a digit wheel turns to go from `previous` to `value`, with its sign: under an
 * upward direction a wheel never turns back, so 9 to 0 is one step up and not nine down. With
 * `loop`, a digit that stays the same makes one whole turn.
 */
export const digitDelta = (
	value: number,
	previous: number,
	direction: AnimatedNumberDirection,
	loop = false
): number => {
	const difference = value - previous;
	if (!difference) return loop ? 10 * direction : 0;
	const way = direction || Math.sign(difference);
	if (way < 0 && value > previous) return value - 10 - previous;
	if (way > 0 && value < previous) return 10 - previous + value;
	return difference;
};

const digitsOf = (parts: AnimatedNumberParts) =>
	[...parts.integer, ...parts.fraction].filter(
		(part): part is AnimatedNumberDigit => part.kind === 'digit'
	);

/**
 * For a change that reads as passing through every number in between: the highest position that
 * changed. Every digit under it turns, even one that lands back where it was. `undefined` when
 * nothing changed.
 */
export const continuousStart = (
	previous: AnimatedNumberParts,
	next: AnimatedNumberParts
): number | undefined => {
	const before = digitsOf(previous);
	const after = digitsOf(next);
	const same = (list: AnimatedNumberDigit[], digit: AnimatedNumberDigit) =>
		list.some((other) => other.pos === digit.pos && other.value === digit.value);
	const changedBefore = before.find((digit) => !same(after, digit));
	const changedAfter = after.find((digit) => !same(before, digit));
	if (!changedBefore && !changedAfter) return undefined;
	return Math.max(changedBefore?.pos ?? -Infinity, changedAfter?.pos ?? -Infinity);
};
