import { describe, expect, test } from 'vitest';
import { containerBreakpoints, responsiveContainerClasses } from '../Theme/responsive.js';
import { gridResponsiveClasses, gridTheme } from './grid.theme.js';
import { gridSpanResponsiveClasses, gridSpanTheme } from './gridSpan.theme.js';

/*
 * Tailwind only generates candidates it can scan, so every `@min-[…]` chain is hand-written in the
 * theme files. These are the assertions that keep those literals and `containerBreakpoints` in
 * step: change a width in the table and they fail until the chains follow.
 */
describe('grid container chains', () => {
	test('the track chain is the one the shared table generates', () => {
		expect(gridResponsiveClasses.columns).toBe(
			responsiveContainerClasses('grid-columns', 'grid-template-columns', 'grid')
		);
	});

	test('the gap chain is the one the shared table generates', () => {
		expect(gridResponsiveClasses.gap).toBe(responsiveContainerClasses('grid-gap', 'gap', 'grid'));
	});

	test('the span chains query the grid container, not the span itself', () => {
		expect(gridSpanResponsiveClasses.columns).toBe(
			responsiveContainerClasses('grid-span-columns', 'grid-column', 'grid')
		);
		expect(gridSpanResponsiveClasses.rows).toBe(
			responsiveContainerClasses('grid-span-rows', 'grid-row', 'grid')
		);
	});

	test('every threshold in the table appears in every chain', () => {
		const chains = [
			gridResponsiveClasses.columns,
			gridResponsiveClasses.gap,
			gridSpanResponsiveClasses.columns,
			gridSpanResponsiveClasses.rows
		];
		for (const chain of chains)
			for (const width of Object.values(containerBreakpoints))
				expect(chain).toContain(`@min-[${width}]/grid:`);
	});
});

describe('grid theme parts', () => {
	test('the root is the named container and keeps an intrinsic width under containment', () => {
		const root = gridTheme.root();
		expect(root).toContain('@container/grid');
		expect(root).toContain('w-full');
		expect(root).toContain('min-w-0');
		// A container query cannot style its own container: the root carries no track rules.
		expect(root).not.toContain('grid-template-columns');
	});

	test('the tracks element carries the chains and the alignment variants', () => {
		const tracks = gridTheme.tracks({ align: 'center', justify: 'end' });
		expect(tracks).toContain('[grid-template-columns:var(--grid-columns-xs)]');
		expect(tracks).toContain('[gap:var(--grid-gap-xs)]');
		expect(tracks).toContain('items-center');
		expect(tracks).toContain('justify-items-end');
	});

	test('the span root declares both axes so an unset one can read auto', () => {
		const root = gridSpanTheme.root();
		expect(root).toContain('[grid-column:var(--grid-span-columns-xs)]');
		expect(root).toContain('[grid-row:var(--grid-span-rows-xs)]');
	});

	test('no part reflows by the device', () => {
		const parts = [gridTheme.root(), gridTheme.tracks(), gridSpanTheme.root()];
		for (const part of parts)
			for (const token of part.split(/\s+/))
				expect(token).not.toMatch(/(?:^|:)(?:max-)?(?:sm|md|lg|xl|2xl):/);
	});
});
