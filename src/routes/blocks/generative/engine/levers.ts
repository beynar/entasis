import type { DimMeta, Rule } from './types.js';

/**
 * Levers every section type shares, so page rules can read them whatever the section is. Each
 * value resolves to Entasis tokens — never to a free colour, size or offset:
 *
 * - `tone` picks a rung of the surface ladder or a palette role, so the global theme's palette and
 *   light/dark scheme repaint every tone.
 * - `density` picks a block padding on the layout spacing scale, so the global spacing factor
 *   scales every section together. It uses the kit's density vocabulary, never `size`.
 * - `headline` picks a step of the type scale (`Heading size`), so the theme's type preset decides
 *   what an `h1` measures.
 */
export const tones = ['plain', 'muted', 'tint', 'inverse', 'brand'] as const;
export type Tone = (typeof tones)[number];

export const densities = ['compact', 'normal', 'comfortable'] as const;
export type SectionDensity = (typeof densities)[number];

export const headlines = ['h1', 'h2', 'h3'] as const;
export type Headline = (typeof headlines)[number];

export const aligns = ['start', 'center'] as const;
export type Align = (typeof aligns)[number];

export const toneMeta: DimMeta = {
	label: 'Tone',
	values: {
		plain: 'Plain',
		muted: 'Muted',
		tint: 'Tint',
		inverse: 'Inverse',
		brand: 'Brand'
	},
	hint: 'A surface rung or palette role; the global theme supplies the colour.'
};

export const densityMeta: DimMeta = {
	label: 'Density',
	values: { compact: 'Compact', normal: 'Normal', comfortable: 'Comfortable' },
	hint: 'Block padding and gaps on the layout spacing scale.'
};

export const headlineMeta: DimMeta = {
	label: 'Headline',
	values: { h1: 'H1', h2: 'H2', h3: 'H3' },
	hint: 'A step of the theme type scale.'
};

export const alignMeta: DimMeta = {
	label: 'Align',
	values: { start: 'Start', center: 'Center' }
};

export const booleanValues = { true: 'On', false: 'Off' };

/** A largest heading needs room: never an `h1` in a column narrower than `minCols`. */
export const headlineFitsColumn = (column: string, minCols: number): Rule => ({
	id: 'headline-fits-column',
	text: `An H1 headline needs a text column of at least ${minCols} of 12`,
	test: (params) => params.headline !== 'h1' || Number(params[column]) >= minCols
});

/** Brand tone repaints every surface in the primary role; only sections built for it opt in. */
export const isOnColor = (tone: unknown) => tone === 'brand';
