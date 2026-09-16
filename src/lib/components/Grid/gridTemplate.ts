import { resolveResponsive, responsiveVariables } from '../Theme/responsive.js';
import type { Breakpoint, ResponsiveProps } from '../Theme/theme.js';
import type { LayoutSpacing } from '../Layout/layoutSpacing.js';
import { layoutSpacingCssValues, toLayoutSpacingKey } from '../Layout/layoutSpacing.js';
import type { GridColumns } from './grid.props.js';
import type { GridSpanColumns } from './gridSpan.props.js';

const positiveInteger = (value: number | undefined): number | undefined => {
	if (value === undefined || !Number.isFinite(value)) return undefined;
	const integer = Math.floor(value);
	return integer > 0 ? integer : undefined;
};

const minimumWidth = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

const cappedTemplate = (
	minWidth: number,
	maxColumns: number,
	repeatMode: 'auto-fill' | 'auto-fit',
	columnGap: LayoutSpacing
) => {
	const gap = layoutSpacingCssValues[toLayoutSpacingKey(columnGap)];
	const availableWidth =
		columnGap === 'none'
			? `calc(100% / ${maxColumns})`
			: `calc((100% - ${maxColumns - 1} * ${gap}) / ${maxColumns})`;
	const trackMinimum = `min(100%, max(${minWidth}px, ${availableWidth}))`;
	return `repeat(${repeatMode}, minmax(${trackMinimum}, 1fr))`;
};

export const getGridTemplate = (columns: GridColumns, columnGap: LayoutSpacing): string => {
	if (typeof columns === 'number') {
		const count = positiveInteger(columns) ?? 1;
		return count === 1 ? '1fr' : `repeat(${count}, minmax(0, 1fr))`;
	}

	const repeatMode = columns.repeat === 'fit' ? 'auto-fit' : 'auto-fill';
	const minWidth = minimumWidth(columns.minWidth);
	const maxColumns = positiveInteger(columns.max);

	if (maxColumns) return cappedTemplate(minWidth, maxColumns, repeatMode, columnGap);
	return `repeat(${repeatMode}, minmax(min(100%, ${minWidth}px), 1fr))`;
};

/**
 * The five `--grid-columns-*` and `--grid-gap-*` custom properties the tracks element carries.
 *
 * Every breakpoint gets its own already-resolved value, so the static `@min-[…]` rules in
 * `grid.theme.ts` only ever read one property — the grid lays out correctly on first paint and in
 * SSR without measuring anything.
 *
 * The axis gaps keep the rule the fixed props always had, one breakpoint at a time: `columnGap`
 * and `rowGap` fall back to whatever `gap` resolves to at THAT breakpoint, so
 * `gap="sm" columnGap={{ lg: 'xl' }}` is `sm` on both axes until the grid is 56rem wide and only
 * then widens its columns. The gap shorthand carries both axes in one property (`<row> <column>`)
 * so the theme needs one class chain instead of two.
 */
export const getGridVariables = ({
	columns,
	gap,
	rowGap,
	columnGap
}: {
	columns?: ResponsiveProps<GridColumns>;
	gap?: ResponsiveProps<LayoutSpacing>;
	rowGap?: ResponsiveProps<LayoutSpacing>;
	columnGap?: ResponsiveProps<LayoutSpacing>;
}): Record<string, string> => {
	const columnGapAt = (breakpoint: Breakpoint) =>
		resolveResponsive<LayoutSpacing>(
			columnGap,
			breakpoint,
			resolveResponsive<LayoutSpacing>(gap, breakpoint, 'none')
		);
	return {
		// `toCss` receives the breakpoint, so a table derived from SEVERAL props — the column
		// template needs the column gap of the same step — is still built from the props
		// themselves rather than from a callback standing in for them.
		...responsiveVariables<GridColumns>('grid-columns', columns, 1, (value, breakpoint) =>
			getGridTemplate(value, columnGapAt(breakpoint))
		),
		...responsiveVariables<LayoutSpacing>('grid-gap', gap, 'none', (resolvedGap, breakpoint) => {
			const row = resolveResponsive<LayoutSpacing>(rowGap, breakpoint, resolvedGap);
			const column = resolveResponsive<LayoutSpacing>(columnGap, breakpoint, resolvedGap);
			return `${layoutSpacingCssValues[row]} ${layoutSpacingCssValues[column]}`;
		})
	};
};

/** One `grid-column` / `grid-row` value: a positive span, the whole row, or the CSS initial. */
const spanValue = (value: GridSpanColumns | undefined): string => {
	if (value === 'full') return '1 / -1';
	const span = positiveInteger(typeof value === 'number' ? value : undefined);
	return span === undefined ? 'auto' : `span ${span}`;
};

/**
 * The five `--grid-span-columns-*` / `--grid-span-rows-*` properties a GridSpan carries.
 *
 * A GridSpan has no container of its own — its `@min-[…]/grid:` rules query the Grid it sits in,
 * so a responsive span reflows with the GRID's width, which is the width its tracks reflow with.
 * Outside a Grid no `grid` container matches, only the `xs` value applies, and an unset axis
 * resolves to `auto`, the CSS initial: the chain is always present and never invents a span.
 */
export const getGridSpanVariables = ({
	columns,
	rows
}: {
	columns?: ResponsiveProps<GridSpanColumns>;
	rows?: ResponsiveProps<number>;
}): Record<string, string> => ({
	...responsiveVariables<GridSpanColumns | undefined>(
		'grid-span-columns',
		columns,
		undefined,
		spanValue
	),
	...responsiveVariables<number | undefined>('grid-span-rows', rows, undefined, spanValue)
});

/** Custom properties as an inline `style` string — Svelte's `style` attribute takes text. */
export const toInlineVariables = (variables: Record<string, string>): string =>
	Object.entries(variables)
		.map(([name, value]) => `${name}:${value}`)
		.join(';');
