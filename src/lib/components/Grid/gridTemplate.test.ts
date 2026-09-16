import { describe, expect, test } from 'vitest';
import { breakpoints } from '../Theme/responsive.js';
import {
	getGridSpanVariables,
	getGridTemplate,
	getGridVariables,
	toInlineVariables
} from './gridTemplate.js';

const columnsAt = (variables: Record<string, string>) =>
	breakpoints.map((breakpoint) => variables[`--grid-columns-${breakpoint}`]);
const gapsAt = (variables: Record<string, string>) =>
	breakpoints.map((breakpoint) => variables[`--grid-gap-${breakpoint}`]);

describe('getGridTemplate', () => {
	test('counts become equal tracks and one column stays a single fraction', () => {
		expect(getGridTemplate(1, 'none')).toBe('1fr');
		expect(getGridTemplate(3, 'none')).toBe('repeat(3, minmax(0, 1fr))');
	});

	test('non-positive and fractional counts fall back the way they always did', () => {
		expect(getGridTemplate(0, 'none')).toBe('1fr');
		expect(getGridTemplate(-2, 'none')).toBe('1fr');
		expect(getGridTemplate(2.7, 'none')).toBe('repeat(2, minmax(0, 1fr))');
	});

	test('a minimum width auto-fills, and repeat: fit collapses empty tracks', () => {
		expect(getGridTemplate({ minWidth: 240 }, 'none')).toBe(
			'repeat(auto-fill, minmax(min(100%, 240px), 1fr))'
		);
		expect(getGridTemplate({ minWidth: 240, repeat: 'fit' }, 'none')).toBe(
			'repeat(auto-fit, minmax(min(100%, 240px), 1fr))'
		);
	});

	test('a max count subtracts that breakpoint gap from the row it divides', () => {
		expect(getGridTemplate({ minWidth: 220, max: 4 }, 'none')).toBe(
			'repeat(auto-fill, minmax(min(100%, max(220px, calc(100% / 4))), 1fr))'
		);
		expect(getGridTemplate({ minWidth: 220, max: 4 }, 'lg')).toBe(
			'repeat(auto-fill, minmax(min(100%, max(220px, calc((100% - 3 * var(--space-lg)) / 4))), 1fr))'
		);
	});
});

describe('getGridVariables', () => {
	test('a plain value renders one template at every breakpoint', () => {
		expect(columnsAt(getGridVariables({ columns: 3, gap: 'lg' }))).toEqual(
			Array(5).fill('repeat(3, minmax(0, 1fr))')
		);
	});

	test('a record cascades to the nearest defined key at or below each breakpoint', () => {
		expect(columnsAt(getGridVariables({ columns: { sm: 2, lg: 4 } }))).toEqual([
			'1fr',
			'repeat(2, minmax(0, 1fr))',
			'repeat(2, minmax(0, 1fr))',
			'repeat(4, minmax(0, 1fr))',
			'repeat(4, minmax(0, 1fr))'
		]);
	});

	test('the component default fills the steps below the narrowest key', () => {
		expect(getGridVariables({ columns: { xl: 6 } })['--grid-columns-lg']).toBe('1fr');
	});

	test('the auto-fit object is a value, not a breakpoint record', () => {
		expect(columnsAt(getGridVariables({ columns: { minWidth: 240, repeat: 'fit' } }))).toEqual(
			Array(5).fill('repeat(auto-fit, minmax(min(100%, 240px), 1fr))')
		);
	});

	test('a record of auto-fit objects steps between them', () => {
		const variables = getGridVariables({
			columns: { xs: { minWidth: 160 }, lg: { minWidth: 320 } }
		});
		expect(variables['--grid-columns-md']).toBe('repeat(auto-fill, minmax(min(100%, 160px), 1fr))');
		expect(variables['--grid-columns-xl']).toBe('repeat(auto-fill, minmax(min(100%, 320px), 1fr))');
	});

	test('a record is flattened once per breakpoint', () => {
		const variables = getGridVariables({ columns: { xs: 1, sm: 2 } });
		expect(columnsAt(variables)).toEqual(['1fr', ...Array(4).fill('repeat(2, minmax(0, 1fr))')]);
	});

	test('gap carries both axes, row first', () => {
		expect(gapsAt(getGridVariables({ gap: 'md' }))).toEqual(
			Array(5).fill('var(--space-md) var(--space-md)')
		);
		expect(getGridVariables({ gap: 'md', rowGap: 'xs' })['--grid-gap-xs']).toBe(
			'var(--space-xs) var(--space-md)'
		);
		expect(getGridVariables({ gap: 'md', columnGap: 'xl' })['--grid-gap-xs']).toBe(
			'var(--space-md) var(--space-xl)'
		);
	});

	test('an axis gap falls back to the gap resolved at that same breakpoint', () => {
		expect(gapsAt(getGridVariables({ gap: 'sm', columnGap: { lg: 'xl' } }))).toEqual([
			'var(--space-sm) var(--space-sm)',
			'var(--space-sm) var(--space-sm)',
			'var(--space-sm) var(--space-sm)',
			'var(--space-sm) var(--space-xl)',
			'var(--space-sm) var(--space-xl)'
		]);
	});

	test('a capped template uses the column gap of its own breakpoint', () => {
		const variables = getGridVariables({
			columns: { minWidth: 220, max: 4 },
			gap: { xs: 'none', lg: 'lg' }
		});
		expect(variables['--grid-columns-xs']).toContain('calc(100% / 4)');
		expect(variables['--grid-columns-xl']).toContain('calc((100% - 3 * var(--space-lg)) / 4)');
	});

	test('nothing at all is a single column with no gap', () => {
		expect(getGridVariables({})).toEqual({
			'--grid-columns-xs': '1fr',
			'--grid-columns-sm': '1fr',
			'--grid-columns-md': '1fr',
			'--grid-columns-lg': '1fr',
			'--grid-columns-xl': '1fr',
			'--grid-gap-xs': '0px 0px',
			'--grid-gap-sm': '0px 0px',
			'--grid-gap-md': '0px 0px',
			'--grid-gap-lg': '0px 0px',
			'--grid-gap-xl': '0px 0px'
		});
	});
});

describe('getGridSpanVariables', () => {
	test('an unset axis is the CSS initial, so the always-present chain invents no span', () => {
		const variables = getGridSpanVariables({});
		expect(Object.values(variables)).toEqual(Array(10).fill('auto'));
	});

	test('a count spans, and full covers the whole row', () => {
		expect(getGridSpanVariables({ columns: 2, rows: 3 })['--grid-span-columns-md']).toBe('span 2');
		expect(getGridSpanVariables({ columns: 2, rows: 3 })['--grid-span-rows-md']).toBe('span 3');
		expect(getGridSpanVariables({ columns: 'full' })['--grid-span-columns-md']).toBe('1 / -1');
	});

	test('non-positive spans resolve to auto rather than an invalid declaration', () => {
		expect(getGridSpanVariables({ columns: 0, rows: -1 })['--grid-span-columns-xs']).toBe('auto');
		expect(getGridSpanVariables({ columns: 0, rows: -1 })['--grid-span-rows-xs']).toBe('auto');
		expect(getGridSpanVariables({ columns: Number.NaN })['--grid-span-columns-xs']).toBe('auto');
	});

	test('a record steps the span with the grid it sits in', () => {
		const variables = getGridSpanVariables({ columns: { xs: 'full', md: 2 } });
		expect(variables['--grid-span-columns-xs']).toBe('1 / -1');
		expect(variables['--grid-span-columns-sm']).toBe('1 / -1');
		expect(variables['--grid-span-columns-md']).toBe('span 2');
		expect(variables['--grid-span-columns-xl']).toBe('span 2');
	});
});

describe('toInlineVariables', () => {
	test('writes the properties as a style attribute Svelte can merge', () => {
		expect(toInlineVariables({ '--a': '1fr', '--b': 'span 2' })).toBe('--a:1fr;--b:span 2');
		expect(toInlineVariables({})).toBe('');
	});
});
