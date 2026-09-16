import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

/*
 * A grid reflows by the width it was HANDED, not the device's: three metric cards belong in one
 * column in a 320px sidebar and in three across a page, on the same phone. So the root is a named
 * `@container/grid` and the tracks element inside it reads the five INTERNAL `--grid-*` custom
 * properties Grid.svelte resolves while rendering — wiring, not a consumer hook: the public way
 * to change the layout is the `columns` / `gap` props. A container query cannot style its own container, which is
 * the only reason the tracks are a second element.
 *
 * The chains below have to be written out: Tailwind generates the classes it can SCAN, so a chain
 * built at runtime from `containerBreakpoints` would produce no CSS at all. `grid.theme.test.ts`
 * asserts each literal still equals `responsiveContainerClasses(…)` from that table, so changing a
 * width there fails the test until these follow.
 */
const responsiveColumns =
	'[grid-template-columns:var(--grid-columns-xs)] ' +
	'@min-[36rem]/grid:[grid-template-columns:var(--grid-columns-sm)] ' +
	'@min-[42rem]/grid:[grid-template-columns:var(--grid-columns-md)] ' +
	'@min-[56rem]/grid:[grid-template-columns:var(--grid-columns-lg)] ' +
	'@min-[72rem]/grid:[grid-template-columns:var(--grid-columns-xl)]';

/** Each `--grid-gap-*` carries both axes (`<row> <column>`), so one chain covers gap/rowGap/columnGap. */
const responsiveGap =
	'[gap:var(--grid-gap-xs)] ' +
	'@min-[36rem]/grid:[gap:var(--grid-gap-sm)] ' +
	'@min-[42rem]/grid:[gap:var(--grid-gap-md)] ' +
	'@min-[56rem]/grid:[gap:var(--grid-gap-lg)] ' +
	'@min-[72rem]/grid:[gap:var(--grid-gap-xl)]';

export const gridResponsiveClasses = {
	columns: responsiveColumns,
	gap: responsiveGap
};

// `w-full min-w-0` is load-bearing: inline-size containment strips the root of intrinsic width, so
// a root left to shrink-to-fit inside a flex or grid parent would measure zero. The root is itself
// a grid so that an explicit `height` / `minHeight` reaches the tracks it wraps.
const defaultGrid = cva({
	base: '@container/grid grid w-full min-w-0'
});

const defaultGridTracks = cva({
	base: `grid min-w-0 ${responsiveColumns} ${responsiveGap}`,
	variants: {
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			stretch: 'items-stretch'
		},
		justify: {
			start: 'justify-items-start',
			center: 'justify-items-center',
			end: 'justify-items-end',
			stretch: 'justify-items-stretch'
		}
	},
	defaultVariants: {
		align: 'stretch',
		justify: 'stretch'
	}
});

export const gridTheme = {
	root: defaultGrid,
	tracks: defaultGridTracks
};

export type GridTheme = typeof gridTheme;
export type GridThemeProps = InferComponentTheme<GridTheme>;
export const setGridTheme = setComponentTheme<GridTheme>('grid');
export const useGridTheme = useComponentTheme<GridTheme>('grid', gridTheme);
