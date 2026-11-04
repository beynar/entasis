// What a tag in Markdown text may say to a built-in component. That text is often not the app's: a
// model's message can repeat a row, an email or a web page. So this is a list of what gets through,
// not of what is refused, and a new attribute is out until it is added here: the props are spread
// onto real elements, where `HREF`, `ONCLICK`, `SRCDOC` or `STYLE` all mean something to the browser.
//
// Only strings, numbers and booleans can be written in a tag, so props taking a snippet, a function
// or an array stay out too, as does anything that names a URL.
import type { CardProps } from '../Card/card.props.js';
import type { GridProps, GridSpanProps } from '../Grid/index.js';
import type { StackElement, StackProps } from '../Stack/stack.props.js';
import type { StatProps } from '../Stat/stat.props.js';

/** The tags Markdown draws with entasis components. */
export type MarkdownMdxTag = 'Card' | 'Grid' | 'GridSpan' | 'Stack' | 'Stat';

/** The attributes of a tag, as the parser read them. */
export type MdxAttributes = Record<string, string | number | boolean | null | undefined>;

const allow = <Props>(names: readonly (keyof Props & string)[]) => new Set<string>(names);

const ALLOWED: Record<MarkdownMdxTag, ReadonlySet<string>> = {
	Stack: allow<StackProps>([
		'as',
		'orientation',
		'align',
		'justify',
		'gap',
		'padding',
		'paddingInline',
		'paddingBlock',
		'wrap',
		'scrollable',
		'width',
		'height',
		'maxWidth',
		'minHeight',
		'aria-label'
	]),
	Grid: allow<GridProps>([
		'columns',
		'gap',
		'rowGap',
		'columnGap',
		'rowHeight',
		'align',
		'justify',
		'width',
		'height',
		'maxWidth',
		'minHeight'
	]),
	GridSpan: allow<GridSpanProps>(['columns', 'rows']),
	Card: allow<CardProps>([
		'title',
		'description',
		'color',
		'variant',
		'elevation',
		'size',
		'density',
		'showBorders'
	]),
	Stat: allow<StatProps>([
		'label',
		'value',
		'unit',
		'description',
		'trend',
		'trendDirection',
		'indicatorVariant',
		'indicatorColor',
		'color',
		'variant',
		'size',
		'density'
	])
};

// Containers that only hold what is in them. `form` and `fieldset` are valid for a Stack, but not
// from text: a form can post what the user types to wherever its text says.
const PASSIVE_ELEMENTS: ReadonlySet<string> = new Set<StackElement>([
	'div',
	'span',
	'section',
	'article',
	'aside',
	'main',
	'nav',
	'header',
	'footer'
]);

/** Keeps what a tag may say to its built-in component, and drops everything else. */
export const getMdxProps = (tag: MarkdownMdxTag, attributes: MdxAttributes): MdxAttributes => {
	const allowed = ALLOWED[tag];
	const props: MdxAttributes = {};
	for (const name of Object.keys(attributes)) {
		const value = attributes[name];
		if (!allowed.has(name)) continue;
		if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
			continue;
		}
		if (name === 'as' && !PASSIVE_ELEMENTS.has(String(value))) continue;
		props[name] = value;
	}
	return props;
};
