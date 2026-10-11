/**
 * Locale-aware number text: digit normalization, parsing, formatting and commit rounding.
 *
 * Number entry (NumberInput, PinInput), range displays (Meter, Progress) and charts share these so
 * a value typed as `1 234,5`, `١٢٣٫٤` or `１２３` reads the same everywhere. Every function is pure
 * and SSR-safe; `Intl.NumberFormat` instances are cached by locale and options because building
 * one is far more expensive than formatting with it.
 */

/** Anything `Intl.NumberFormat` accepts as a locale. */
export type NumberLocale = Intl.LocalesArgument;

// NumberFormat v3 rounding options; the compiled `lib` may not declare them yet.
type NumberFormatOptions = Intl.NumberFormatOptions & {
	roundingIncrement?: number;
	roundingMode?: string;
	roundingPriority?: string;
};

const FORMATTER_CACHE_LIMIT = 256;
const formatterCache = new Map<string, Intl.NumberFormat>();

const localeKey = (locale: NumberLocale) => {
	if (locale === undefined) return '';
	return Array.isArray(locale) ? locale.map(String).join(',') : String(locale);
};

/**
 * A cached `Intl.NumberFormat` for `locale` and `options`. The cache is keyed by the locale string
 * and the serialized options, and keeps the most recent entries only.
 */
export const getNumberFormatter = (
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions
): Intl.NumberFormat => {
	const key = `${localeKey(locale)}|${options ? JSON.stringify(options) : ''}`;
	const cached = formatterCache.get(key);
	if (cached) return cached;
	const formatter = new Intl.NumberFormat(locale, options);
	if (formatterCache.size >= FORMATTER_CACHE_LIMIT) {
		formatterCache.delete(formatterCache.keys().next().value as string);
	}
	formatterCache.set(key, formatter);
	return formatter;
};

/** Formats `value` with the cached formatter; `null` and `undefined` format as `''`. */
export const formatNumber = (
	value: number | bigint | null | undefined,
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions
): string => (value == null ? '' : getNumberFormatter(locale, options).format(value));

// Zero code points of the decimal digit systems that are normalized, each followed by its nine
// other digits: Arabic-Indic, Extended Arabic-Indic (Persian, Urdu), Devanagari, Bengali, Thai
// and full-width.
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0e50, 0xff10];
// Han numerals in digit order; `零` is the formal zero.
const HAN_DIGITS = '〇一二三四五六七八九';
const HAN_ZERO = '零';

const digitRanges = DIGIT_ZEROS.map(
	(zero) =>
		`\\u${zero.toString(16).padStart(4, '0')}-\\u${(zero + 9).toString(16).padStart(4, '0')}`
).join('');
const NON_ASCII_DIGIT_RE = new RegExp(`[${digitRanges}${HAN_DIGITS}${HAN_ZERO}]`, 'gu');
const DIGIT_RE = new RegExp(`^[0-9${digitRanges}${HAN_DIGITS}${HAN_ZERO}]$`, 'u');
const ARABIC_SCRIPT_DIGIT_RE = /[\u0660-\u0669\u06f0-\u06f9]/u;
const HAN_DIGIT_RE = new RegExp(`[${HAN_DIGITS}${HAN_ZERO}]`, 'u');

const digitValue = (char: string) => {
	if (char === HAN_ZERO) return '0';
	const han = HAN_DIGITS.indexOf(char);
	if (han !== -1) return String(han);
	const code = char.charCodeAt(0);
	const zero = DIGIT_ZEROS.find((start) => code >= start && code <= start + 9);
	return zero === undefined ? char : String(code - zero);
};

/**
 * Replaces Arabic-Indic, Persian, Devanagari, Bengali, Thai, full-width and Han digits with ASCII
 * digits (`١٢٣` → `123`, `１２３` → `123`, `二〇二六` → `2026`). Han numerals are read digit by
 * digit, so positional characters such as `十` are left as they are.
 */
export const normalizeDigits = (text: string): string =>
	text.replace(NON_ASCII_DIGIT_RE, digitValue);

/** Whether `char` is a single digit in ASCII or any numeral system `normalizeDigits` reads. */
export const isDigitCharacter = (char: string): boolean => DIGIT_RE.test(char);

const FORMAT_CONTROL_RE = /\p{Cf}/gu;
const FORMAT_CONTROL_CHAR_RE = /^\p{Cf}$/u;

/**
 * Removes Unicode format controls (`\p{Cf}`): the left-to-right and right-to-left marks, the
 * Arabic letter mark and the isolates that right-to-left locales put around signs, currencies
 * and exponents, plus zero-width joiners.
 */
export const stripBidiMarks = (text: string): string => text.replace(FORMAT_CONTROL_RE, '');

/** Minus signs a user may type or paste: hyphen-minus, minus, full-width, dashes. */
export const MINUS_SIGNS = [
	'-',
	'\u2212',
	'\uff0d',
	'\u2012',
	'\u2013',
	'\u2014',
	'\ufe63'
] as const;
/** Plus signs a user may type or paste. */
export const PLUS_SIGNS = ['+', '\uff0b', '\ufe62'] as const;
/** Percent signs: ASCII, Arabic, full-width and small. */
export const PERCENT_SIGNS = ['%', '\u066a', '\uff05', '\ufe6a'] as const;
/** Per-mille signs: ASCII and Arabic. */
export const PERMILLE_SIGNS = ['\u2030', '\u0609'] as const;

// Separators every locale tolerates: ASCII and full-width period and comma, Arabic decimal and
// thousands separators.
const COMMON_SEPARATORS = ['.', ',', '\uff0e', '\uff0c', '\u066b', '\u066c'] as const;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const charClass = (chars: readonly string[]) =>
	new RegExp(`[${chars.map(escapeRegExp).join('')}]`, 'gu');

const MINUS_RE = charClass(MINUS_SIGNS);
const PLUS_RE = charClass(PLUS_SIGNS);
const PERCENT_RE = charClass(PERCENT_SIGNS);
const PERMILLE_RE = charClass(PERMILLE_SIGNS);
// Non-global twins for `.test()`, which would otherwise carry `lastIndex` between calls.
const PERCENT_TEST_RE = new RegExp(PERCENT_RE.source, 'u');
const PERMILLE_TEST_RE = new RegExp(PERMILLE_RE.source, 'u');
const SPACE_RE = /\p{Zs}/gu;
const SPACE_CHAR_RE = /^\p{Zs}$/u;
// Every space separator (`\p{Zs}`). The parser drops them all, so where a format renders a space
// the user may type or paste any of them: plain, no-break, narrow no-break, thin, figure…
const SPACE_SEPARATORS = [
	...' \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
];
// Both apostrophes group digits in Swiss locales; the parser reads either one.
const APOSTROPHES = ["'", '\u2019'];

/** The symbols a locale and format use around the digits. */
export type NumberSymbols = {
	/** Decimal separator of the locale, even for integer formats. */
	decimal: string;
	/** Grouping separator, when the format groups digits. */
	group?: string;
	/**
	 * Currency symbol, code or name, for currency formats: one entry per plural form of a name
	 * (`US dollar`, `US dollars`).
	 */
	currencies: string[];
	/** Unit labels (`km/h`, `°C`), one entry per plural form (`day`, `days`), for unit formats. */
	units: string[];
	/** Exponent separator (`E`), for scientific and engineering notation. */
	exponentSeparator?: string;
	/** Percent sign the format renders, if any. */
	percentSign?: string;
	/** Other literal text the format renders (spaces, parentheses). */
	literals: string[];
	/**
	 * Whole texts the format renders without digits, with the value each spells out: Arabic and
	 * Hebrew write one or two of a unit as the word alone (`يومان`, two days).
	 */
	spelledValues: ReadonlyMap<string, number>;
};

const SAMPLE_VALUE = -11111.1;
// One value in each plural category of every CLDR locale (zero, one, two, few, many and other,
// with and without fraction digits), so every plural form of a unit label or currency name is
// read: `1 day` and `2 days`, `1 litre` and `1,5 litre`, Arabic's dual and plural forms.
const PLURAL_SAMPLES = [0, 1, 2, 3, 5, 6, 7, 11, 21, 100, 1_000_000, 0.5, 1.5];

const formatSamples = (
	values: readonly number[],
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions
) => {
	const formatter = getNumberFormatter(locale, options);
	return values.flatMap((value) => formatter.formatToParts(value));
};

const addOnce = (list: string[], value: string) => {
	if (value !== '' && !list.includes(value)) list.push(value);
};

// How a whole text is compared with `spelledValues`: without bidi marks, with plain spaces.
const spelledKey = (text: string) => stripBidiMarks(text).replace(SPACE_RE, ' ').trim();

const symbolsCache = new Map<string, NumberSymbols>();

/**
 * The separators and decorations `locale` renders with `options`, read from `formatToParts`.
 * Cached like the formatters.
 */
export const getNumberSymbols = (
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions
): NumberSymbols => {
	const key = `${localeKey(locale)}|${options ? JSON.stringify(options) : ''}`;
	const cached = symbolsCache.get(key);
	if (cached) return cached;

	const spelledValues = new Map<string, number>();
	const formatter = getNumberFormatter(locale, options);
	const parts = [
		...[SAMPLE_VALUE, ...PLURAL_SAMPLES].flatMap((value) => {
			const valueParts = formatter.formatToParts(value);
			const text = spelledKey(valueParts.map((part) => part.value).join(''));
			if (!valueParts.some((part) => part.type === 'integer') && !spelledValues.has(text)) {
				spelledValues.set(text, value);
			}
			return valueParts;
		}),
		...formatSamples([-SAMPLE_VALUE], locale, { ...options, signDisplay: 'always' })
	];
	const symbols: NumberSymbols = {
		decimal: '.',
		currencies: [],
		units: [],
		literals: [],
		spelledValues
	};
	for (const part of parts) {
		// Parsed text loses its bidi marks first, so the decorations it is matched against do too.
		const value = stripBidiMarks(part.value);
		if (part.type === 'group') symbols.group = part.value;
		else if (part.type === 'currency') addOnce(symbols.currencies, value);
		else if (part.type === 'unit') addOnce(symbols.units, value);
		else if (part.type === 'exponentSeparator') symbols.exponentSeparator = part.value;
		else if (part.type === 'percentSign') symbols.percentSign = part.value;
		else if (part.type === 'literal') addOnce(symbols.literals, value);
	}
	// Integer formats render no decimal separator, but the locale still has one to type.
	for (const part of getNumberFormatter(locale).formatToParts(0.1)) {
		if (part.type === 'decimal') symbols.decimal = part.value;
	}
	if (symbolsCache.size >= FORMATTER_CACHE_LIMIT) {
		symbolsCache.delete(symbolsCache.keys().next().value as string);
	}
	symbolsCache.set(key, symbols);
	return symbols;
};

// Moves the decimal point without the binary error of multiplying or dividing by a power of ten.
const shiftDecimal = (value: number, exponentDelta: number) => {
	const [coefficient, exponent = '0'] = String(value).split('e');
	return Number(`${coefficient}e${Number(exponent) + exponentDelta}`);
};

const NUMBER_BODY_RE = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/;

/**
 * Parses number text written in `locale` with `options`, or returns `null` when the text is not a
 * complete number (`''`, `-`, `1e`, `abc`, `Infinity`).
 *
 * - Bidi marks are stripped and every supported numeral system reads as ASCII digits.
 * - Group separators are dropped; for space-grouping locales any space counts, so `1 234,5`
 *   typed with a plain space parses in `fr`.
 * - The locale's decimal separator, the full-width period and the Arabic decimal separator read as
 *   the decimal point. When several points remain, the last one is the decimal point.
 * - Currency symbols, unit labels (in every plural form) and literals of the format are ignored;
 *   Unicode minus signs, a trailing minus (`5-`) and accounting parentheses (`(5)`) read as
 *   negative. A plural form the format writes without digits (Arabic `يومان`, two days) reads as
 *   the value it spells out.
 * - Percent text (a percent sign, or `style: 'percent'`) is divided by 100, per-mille by 1000.
 *
 * Without a `locale`, Arabic-script digits read with `ar` separators and Han digits with `zh`.
 */
export const parseNumber = (
	text: string | null | undefined,
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions
): number | null => {
	if (text == null) return null;
	let input = stripBidiMarks(String(text)).trim();
	if (input === '' || /^[-+]?infinity$/i.test(input) || input.includes('∞')) return null;

	let negative = false;
	const accounting = /^\((.*)\)$/u.exec(input);
	if (accounting) {
		negative = true;
		input = accounting[1];
	}

	let computedLocale = locale;
	if (computedLocale === undefined) {
		if (ARABIC_SCRIPT_DIGIT_RE.test(input)) computedLocale = 'ar';
		else if (HAN_DIGIT_RE.test(input)) computedLocale = 'zh';
	}
	const symbols = getNumberSymbols(computedLocale, options);
	const spelled = symbols.spelledValues.get(spelledKey(input));
	if (spelled !== undefined) return negative ? -spelled : spelled;

	const hasPercent = PERCENT_TEST_RE.test(input);
	const hasPermille = PERMILLE_TEST_RE.test(input);

	// Decorations go first, so a currency symbol made of letters never reaches the number body.
	// Longest first, so `US dollars` goes whole rather than leaving the `s` of `US dollar`.
	const labels = [...symbols.currencies, ...symbols.units].sort((a, b) => b.length - a.length);
	for (const label of labels) input = input.split(label).join('');
	input = input.replace(PERCENT_RE, '').replace(PERMILLE_RE, '');
	for (const literal of symbols.literals) {
		if (/^[\p{Zs}()]*$/u.test(literal)) continue;
		input = input.split(literal).join('');
	}

	const group = symbols.group;
	if (group && !SPACE_CHAR_RE.test(group)) {
		const groupRe =
			group === "'" || group === '\u2019' ? /['\u2019]/g : new RegExp(escapeRegExp(group), 'g');
		input = input.replace(groupRe, '');
	}
	input = input.replace(SPACE_RE, '');
	if (symbols.decimal !== '.') input = input.split(symbols.decimal).join('.');
	input = input.replace(/[\uff0e\u066b]/g, '.').replace(/[\uff0c\u066c]/g, '');
	if (symbols.exponentSeparator) {
		input = input.split(symbols.exponentSeparator).join('e');
	}
	input = normalizeDigits(input).replace(/E/g, 'e').replace(MINUS_RE, '-').replace(PLUS_RE, '+');

	// One sign, leading or trailing.
	const sign = /^([+-])|([+-])$/.exec(input);
	if (sign) {
		if ((sign[1] ?? sign[2]) === '-') negative = !negative;
		input = sign[1] ? input.slice(1) : input.slice(0, -1);
	}

	const lastPoint = input.lastIndexOf('.');
	if (lastPoint !== -1) {
		input = `${input.slice(0, lastPoint).replace(/\./g, '')}.${input.slice(lastPoint + 1)}`;
	}
	if (!NUMBER_BODY_RE.test(input)) return null;

	let value = Number(input);
	if (negative) value = -value;

	const style = options?.style;
	const unitPercent = style === 'unit' && options?.unit === 'percent';
	if (hasPermille) value = shiftDecimal(value, -3);
	else if (!unitPercent && (hasPercent || style === 'percent')) value = shiftDecimal(value, -2);

	if (!Number.isFinite(value)) return null;
	// `-0` would format as "-0".
	return value === 0 ? 0 : value;
};

export type NumberCharacterOptions = {
	/** Accept minus signs. @default true */
	allowNegative?: boolean;
};

const allowedCache = new Map<string, ReadonlySet<string>>();

/**
 * The non-digit characters number text in `locale` and `options` may contain, read per character
 * from `formatToParts` of positive, negative and plural sample values: separators, currency and
 * unit characters in every plural form, signs, accounting parentheses, percent and per-mille
 * variants, every space separator when the format renders a space, and both apostrophes when it
 * groups with one. Digits of every supported numeral system are accepted separately by
 * `isNumberText`.
 */
export const getNumberCharacters = (
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions,
	{ allowNegative = true }: NumberCharacterOptions = {}
): ReadonlySet<string> => {
	const key = `${localeKey(locale)}|${options ? JSON.stringify(options) : ''}|${allowNegative}`;
	const cached = allowedCache.get(key);
	if (cached) return cached;

	const characters = new Set<string>(COMMON_SEPARATORS);
	// The negative sample brings what only negative text renders, such as accounting parentheses.
	const samples = [-SAMPLE_VALUE, ...PLURAL_SAMPLES, ...(allowNegative ? [SAMPLE_VALUE] : [])];
	for (const part of formatSamples(samples, locale, options)) {
		// Compact suffixes (`K`, `M`) cannot be parsed back, so they stay out.
		if (['integer', 'fraction', 'exponentInteger', 'compact', 'minusSign'].includes(part.type)) {
			continue;
		}
		for (const char of part.value) {
			characters.add(char);
			if (SPACE_CHAR_RE.test(char)) SPACE_SEPARATORS.forEach((space) => characters.add(space));
			if (APOSTROPHES.includes(char)) APOSTROPHES.forEach((mark) => characters.add(mark));
		}
	}
	characters.add(getNumberSymbols(locale, options).decimal);

	const style = options?.style;
	if (style === 'percent' || (style === 'unit' && options?.unit === 'percent')) {
		PERCENT_SIGNS.forEach((char) => characters.add(char));
	}
	if (style === 'percent' || (style === 'unit' && options?.unit === 'permille')) {
		PERMILLE_SIGNS.forEach((char) => characters.add(char));
	}
	PLUS_SIGNS.forEach((char) => characters.add(char));
	if (allowNegative) MINUS_SIGNS.forEach((char) => characters.add(char));
	else MINUS_SIGNS.forEach((char) => characters.delete(char));

	if (allowedCache.size >= FORMATTER_CACHE_LIMIT) {
		allowedCache.delete(allowedCache.keys().next().value as string);
	}
	allowedCache.set(key, characters);
	return characters;
};

/**
 * Whether every character of `text` can belong to number text in `locale`: a digit of a supported
 * numeral system, a character from `getNumberCharacters`, or a format control. Use it to reject a
 * keystroke or paste before parsing; partial text such as `-` or `1,` passes.
 */
export const isNumberText = (
	text: string,
	locale?: NumberLocale,
	options?: Intl.NumberFormatOptions,
	characterOptions?: NumberCharacterOptions
): boolean => {
	const allowed = getNumberCharacters(locale, options, characterOptions);
	for (const char of text) {
		if (!isDigitCharacter(char) && !allowed.has(char) && !FORMAT_CONTROL_CHAR_RE.test(char)) {
			return false;
		}
	}
	return true;
};

/** Whether `options` set any Intl rounding option. */
export const hasRoundingOptions = (options?: NumberFormatOptions): boolean =>
	options?.maximumFractionDigits != null ||
	options?.minimumFractionDigits != null ||
	options?.maximumSignificantDigits != null ||
	options?.minimumSignificantDigits != null ||
	options?.roundingIncrement != null ||
	options?.roundingMode != null ||
	options?.roundingPriority != null;

const MAX_FLOATING_POINT_CLEANUP = 1e-10;

/**
 * Removes binary floating-point noise from arithmetic results (`0.1 + 0.2` → `0.3`) without
 * discarding real precision: the value moves by at most one ulp-scaled epsilon, capped at 1e-10.
 */
export const cleanFloatingPoint = (value: number): number => {
	if (!Number.isFinite(value)) return value;
	const rounded = parseFloat(value.toPrecision(15));
	const tolerance = Math.min(
		Number.EPSILON * Math.max(1, Math.abs(value)),
		MAX_FLOATING_POINT_CLEANUP
	);
	return Math.abs(rounded - value) <= tolerance ? rounded : value;
};

/**
 * The value to commit for `value` displayed with `options`: rounded exactly as Intl rounds it for
 * display (`maximumFractionDigits`, significant digits, increments, rounding mode), so the committed
 * number matches the text the user sees after blur. Without rounding options the value is returned
 * as it is, keeping its full precision.
 */
export const roundToFormat = (value: number, options?: Intl.NumberFormatOptions): number => {
	if (!Number.isFinite(value) || !hasRoundingOptions(options)) return value;
	// Decorations that don't change the rounded number are neutralized, and the rounded digits are
	// read from the parts, so no unit label, currency name or sign style has to be parsed back.
	const formatter = getNumberFormatter('en-US', {
		...options,
		signDisplay: 'auto',
		currencySign: 'standard',
		notation: options?.notation === 'compact' ? 'standard' : options?.notation,
		numberingSystem: 'latn',
		useGrouping: false
	} as Intl.NumberFormatOptions);
	let text = '';
	for (const part of formatter.formatToParts(value)) {
		if (part.type === 'integer' || part.type === 'fraction' || part.type === 'exponentInteger') {
			text += part.value;
		} else if (part.type === 'decimal') text += '.';
		else if (part.type === 'minusSign' || part.type === 'exponentMinusSign') text += '-';
		else if (part.type === 'exponentSeparator') text += 'e';
	}
	let rounded = Number(text);
	if (options?.style === 'percent') rounded = shiftDecimal(rounded, -2);
	if (text === '' || !Number.isFinite(rounded)) return value;
	// `-0` would format as "-0".
	return rounded === 0 ? 0 : rounded;
};
