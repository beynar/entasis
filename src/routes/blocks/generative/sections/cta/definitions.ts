import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

/** Surfaces quiet enough to hold an inset panel without two colour blocks fighting. */
const quietTones = ['plain', 'muted', 'tint'];

export const ctaBand: SectionType = {
	id: 'cta-band',
	category: 'cta',
	title: 'Action band',
	description:
		'The closing call to action: a full-bleed band, an inset panel, or copy beside a boxed action card.',
	file: 'cta/CtaBand.svelte',
	dims: {
		layout: ['inline', 'stacked'],
		arrangement: ['open', 'split'],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		buttons: [2, 1],
		container: ['bleed', 'panel'],
		panel: ['tint', 'brand', 'inverse'],
		note: [false, true],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { inline: 'Actions beside', stacked: 'Actions below' }
		},
		arrangement: {
			label: 'Actions',
			values: { open: 'Open', split: 'Boxed card' },
			hint: 'A split boxes the actions in a card with a short checklist, beside the copy.'
		},
		align: alignMeta,
		headline: headlineMeta,
		buttons: { label: 'Buttons' },
		container: {
			label: 'Container',
			values: { bleed: 'Full bleed', panel: 'Inset panel' },
			hint: 'Full bleed paints the section tone; a panel is a rounded block on it.'
		},
		panel: {
			label: 'Panel colour',
			values: { tint: 'Tint', brand: 'Brand', inverse: 'Inverse' },
			hint: 'Only read by the inset panel; the section keeps its own tone.'
		},
		note: { label: 'Small print', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'inline-start',
			text: 'Copy beside the actions reads from the start edge (canonical: start when inline)',
			test: (p) => p.layout !== 'inline' || p.align === 'start'
		},
		{
			id: 'split-canonical',
			text: 'A split sets the copy beside its own action card on the section: actions sit beside, never in an inset panel (canonical: inline, full bleed)',
			test: (p) => p.arrangement !== 'split' || (p.layout === 'inline' && p.container === 'bleed')
		},
		{
			id: 'panel-canonical',
			text: 'Panel colour only applies to an inset panel (canonical: tint when full bleed)',
			test: (p) => p.container === 'panel' || p.panel === 'tint'
		},
		{
			id: 'panel-quiet',
			text: 'An inset panel sits on a quiet section: plain, muted or tint',
			test: (p) => p.container === 'bleed' || quietTones.includes(String(p.tone))
		},
		{
			id: 'panel-differs',
			text: 'The panel colour differs from the section tone it sits on',
			test: (p) => p.container === 'bleed' || p.panel !== p.tone
		},
		{
			id: 'panel-padding',
			text: 'An inset panel pads itself, so the section around it is never comfortable',
			test: (p) => p.container === 'bleed' || p.density !== 'comfortable'
		}
	]
};

export const ctaSplit: SectionType = {
	id: 'cta-split',
	category: 'cta',
	title: 'Action card with media',
	description:
		'A raised card with the closing pitch beside media on a 12-column split, or centred above it.',
	file: 'cta/CtaSplit.svelte',
	dims: {
		layout: ['split', 'stacked'],
		textCols: [7, 6, 8],
		mediaSide: ['end', 'start'],
		media: ['photo', 'product', 'pattern'],
		buttons: [2, 1],
		input: [false, true],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { split: 'Beside media', stacked: 'Above media' },
			hint: 'Stacked centres the pitch on the grid and sets the media below it at the same width.'
		},
		textCols: {
			label: 'Text columns',
			hint: 'Beside media, media takes the rest of 12; stacked, both share this width.'
		},
		mediaSide: { label: 'Media side', values: { start: 'Start', end: 'End' } },
		media: {
			label: 'Media',
			values: { product: 'Product', photo: 'Photo', pattern: 'Pattern' }
		},
		buttons: { label: 'Buttons' },
		input: {
			label: 'Email capture',
			values: booleanValues,
			hint: 'An email field replaces the buttons.'
		},
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => {
		const stacked = p.layout === 'stacked';
		return {
			mediaCols: stacked ? Number(p.textCols) : 12 - Number(p.textCols),
			offset: stacked ? (12 - Number(p.textCols)) / 2 : 0,
			// The lever as set; the page reads `mediaSide`, which a stacked layout has none of.
			sideLever: p.mediaSide,
			mediaSide: stacked ? 'none' : p.mediaSide
		};
	},
	rules: [
		{
			id: 'spans-sum',
			text: 'Side by side, text and media spans sum to 12',
			test: (p) => p.layout === 'stacked' || Number(p.textCols) + Number(p.mediaCols) === 12
		},
		{
			id: 'stacked-offset',
			text: 'Stacked, the centred column sits on whole grid columns: 6 or 8 wide, never 7',
			test: (p) => Number.isInteger(p.offset)
		},
		{
			id: 'stacked-side',
			text: 'Stacked media sits below the pitch, on no side (canonical: end)',
			test: (p) => p.layout !== 'stacked' || p.sideLever === 'end'
		},
		{
			id: 'product-room',
			text: 'A product mock needs at least 6 media columns',
			test: (p) => p.media !== 'product' || Number(p.mediaCols) >= 6
		},
		{
			id: 'h2-room',
			text: 'An H2 needs a text column of at least 7 of 12 inside the card',
			test: (p) => p.headline !== 'h2' || Number(p.textCols) >= 7
		},
		{
			id: 'input-replaces-buttons',
			text: 'Email capture replaces the buttons (canonical: one button)',
			test: (p) => !p.input || p.buttons === 1
		},
		{
			id: 'brand-pattern',
			text: 'A brand surface already carries the primary colour: its card shows a photo or product, not the primary pattern',
			test: (p) => p.tone !== 'brand' || p.media !== 'pattern'
		}
	]
};

export const sectionTypes = [ctaBand, ctaSplit];
