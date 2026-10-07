import { alignMeta, booleanValues, densityMeta, toneMeta } from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

/**
 * Link columns sit on whole grid columns. Beside the brand column, whatever it leaves over that
 * does not divide evenly between the link columns becomes a gap after it; stacked, the links share
 * all 12 columns; centred, they collapse into one row and take no columns.
 */
const linkSpans = (p: Params) => {
	const columns = Number(p.columns);
	if (p.layout === 'stacked') return { gapCols: 0, linkCols: 12, linkSpan: 12 / columns };
	if (p.layout === 'centered') return { gapCols: 0, linkCols: 0, linkSpan: 0 };
	const rest = 12 - Number(p.brandCols);
	const gapCols = rest % columns;
	const linkCols = rest - gapCols;
	return { gapCols, linkCols, linkSpan: linkCols / columns };
};

export const footerColumns: SectionType = {
	id: 'footer-columns',
	category: 'footer',
	title: 'Link columns',
	description:
		'Brand and link columns on the 12-column grid, side by side, stacked, or centred, over a bottom bar.',
	file: 'footer/FooterColumns.svelte',
	placement: 'bottom',
	dims: {
		layout: ['split', 'stacked', 'centered'],
		columns: [3, 4, 2],
		brandCols: [4, 3, 5],
		newsletter: [false, true],
		socials: [true, false],
		bottom: ['simple', 'split'],
		tone: ['plain', 'muted', 'inverse'],
		density: ['compact', 'normal']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { split: 'Brand beside links', stacked: 'Brand over links', centered: 'Centred' },
			hint: 'Stacked runs the brand row across the top; centred trades the columns for one row of links.'
		},
		columns: { label: 'Link columns' },
		brandCols: {
			label: 'Brand columns',
			hint: 'Beside the brand, link columns take the rest of 12, on whole grid columns.'
		},
		newsletter: { label: 'Newsletter field', values: booleanValues },
		socials: { label: 'Social links', values: booleanValues },
		bottom: {
			label: 'Bottom bar',
			values: { simple: 'Copyright', split: 'Copyright + legal' }
		},
		tone: toneMeta,
		density: densityMeta
	},
	derive: linkSpans,
	rules: [
		{
			id: 'link-span',
			text: 'Beside the brand column, each link column spans 2 or 3 grid columns: narrower crowds the links, wider leaves them floating',
			test: (p) => p.layout !== 'split' || (Number(p.linkSpan) >= 2 && Number(p.linkSpan) <= 3)
		},
		{
			id: 'stacked-tracks',
			text: 'Stacked, the link columns share all 12 grid columns: three or four of them, since two would float 6 columns apart',
			test: (p) => p.layout !== 'stacked' || Number(p.columns) >= 3
		},
		{
			id: 'layout-canonical',
			text: 'Only the split has a brand column (canonical: 4), and a centred footer shows one row of links, not columns (canonical: 3)',
			test: (p) =>
				(p.layout === 'split' || p.brandCols === 4) && (p.layout !== 'centered' || p.columns === 3)
		},
		{
			id: 'newsletter-room',
			text: 'Beside the links, a newsletter field needs a brand column of at least 4 of 12',
			test: (p) => p.layout !== 'split' || !p.newsletter || Number(p.brandCols) >= 4
		},
		{
			id: 'legal-once',
			text: 'Legal links appear once: four columns already include Legal, so the bottom bar stays simple',
			test: (p) => Number(p.columns) < 4 || p.bottom === 'simple'
		}
	]
};

export const footerStatement: SectionType = {
	id: 'footer-statement',
	category: 'footer',
	title: 'Statement footer',
	description:
		'An oversized wordmark or sentence on the theme type scale, above, below, or beside compact links.',
	file: 'footer/FooterStatement.svelte',
	placement: 'bottom',
	dims: {
		layout: ['stacked', 'beside'],
		statement: ['wordmark', 'sentence'],
		scale: ['large', 'huge'],
		position: ['top', 'bottom'],
		links: ['row', 'columns'],
		align: ['start', 'center'],
		divider: [true, false],
		tone: ['plain', 'muted', 'inverse', 'brand'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { stacked: 'Statement and links stacked', beside: 'Links beside' },
			hint: 'Beside sets the statement in 7 columns and the links in the other 5.'
		},
		statement: { label: 'Statement', values: { wordmark: 'Wordmark', sentence: 'Sentence' } },
		scale: {
			label: 'Scale',
			values: { large: 'Large', huge: 'Huge' },
			hint: 'A step of the theme type scale for the statement.'
		},
		position: {
			label: 'Statement position',
			values: { top: 'Above the links', bottom: 'Below the links' }
		},
		links: {
			label: 'Links',
			values: { row: 'Row', columns: 'Columns' },
			hint: 'Beside the statement, a row of links becomes a single list.'
		},
		align: alignMeta,
		divider: { label: 'Divider', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'huge-wordmark',
			text: 'Huge scale is for the one-word wordmark; a sentence that size breaks into too many lines',
			test: (p) => p.scale !== 'huge' || p.statement === 'wordmark'
		},
		{
			id: 'center-row',
			text: 'A centred statement takes a single row of links',
			test: (p) => p.align !== 'center' || p.links === 'row'
		},
		{
			id: 'beside-canonical',
			text: 'Beside the links the statement has one place and reads from the start edge (canonical: above, start)',
			test: (p) => p.layout !== 'beside' || (p.position === 'top' && p.align === 'start')
		},
		{
			id: 'beside-scale',
			text: 'Beside the links the statement has 7 of 12 columns: the large scale, never huge',
			test: (p) => p.layout !== 'beside' || p.scale === 'large'
		},
		{
			id: 'compact-large',
			text: 'Compact padding pairs with the large scale: a huge wordmark needs air around it',
			test: (p) => p.density !== 'compact' || p.scale === 'large'
		}
	]
};

export const sectionTypes = [footerColumns, footerStatement];
