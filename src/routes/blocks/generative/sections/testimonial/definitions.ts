import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

export const testimonialQuote: SectionType = {
	id: 'testimonial-quote',
	category: 'testimonial',
	title: 'Featured quote',
	description:
		'One customer quote set large on the grid, alone or beside a portrait of its speaker.',
	file: 'testimonial/TestimonialQuote.svelte',
	dims: {
		layout: ['solo', 'portrait'],
		mediaSide: ['end', 'start'],
		align: ['center', 'start'],
		width: [10, 8, 12, 7],
		headline: ['h2', 'h3'],
		attribution: ['avatar', 'inline', 'card'],
		mark: [true, false],
		logo: [false, true],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { solo: 'Quote alone', portrait: 'Portrait' },
			hint: 'Portrait: a photo column beside the quote, captioned with the speaker.'
		},
		mediaSide: { label: 'Portrait side', values: { start: 'Start', end: 'End' } },
		align: alignMeta,
		width: {
			label: 'Quote columns',
			hint: 'Centred quotes are offset evenly on the 12-column grid; a portrait takes the rest.'
		},
		headline: { ...headlineMeta, label: 'Quote size' },
		attribution: {
			label: 'Attribution',
			values: { avatar: 'Avatar', inline: 'Inline', card: 'Card' }
		},
		mark: { label: 'Quote mark', values: booleanValues },
		logo: { label: 'Company logo', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	// A solo quote has no side media, so page rules that alternate media sides skip it.
	derive: (p: Params) => ({
		offset: p.align === 'center' ? (12 - Number(p.width)) / 2 : 0,
		photoCols: p.layout === 'portrait' ? 12 - Number(p.width) : 0,
		media: p.layout === 'portrait' ? 'photo' : 'none'
	}),
	rules: [
		{
			id: 'integer-offset',
			text: 'A centred quote sits on whole columns: its span is even',
			test: (p) => Number.isInteger(p.offset)
		},
		{
			id: 'quote-measure',
			text: 'The quote keeps a readable measure: an H2 spans at least 8 columns, an H3 at most 10',
			test: (p) => (p.headline === 'h2' ? Number(p.width) >= 8 : Number(p.width) <= 10)
		},
		{
			id: 'portrait-room',
			text: 'A portrait needs at least 4 of the 12 columns: beside it the quote spans 8 at most',
			test: (p) => p.layout !== 'portrait' || Number(p.photoCols) >= 4
		},
		{
			id: 'portrait-anchors',
			text: 'A portrait anchors the quote to its side: flush start, attribution on the photo (canonical)',
			test: (p) => p.layout !== 'portrait' || (p.align === 'start' && p.attribution === 'avatar')
		},
		{
			id: 'solo-side',
			text: 'A quote alone has no side to choose (canonical: end)',
			test: (p) => p.layout === 'portrait' || p.mediaSide === 'end'
		},
		{
			id: 'card-surface',
			text: 'The attribution card is a neutral outline: brand colour swallows it and a tint matches its line',
			test: (p) => (p.tone !== 'brand' && p.tone !== 'tint') || p.attribution !== 'card'
		}
	]
};

export const testimonialWall: SectionType = {
	id: 'testimonial-wall',
	category: 'testimonial',
	title: 'Quote wall',
	description:
		'A heading with customer quote cards: an even grid, a masonry of columns, or a marquee.',
	file: 'testimonial/TestimonialWall.svelte',
	dims: {
		layout: ['grid', 'masonry', 'marquee'],
		columns: [3, 2],
		count: [6, 3, 4],
		cards: ['outline', 'soft', 'solid'],
		rating: [true, false],
		header: ['top', 'side'],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { grid: 'Grid', masonry: 'Masonry', marquee: 'Marquee' },
			hint: 'Masonry: columns of cards at their own height. Marquee: one row looping past, as wide as the grid columns.'
		},
		columns: { label: 'Columns', hint: 'In a marquee: how many cards fit the width at once.' },
		count: { label: 'Quotes' },
		cards: {
			label: 'Cards',
			values: { outline: 'Outline', soft: 'Soft', solid: 'Solid' },
			hint: 'The Card variant every quote shares.'
		},
		rating: { label: 'Rating', values: booleanValues },
		header: {
			label: 'Header',
			values: { top: 'Above', side: 'Beside' },
			hint: 'Beside: the heading takes 4 columns, the quotes the other 8.'
		},
		align: alignMeta,
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({ rows: Number(p.count) / Number(p.columns) }),
	rules: [
		{
			id: 'full-rows',
			text: 'A grid fills every row: the count divides by the columns (masonry and marquee have no rows)',
			test: (p) => p.layout !== 'grid' || Number.isInteger(p.rows)
		},
		{
			id: 'masonry-depth',
			text: 'Masonry staggers only with at least two quotes in every column',
			test: (p) => p.layout !== 'masonry' || Number(p.count) >= 2 * Number(p.columns)
		},
		{
			id: 'marquee-loop',
			text: 'A marquee loops its quotes: fewer than four repeat within one view',
			test: (p) => p.layout !== 'marquee' || Number(p.count) >= 4
		},
		{
			id: 'side-room',
			text: 'A side header leaves the wall 8 columns: two quote columns at most',
			test: (p) => p.header !== 'side' || p.columns === 2
		},
		{
			id: 'side-align',
			text: 'A side header reads flush start (canonical)',
			test: (p) => p.header !== 'side' || p.align === 'start'
		},
		{
			id: 'tint-cards',
			text: 'Outlines and soft fills match a tint band and vanish: solid cards on tint',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid'
		}
	]
};

export const sectionTypes = [testimonialQuote, testimonialWall];
