import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

/*
 * A span has no container of its own: these chains query the `@container/grid` root of the Grid it
 * sits in, so a responsive span steps at the same widths as the tracks it spans. Outside a Grid no
 * `grid` container matches and only the `xs` value applies. Both properties are always declared —
 * an axis the consumer left unset resolves to `auto`, which is their initial value. Same literal
 * rule as grid.theme.ts: Tailwind only generates what it can scan, and `gridSpan.theme.test.ts`
 * holds these to `containerBreakpoints`.
 */
const responsiveColumnSpan =
	'[grid-column:var(--grid-span-columns-xs)] ' +
	'@min-[36rem]/grid:[grid-column:var(--grid-span-columns-sm)] ' +
	'@min-[42rem]/grid:[grid-column:var(--grid-span-columns-md)] ' +
	'@min-[56rem]/grid:[grid-column:var(--grid-span-columns-lg)] ' +
	'@min-[72rem]/grid:[grid-column:var(--grid-span-columns-xl)]';

const responsiveRowSpan =
	'[grid-row:var(--grid-span-rows-xs)] ' +
	'@min-[36rem]/grid:[grid-row:var(--grid-span-rows-sm)] ' +
	'@min-[42rem]/grid:[grid-row:var(--grid-span-rows-md)] ' +
	'@min-[56rem]/grid:[grid-row:var(--grid-span-rows-lg)] ' +
	'@min-[72rem]/grid:[grid-row:var(--grid-span-rows-xl)]';

export const gridSpanResponsiveClasses = {
	columns: responsiveColumnSpan,
	rows: responsiveRowSpan
};

const defaultGridSpan = cva({
	base: `grid h-full min-w-0 ${responsiveColumnSpan} ${responsiveRowSpan}`
});

export const gridSpanTheme = {
	root: defaultGridSpan
};

export type GridSpanTheme = typeof gridSpanTheme;
export type GridSpanThemeProps = InferComponentTheme<GridSpanTheme>;
export const setGridSpanTheme = setComponentTheme<GridSpanTheme>('gridSpan');
export const useGridSpanTheme = useComponentTheme<GridSpanTheme>('gridSpan', gridSpanTheme);
