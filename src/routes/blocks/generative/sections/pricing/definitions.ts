import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

const cardsMeta = {
	label: 'Cards',
	values: { outline: 'Outline', soft: 'Soft', solid: 'Solid' },
	hint: 'The Card variant every plan shares; a featured plan adds the primary colour.'
};

export const pricingTiers: SectionType = {
	id: 'pricing-tiers',
	category: 'pricing',
	title: 'Plan columns',
	description:
		'Two or three plans as columns, rows, or a comparison table, with an optional featured plan and a monthly/yearly toggle.',
	file: 'pricing/PricingTiers.svelte',
	dims: {
		layout: ['columns', 'rows', 'table'],
		tiers: [3, 2],
		featured: [true, false],
		cards: ['outline', 'soft', 'solid'],
		features: [5, 3],
		toggle: [true, false],
		align: ['center', 'start'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { columns: 'Columns', rows: 'Rows', table: 'Comparison table' },
			hint: 'Plans side by side, one plan per row, or one column per plan over compared features.'
		},
		tiers: { label: 'Plans', hint: 'Two plans start from the free tier.' },
		featured: {
			label: 'Featured plan',
			values: booleanValues,
			hint: 'Highlights the recommended plan: the middle of three, the last of two.'
		},
		cards: {
			...cardsMeta,
			hint: 'The Card variant every plan shares, or the card the table sits on; a featured plan adds the primary colour.'
		},
		features: {
			label: 'Features',
			hint: 'Listed per plan in columns and rows; compared line by line in the table.'
		},
		toggle: { label: 'Billing toggle', values: booleanValues },
		align: {
			...alignMeta,
			hint: 'Two start-aligned plan columns move the header into a column beside them.'
		},
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => {
		const tiers = Number(p.tiers);
		// Two plan columns fill 8 columns; start-aligned, the header takes the 4 beside them. Rows and
		// the table need the full width, so their header always sits above.
		const beside = p.layout === 'columns' && tiers === 2 && p.align === 'start';
		return {
			headerCols: beside ? 4 : 12,
			planCols: p.layout === 'columns' && tiers === 2 ? 8 : 12,
			// The recommended plan: the middle of three, the last of two.
			featuredIndex: p.featured ? (tiers === 3 ? 1 : tiers - 1) : -1
		};
	},
	rules: [
		{
			id: 'header-room',
			text: 'An H2 needs a header of at least 6 columns; beside two plan columns it gets 4',
			test: (p) => p.headline !== 'h2' || Number(p.headerCols) >= 6
		},
		{
			id: 'tint-cards',
			text: 'On a tint, outline rings and soft fills match the surface: plans take solid cards',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid'
		},
		{
			id: 'table-rules',
			text: 'A table divides its lines with muted hairlines, which vanish on a soft fill: the table sits on an outline or solid card',
			test: (p) => p.layout !== 'table' || p.cards !== 'soft'
		},
		{
			id: 'toggle-track',
			text: 'The billing toggle sits on a recessed track, which vanishes on a muted tone',
			test: (p) => !p.toggle || p.tone !== 'muted'
		},
		{
			id: 'compact-lists',
			text: 'A compact band keeps plans short: three features each',
			test: (p) => p.density !== 'compact' || p.features === 3
		}
	]
};

export const pricingSingle: SectionType = {
	id: 'pricing-single',
	category: 'pricing',
	title: 'Single plan',
	description:
		'One plan card beside the list of everything it includes, or plan and list together in one wide band.',
	file: 'pricing/PricingSingle.svelte',
	dims: {
		layout: ['split', 'banner'],
		textCols: [5, 6, 7],
		mediaSide: ['end', 'start'],
		list: ['checks', 'grid'],
		guarantee: [true, false],
		cards: ['solid', 'outline', 'soft'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { split: 'Split', banner: 'Band' },
			hint: 'A plan card beside the header and list, or header above one wide card holding both.'
		},
		textCols: {
			label: 'Text columns',
			hint: 'The list’s span; the plan takes the remaining columns of 12, beside it or inside the band.'
		},
		mediaSide: {
			label: 'Card side',
			values: { start: 'Start', end: 'End' },
			hint: 'In a band, the side of the band the plan sits on.'
		},
		list: { label: 'List', values: { checks: 'Checks', grid: 'Two columns' } },
		guarantee: { label: 'Guarantee', values: booleanValues },
		cards: {
			...cardsMeta,
			hint: 'The Card variant of the plan card, or of the band.'
		},
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({
		cardCols: 12 - Number(p.textCols),
		// A band is one full-width card, not side media: the alternate-media page rule skips it.
		...(p.layout === 'banner' ? { mediaSide: 'none' } : {})
	}),
	rules: [
		{
			id: 'spans-sum',
			text: 'Text and plan spans sum to 12, beside the card or inside the band',
			test: (p) => Number(p.textCols) + Number(p.cardCols) === 12
		},
		{
			id: 'grid-room',
			text: 'A two-column list needs a text column of at least 6 of 12',
			test: (p) => p.list !== 'grid' || Number(p.textCols) >= 6
		},
		{
			id: 'band-list',
			text: 'In a band, six items in one column outgrow the plan beside them: a band takes the two-column list',
			test: (p) => p.layout !== 'banner' || p.list === 'grid'
		},
		{
			id: 'h2-room',
			text: 'Beside the card, an H2 needs a text column of at least 6 of 12; above a band it spans all 12',
			test: (p) => p.layout === 'banner' || p.headline !== 'h2' || Number(p.textCols) >= 6
		},
		{
			id: 'tint-cards',
			text: 'On a tint, an outline ring or a soft fill matches the surface: the plan takes a solid card',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid'
		}
	]
};

export const sectionTypes = [pricingTiers, pricingSingle];
