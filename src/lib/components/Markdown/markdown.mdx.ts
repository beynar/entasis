// What a tag in Markdown text may say to a built-in component. That text is often not the app's: a
// model's message can repeat a row, an email or a web page. So this is a list of what gets through,
// not of what is refused, and a new attribute is out until it is added here: the props are spread
// onto real elements, where `HREF`, `ONCLICK`, `SRCDOC` or `STYLE` all mean something to the browser.
//
// Only strings, numbers and booleans can be written in a tag, so props taking a snippet, a function
// or an array stay out too, as does anything that names a URL.
//
// A name on the list is not enough: components write some of these values into `style` as they are,
// so each name has a rule for the values its component can take, and any other value is dropped.
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { CardProps, CardVariant } from '../Card/card.props.js';
import type { GridAlignment, GridProps } from '../Grid/grid.props.js';
import type { GridSpanProps } from '../Grid/index.js';
import type { LayoutSpacing } from '../Layout/layoutSpacing.js';
import type {
	StackAlign,
	StackElement,
	StackJustify,
	StackOrientation,
	StackProps,
	StackWrap
} from '../Stack/stack.props.js';
import type {
	StatIndicatorVariant,
	StatProps,
	StatTrendDirection,
	StatVariant
} from '../Stat/stat.props.js';

/** The tags Markdown draws with entasis components. */
export type MarkdownMdxTag = 'Card' | 'Grid' | 'GridSpan' | 'Stack' | 'Stat';

/** The attributes of a tag, as the parser read them. */
export type MdxAttributes = Record<string, string | number | boolean | null | undefined>;

type MdxValue = string | number | boolean;
// Answers with the value its component should receive, or undefined to drop it.
type MdxRule = (value: MdxValue) => MdxValue | undefined;

// `Record` rather than an array so that a value added to one of these types fails to compile here,
// and `Object.hasOwn` so that `constructor` or `__proto__` are not names.
const oneOf =
	<Name extends string>(names: Record<Name, true>): MdxRule =>
	(value) =>
		typeof value === 'string' && Object.hasOwn(names, value) ? value : undefined;

const toNumber = (value: MdxValue) => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
	return typeof value === 'string' && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)
		? Number(value)
		: undefined;
};

const wholeNumber =
	(min: number, max = Number.MAX_SAFE_INTEGER): MdxRule =>
	(value) => {
		const number = toNumber(value);
		return number !== undefined && Number.isInteger(number) && number >= min && number <= max
			? number
			: undefined;
	};

const pixels: MdxRule = (value) => {
	const number = toNumber(value);
	return number !== undefined && number >= 0 ? number : undefined;
};

// One length or percentage, whole: Svelte joins these into one `style` string, where a `;` would
// start a declaration of the text's choosing. `calc()`, `var()` and `url()` stay out with the `(`.
const CSS_LENGTH =
	/^(?:\d+(?:\.\d+)?|\.\d+)(?:%|px|r?em|ex|ch|cap|ic|r?lh|cm|mm|q|in|pt|pc|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max))$/i;

const size: MdxRule = (value) =>
	pixels(value) ?? (typeof value === 'string' && CSS_LENGTH.test(value) ? value : undefined);

// A string would be truthy, so `="false"` has to become the boolean.
const flag: MdxRule = (value) => {
	if (typeof value === 'boolean') return value;
	return value === 'true' ? true : value === 'false' ? false : undefined;
};

// Drawn as text, where nothing in it means anything. A slot calls whatever is not a string, so a
// number has to become one and a boolean has nothing to say.
const text: MdxRule = (value) => {
	if (typeof value === 'string') return value;
	return typeof value === 'number' ? String(value) : undefined;
};

const rules = <Props>(table: { readonly [Name in keyof Props & string]?: MdxRule }) =>
	table as Readonly<Record<string, MdxRule>>;

const spacing = oneOf<LayoutSpacing>({
	none: true,
	xs: true,
	sm: true,
	md: true,
	lg: true,
	xl: true
});
const color = oneOf<Colors>({
	primary: true,
	secondary: true,
	danger: true,
	success: true,
	warning: true,
	info: true,
	neutral: true
});
const componentSize = oneOf<Sizes>({ small: true, normal: true, large: true });
const density = oneOf<Density>({ compact: true, normal: true, comfortable: true });
const surface = oneOf<CardVariant & StatVariant>({
	solid: true,
	outline: true,
	soft: true,
	ghost: true
});
const gridAlignment = oneOf<GridAlignment>({ start: true, center: true, end: true, stretch: true });
const SIZE_PROPS = { width: size, height: size, maxWidth: size, minHeight: size };

const RULES: Record<MarkdownMdxTag, Readonly<Record<string, MdxRule>>> = {
	Stack: rules<StackProps>({
		// `form` and `fieldset` are valid for a Stack, but not from text: a form can post what the
		// user types to wherever its text says. These are containers that only hold what is in them.
		as: oneOf<Exclude<StackElement, 'form' | 'fieldset'>>({
			div: true,
			span: true,
			section: true,
			article: true,
			aside: true,
			main: true,
			nav: true,
			header: true,
			footer: true
		}),
		orientation: oneOf<StackOrientation>({ horizontal: true, vertical: true }),
		align: oneOf<StackAlign>({ start: true, center: true, end: true, stretch: true }),
		justify: oneOf<StackJustify>({
			start: true,
			center: true,
			end: true,
			between: true,
			around: true,
			evenly: true
		}),
		gap: spacing,
		padding: spacing,
		paddingInline: spacing,
		paddingBlock: spacing,
		wrap: oneOf<StackWrap>({ nowrap: true, wrap: true, 'wrap-reverse': true }),
		scrollable: flag,
		...SIZE_PROPS,
		'aria-label': text
	}),
	Grid: rules<GridProps>({
		columns: wholeNumber(1),
		gap: spacing,
		rowGap: spacing,
		columnGap: spacing,
		rowHeight: pixels,
		align: gridAlignment,
		justify: gridAlignment,
		...SIZE_PROPS
	}),
	GridSpan: rules<GridSpanProps>({
		columns: (value) => (value === 'full' ? value : wholeNumber(1)(value)),
		rows: wholeNumber(1)
	}),
	Card: rules<CardProps>({
		title: text,
		description: text,
		color,
		variant: surface,
		elevation: wholeNumber(1, 5),
		size: componentSize,
		density,
		showBorders: flag
	}),
	Stat: rules<StatProps>({
		label: text,
		value: text,
		unit: text,
		description: text,
		trend: text,
		trendDirection: oneOf<StatTrendDirection>({ up: true, down: true, neutral: true }),
		indicatorVariant: oneOf<StatIndicatorVariant>({ default: true, icon: true, badge: true }),
		indicatorColor: color,
		color,
		variant: surface,
		size: componentSize,
		density
	})
};

/** The attributes a tag can say anything about. */
export const mdxAttributeNames = (tag: MarkdownMdxTag): string[] => Object.keys(RULES[tag]);

/** Keeps what a tag may say to its built-in component, and drops everything else. */
export const getMdxProps = (tag: MarkdownMdxTag, attributes: MdxAttributes): MdxAttributes => {
	const tagRules = RULES[tag];
	const props: MdxAttributes = {};
	for (const name of Object.keys(attributes)) {
		const value = attributes[name];
		if (!Object.hasOwn(tagRules, name) || value === null || value === undefined) continue;
		const kept = tagRules[name](value);
		if (kept !== undefined) props[name] = kept;
	}
	return props;
};
