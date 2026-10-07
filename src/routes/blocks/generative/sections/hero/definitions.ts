import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineFitsColumn,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

const mediaMeta = {
	label: 'Media',
	values: { none: 'None', product: 'Product', photo: 'Photo', pattern: 'Pattern' }
};

export const heroSplit: SectionType = {
	id: 'hero-split',
	category: 'hero',
	title: 'Split hero',
	description:
		'Headline and actions beside media, over it in a raised panel, or above it in two columns.',
	file: 'hero/HeroSplit.svelte',
	dims: {
		layout: ['split', 'overlap', 'stacked'],
		textCols: [5, 6, 7],
		mediaSide: ['end', 'start'],
		media: ['product', 'photo', 'pattern'],
		headline: ['h1', 'h2'],
		eyebrow: [true, false],
		buttons: [2, 1],
		proof: ['none', 'avatars', 'rating'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { split: 'Split', overlap: 'Overlap', stacked: 'Stacked' },
			hint: 'Text beside the media, in a panel overlapping it, or in two columns above wide media.'
		},
		textCols: {
			label: 'Text columns',
			hint: 'Beside or over the media: the text span. Stacked: the headline column.'
		},
		mediaSide: { label: 'Media side', values: { start: 'Start', end: 'End' } },
		media: mediaMeta,
		headline: headlineMeta,
		eyebrow: { label: 'Eyebrow', values: booleanValues },
		buttons: { label: 'Buttons' },
		proof: { label: 'Proof', values: { none: 'None', avatars: 'Avatars', rating: 'Rating' } },
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => {
		const textCols = Number(p.textCols);
		// Side by side the spans share the 12 columns; an overlapping panel reaches 2 columns into
		// the media; stacked, the media runs the full width under the text.
		const shared = p.layout === 'overlap' ? 2 : 0;
		const mediaCols = p.layout === 'stacked' ? 12 : 12 - textCols + shared;
		return {
			shared,
			mediaCols,
			mediaRatio:
				p.layout === 'stacked'
					? 'wide'
					: mediaCols >= 7
						? 'landscape'
						: mediaCols === 6
							? 'square'
							: 'portrait',
			// Stacked media has no side, so the alternate-media page rule skips it. Only the canonical
			// lever position resolves to none; `stacked-no-side` rejects the other one.
			...(p.layout === 'stacked' && p.mediaSide === 'end' ? { mediaSide: 'none' } : {})
		};
	},
	rules: [
		{
			id: 'spans-sum',
			text: 'Text and media spans sum to 12, plus the 2 columns an overlap shares; stacked media spans all 12',
			test: (p) =>
				p.layout === 'stacked'
					? Number(p.mediaCols) === 12
					: Number(p.textCols) + Number(p.mediaCols) - Number(p.shared) === 12
		},
		headlineFitsColumn('textCols', 6),
		{
			id: 'product-room',
			text: 'A product mock needs at least 6 media columns',
			test: (p) => p.media !== 'product' || Number(p.mediaCols) >= 6
		},
		{
			id: 'overlap-quiet-media',
			text: 'An overlapping panel covers part of the media: it lies over a photo or a pattern, never a product mock',
			test: (p) => p.layout !== 'overlap' || p.media !== 'product'
		},
		{
			id: 'stacked-no-side',
			text: 'Stacked media sits under the text and has no side (canonical: End)',
			test: (p) => p.layout !== 'stacked' || p.mediaSide === 'none'
		},
		{
			id: 'proof-quiet',
			text: 'A proof row needs room: a single button, or no eyebrow',
			test: (p) => p.proof === 'none' || p.buttons === 1 || p.eyebrow === false
		}
	]
};

export const heroCentered: SectionType = {
	id: 'hero-centered',
	category: 'hero',
	title: 'Stacked hero',
	description: 'A headline column on the grid, with media stacked beneath it or laid behind it.',
	file: 'hero/HeroCentered.svelte',
	dims: {
		layout: ['stacked', 'background'],
		align: ['center', 'start'],
		width: [6, 8, 10],
		headline: ['h1', 'h2'],
		eyebrow: ['chip', 'link', 'none'],
		action: ['buttons', 'email'],
		media: ['product', 'photo', 'pattern', 'none'],
		bleed: [false, true],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { stacked: 'Media below', background: 'Media behind' },
			hint: 'Behind the text, a photo sits under a veil of the section tone.'
		},
		align: alignMeta,
		width: { label: 'Text columns', hint: 'Centred text is offset evenly on the 12-column grid.' },
		headline: headlineMeta,
		eyebrow: { label: 'Eyebrow', values: { chip: 'Chip', link: 'Link', none: 'None' } },
		action: { label: 'Action', values: { buttons: 'Buttons', email: 'Email capture' } },
		media: mediaMeta,
		bleed: {
			label: 'Media width',
			values: { false: 'Contained', true: 'Full' },
			hint: 'Behind the text: a framed panel, or the whole section.'
		},
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({
		offset: p.align === 'center' ? (12 - Number(p.width)) / 2 : 0
	}),
	rules: [
		{
			id: 'integer-offset',
			text: 'Centred text sits on whole columns',
			test: (p) => Number.isInteger(p.offset)
		},
		headlineFitsColumn('width', 8),
		{
			id: 'measure',
			text: 'Start-aligned copy keeps a readable measure: 8 columns at most',
			test: (p) => p.align !== 'start' || Number(p.width) <= 8
		},
		{
			id: 'background-photo',
			text: 'Text laid over media needs a quiet picture: a background is a photo, never a product mock, a pattern, or nothing',
			test: (p) => p.layout !== 'background' || p.media === 'photo'
		},
		{
			id: 'bleed-needs-media',
			text: 'Media width only applies when there is media (canonical: contained)',
			test: (p) => p.media !== 'none' || p.bleed === false
		},
		{
			id: 'pattern-framed',
			text: 'Patterns stay framed, never full width',
			test: (p) => p.media !== 'pattern' || p.bleed === false
		}
	]
};

export const sectionTypes = [heroSplit, heroCentered];
