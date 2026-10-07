import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { SectionType } from '../../engine/types.js';

export const logosStrip: SectionType = {
	id: 'logos-strip',
	category: 'logos',
	title: 'Logo strip',
	description:
		'A thin proof band: a short label and one row of customer wordmarks, still or scrolling.',
	file: 'logos/LogosStrip.svelte',
	dims: {
		arrangement: ['row', 'marquee'],
		layout: ['stacked', 'inline'],
		count: [5, 4, 6],
		label: [true, false],
		scale: ['normal', 'large'],
		treatment: ['muted', 'accent'],
		align: ['center', 'start'],
		divider: [false, true],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['compact', 'normal']
	},
	meta: {
		arrangement: {
			label: 'Arrangement',
			values: { row: 'Static row', marquee: 'Marquee' },
			hint: 'A marquee loops the marks past the edge of the band and pauses on hover.'
		},
		layout: {
			label: 'Layout',
			values: { stacked: 'Label above', inline: 'Label beside' }
		},
		count: { label: 'Logos' },
		label: { label: 'Label', values: booleanValues },
		scale: { label: 'Mark size', values: { normal: 'Normal', large: 'Large' } },
		treatment: {
			label: 'Treatment',
			values: { muted: 'Muted', accent: 'Accent icons' },
			hint: 'Muted marks recede; accent marks take full ink with primary glyphs.'
		},
		align: alignMeta,
		divider: { label: 'Divider', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'label-beside',
			text: 'A row without a label has nothing beside it: it stacks (canonical)',
			test: (p) => p.layout === 'stacked' || p.label === true
		},
		{
			id: 'row-room',
			text: 'Six normal marks fill a static row; large marks and a label beside it each take one slot',
			test: (p) =>
				p.arrangement === 'marquee' ||
				Number(p.count) <= 6 - (p.scale === 'large' ? 1 : 0) - (p.layout === 'inline' ? 1 : 0)
		},
		{
			id: 'marquee-loop',
			text: 'A marquee loop runs six marks so fewer repeat in view (canonical: 6)',
			test: (p) => p.arrangement === 'row' || p.count === 6
		},
		{
			id: 'inline-align',
			text: 'Align only moves a stacked strip (canonical: start when the label sits beside)',
			test: (p) => p.layout === 'stacked' || p.align === 'start'
		},
		{
			id: 'marquee-align',
			text: 'A marquee spans the band, so align only moves its label: without one it stays centred (canonical)',
			test: (p) => p.arrangement === 'row' || p.label === true || p.align === 'center'
		},
		{
			id: 'divider-inline',
			text: 'The divider separates a label beside the row: inline strips only (canonical: off)',
			test: (p) => p.layout === 'inline' || p.divider === false
		},
		{
			id: 'tint-divider',
			text: 'Neutral hairlines match a tint band and vanish: no divider on tint',
			test: (p) => p.tone !== 'tint' || p.divider === false
		},
		{
			id: 'brand-muted',
			text: 'Accent glyphs are primary-coloured and vanish on brand colour: brand strips stay muted',
			test: (p) => p.tone !== 'brand' || p.treatment === 'muted'
		}
	]
};

export const logosGrid: SectionType = {
	id: 'logos-grid',
	category: 'logos',
	title: 'Logo wall',
	description:
		'A heading with a wall of customer logos: an even grid, offset bricks, or a featured customer.',
	file: 'logos/LogosGrid.svelte',
	dims: {
		layout: ['grid', 'brick', 'spotlight'],
		columns: [4, 3, 6],
		rows: [2, 1],
		cards: ['outline', 'ghost', 'soft', 'solid'],
		header: ['top', 'side'],
		align: ['center', 'start'],
		headline: ['h2', 'h3'],
		caption: [true, false],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { grid: 'Even grid', brick: 'Offset bricks', spotlight: 'Featured customer' },
			hint: 'Bricks: the second row sits half a cell in, one cell shorter. Featured: one customer and its quote take a 2 × 2 cell.'
		},
		columns: { label: 'Columns' },
		rows: { label: 'Rows' },
		cards: {
			label: 'Cells',
			values: { ghost: 'None', outline: 'Outline', soft: 'Soft', solid: 'Solid' },
			hint: 'The Card variant every logo cell shares.'
		},
		header: {
			label: 'Header',
			values: { top: 'Above', side: 'Beside' },
			hint: 'Beside: the heading takes 4 columns, the wall the other 8.'
		},
		align: alignMeta,
		headline: headlineMeta,
		caption: { label: 'Caption', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'wall-not-strip',
			text: 'One row of bare marks is a strip, not a wall: a single row needs cell chrome',
			test: (p) => p.rows === 2 || p.cards !== 'ghost'
		},
		{
			id: 'layout-rows',
			text: 'Offset bricks and a 2 × 2 featured cell both need a second row',
			test: (p) => p.layout === 'grid' || p.rows === 2
		},
		{
			id: 'spotlight-cells',
			text: 'A featured card only lines up with cells that have edges: no bare marks around it',
			test: (p) => p.layout !== 'spotlight' || p.cards !== 'ghost'
		},
		{
			id: 'six-bare',
			text: 'Six across leaves no room for chrome: those cells stay bare',
			test: (p) => p.columns !== 6 || p.cards === 'ghost'
		},
		{
			id: 'side-room',
			text: 'A side header leaves the wall 8 columns: three cells across',
			test: (p) => p.header !== 'side' || p.columns === 3
		},
		{
			id: 'side-align',
			text: 'A side header reads flush start (canonical)',
			test: (p) => p.header !== 'side' || p.align === 'start'
		},
		{
			id: 'tint-cells',
			text: 'Outlines and soft fills match a tint band and vanish: bare or solid cells on tint',
			test: (p) => p.tone !== 'tint' || p.cards === 'ghost' || p.cards === 'solid'
		}
	]
};

export const sectionTypes = [logosStrip, logosGrid];
