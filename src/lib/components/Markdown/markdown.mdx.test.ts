import { describe, expect, test } from 'vitest';
import { getMdxProps as publicGetMdxProps } from './index.js';
import { getMdxProps, type MarkdownMdxTag, type MdxAttributes } from './markdown.mdx.js';

const kept = (tag: MarkdownMdxTag, name: string, value: MdxAttributes[string]) =>
	getMdxProps(tag, { [name]: value })[name];

const SIZES = ['width', 'height', 'maxWidth', 'minHeight'] as const;

describe('sizes', () => {
	test.each(['Stack', 'Grid'] as const)('%s takes a number, a length or a percentage', (tag) => {
		for (const name of SIZES) {
			for (const value of [
				0,
				120,
				1.5,
				'12px',
				'1.5rem',
				'.5em',
				'100%',
				'100vw',
				'50dvh',
				'40CH',
				'30cqi'
			]) {
				expect(kept(tag, name, value), `${name}=${value}`).toBe(value);
			}
			expect(kept(tag, name, '120'), `${name}="120" reads as a number`).toBe(120);
		}
	});

	test.each(['Stack', 'Grid'] as const)('%s drops everything else', (tag) => {
		for (const name of SIZES) {
			for (const value of [
				'1px;background:url(https://example.test/x)',
				'1px;',
				';1px',
				'100vw;position:fixed',
				'calc(100% - 1px)',
				'var(--x)',
				'url(https://example.test/x)',
				'1px 2px',
				' 1px',
				'1px ',
				'1px\n',
				'1px/**/',
				'12foo',
				'-1px',
				'1e3px',
				'auto',
				'',
				-1,
				Number.POSITIVE_INFINITY,
				Number.NaN,
				true
			]) {
				expect(kept(tag, name, value), `${name}=${String(value)}`).toBeUndefined();
			}
		}
	});
});

describe('names', () => {
	test.each([
		['Stack', 'wrap', ['nowrap', 'wrap', 'wrap-reverse']],
		['Stack', 'orientation', ['horizontal', 'vertical']],
		['Stack', 'align', ['start', 'center', 'end', 'stretch']],
		['Stack', 'justify', ['start', 'center', 'end', 'between', 'around', 'evenly']],
		['Stack', 'gap', ['none', 'xs', 'sm', 'md', 'lg', 'xl']],
		['Stack', 'padding', ['none', 'xs', 'sm', 'md', 'lg', 'xl']],
		['Stack', 'paddingInline', ['none', 'xs', 'sm', 'md', 'lg', 'xl']],
		['Stack', 'paddingBlock', ['none', 'xs', 'sm', 'md', 'lg', 'xl']],
		['Grid', 'gap', ['none', 'xs', 'sm', 'md', 'lg', 'xl']],
		['Grid', 'rowGap', ['none', 'xl']],
		['Grid', 'columnGap', ['none', 'xl']],
		['Grid', 'align', ['start', 'center', 'end', 'stretch']],
		['Grid', 'justify', ['start', 'center', 'end', 'stretch']],
		['Card', 'color', ['primary', 'secondary', 'danger', 'success', 'warning', 'info', 'neutral']],
		['Card', 'variant', ['solid', 'outline', 'soft', 'ghost']],
		['Card', 'size', ['small', 'normal', 'large']],
		['Card', 'density', ['compact', 'normal', 'comfortable']],
		['Stat', 'color', ['primary', 'neutral']],
		['Stat', 'indicatorColor', ['danger', 'neutral']],
		['Stat', 'variant', ['solid', 'outline', 'soft', 'ghost']],
		['Stat', 'indicatorVariant', ['default', 'icon', 'badge']],
		['Stat', 'trendDirection', ['up', 'down', 'neutral']],
		['Stat', 'size', ['small', 'normal', 'large']],
		['Stat', 'density', ['compact', 'normal', 'comfortable']]
	] as const)('%s %s takes its closed list and nothing else', (tag, name, values) => {
		for (const value of values) expect(kept(tag, name, value), value).toBe(value);
		for (const value of [
			'nowrap;background:url(https://example.test/x)',
			'constructor',
			'__proto__',
			'toString',
			'hasOwnProperty',
			'WRAP',
			'',
			1,
			true
		]) {
			expect(kept(tag, name, value), String(value)).toBeUndefined();
		}
	});

	test('`as` still only takes containers', () => {
		expect(kept('Stack', 'as', 'section')).toBe('section');
		for (const value of ['a', 'iframe', 'form', 'fieldset', 'constructor', 'SECTION', 1, true]) {
			expect(kept('Stack', 'as', value), String(value)).toBeUndefined();
		}
	});
});

describe('numbers', () => {
	test('Grid columns are a positive whole number', () => {
		expect(kept('Grid', 'columns', 3)).toBe(3);
		expect(kept('Grid', 'columns', '3')).toBe(3);
		for (const value of [0, -1, 1.5, '1.5', 'full', '3;x:y', true]) {
			expect(kept('Grid', 'columns', value), String(value)).toBeUndefined();
		}
	});

	test('GridSpan columns are a positive whole number or `full`, its rows only a number', () => {
		expect(kept('GridSpan', 'columns', 2)).toBe(2);
		expect(kept('GridSpan', 'columns', 'full')).toBe('full');
		expect(kept('GridSpan', 'rows', 2)).toBe(2);
		expect(kept('GridSpan', 'rows', 'full')).toBeUndefined();
		expect(kept('GridSpan', 'columns', 'full;x:y')).toBeUndefined();
	});

	test('Grid rowHeight is a number of pixels', () => {
		expect(kept('Grid', 'rowHeight', 40)).toBe(40);
		expect(kept('Grid', 'rowHeight', '40')).toBe(40);
		for (const value of [-1, '40px', '40;x:y', true]) {
			expect(kept('Grid', 'rowHeight', value), String(value)).toBeUndefined();
		}
	});

	test('Card elevation is one of its five steps', () => {
		expect(kept('Card', 'elevation', 5)).toBe(5);
		expect(kept('Card', 'elevation', '2')).toBe(2);
		for (const value of [0, 6, 1.5, '6', 'high', true]) {
			expect(kept('Card', 'elevation', value), String(value)).toBeUndefined();
		}
	});
});

describe('switches', () => {
	test.each([
		['Stack', 'scrollable'],
		['Card', 'showBorders']
	] as const)('%s %s is a boolean', (tag, name) => {
		expect(kept(tag, name, true)).toBe(true);
		expect(kept(tag, name, false)).toBe(false);
		expect(kept(tag, name, 'true')).toBe(true);
		// A string would be truthy: `="false"` must not turn it on.
		expect(kept(tag, name, 'false')).toBe(false);
		for (const value of ['yes', '', 1]) {
			expect(kept(tag, name, value), String(value)).toBeUndefined();
		}
	});
});

describe('text', () => {
	test.each([
		['Stack', 'aria-label'],
		['Card', 'title'],
		['Card', 'description'],
		['Stat', 'label'],
		['Stat', 'value'],
		['Stat', 'unit'],
		['Stat', 'description'],
		['Stat', 'trend']
	] as const)('%s %s stays text', (tag, name) => {
		expect(kept(tag, name, 'a;b:c')).toBe('a;b:c');
		// A slot calls anything that is not a string: a number or a boolean would throw.
		expect(kept(tag, name, 42)).toBe('42');
		expect(kept(tag, name, 0)).toBe('0');
		expect(kept(tag, name, true)).toBeUndefined();
		expect(kept(tag, name, false)).toBeUndefined();
	});
});

describe('names outside the list', () => {
	test('are dropped, including what sits on every object', () => {
		const attributes = JSON.parse(
			'{"__proto__":"x","constructor":"x","toString":"x","style":"x","STYLE":"x","class":"x","WIDTH":"1px"}'
		) as MdxAttributes;
		const props = getMdxProps('Stack', attributes);
		expect(Object.keys(props)).toEqual([]);
		expect(Object.getPrototypeOf(props)).toBe(Object.prototype);
	});

	test('null and undefined never pass', () => {
		expect(getMdxProps('Stack', { width: null, height: undefined })).toEqual({});
	});
});

test('the rules are public, for an override in mdxComponents', () => {
	expect(publicGetMdxProps).toBe(getMdxProps);
});
