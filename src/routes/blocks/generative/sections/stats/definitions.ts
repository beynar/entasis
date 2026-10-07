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
	values: { ghost: 'None', outline: 'Outline', soft: 'Soft', solid: 'Solid' },
	hint: 'The Stat variant every metric shares.'
};

export const statsRow: SectionType = {
	id: 'stats-row',
	category: 'stats',
	title: 'Metric row',
	description:
		'A heading over large numbers: one row, bare, ruled, or in cards, or a bento of tiles.',
	file: 'stats/StatsRow.svelte',
	dims: {
		layout: ['row', 'bento'],
		count: [3, 4, 2],
		cards: ['ghost', 'outline', 'soft', 'solid'],
		divider: [false, true],
		intro: ['top', 'side'],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		detail: [true, false],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { row: 'Row', bento: 'Bento' },
			hint: 'Bento: the first metric becomes a tall hero tile, the others stack beside it.'
		},
		count: { label: 'Metrics' },
		cards: cardsMeta,
		divider: { label: 'Rules', values: booleanValues, hint: 'A hairline above each bare metric.' },
		intro: {
			label: 'Intro',
			values: { top: 'Above', side: 'Beside' },
			hint: 'Beside: the heading takes 4 columns, the metrics the other 8.'
		},
		align: alignMeta,
		headline: headlineMeta,
		detail: { label: 'Trend line', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'side-room',
			text: 'A side intro leaves the metrics 8 columns: three at most',
			test: (p) => p.intro !== 'side' || Number(p.count) <= 3
		},
		{
			id: 'side-align',
			text: 'A side intro reads flush start (canonical)',
			test: (p) => p.intro !== 'side' || p.align === 'start'
		},
		{
			id: 'bento-stack',
			text: 'A bento sets one hero metric beside a stack: it needs at least three metrics',
			test: (p) => p.layout !== 'bento' || Number(p.count) >= 3
		},
		{
			id: 'bento-tiles',
			text: 'A bento is built from tiles: bare metrics have no edges to span, so it needs cards',
			test: (p) => p.layout !== 'bento' || p.cards !== 'ghost'
		},
		{
			id: 'divider-bare',
			text: 'Rules separate bare metrics; cards bring their own edges (canonical: off)',
			test: (p) => p.divider === false || p.cards === 'ghost'
		},
		{
			id: 'tint-cards',
			text: 'Outlines, soft fills and rules match a tint band and vanish: bare or solid metrics, unruled, on tint',
			test: (p) =>
				p.tone !== 'tint' || ((p.cards === 'ghost' || p.cards === 'solid') && p.divider === false)
		},
		{
			id: 'brand-cards',
			text: 'Outline and soft cards draw in neutral ink that brand colour swallows: bare or solid only',
			test: (p) => p.tone !== 'brand' || p.cards === 'ghost' || p.cards === 'solid'
		}
	]
};

export const statsPanel: SectionType = {
	id: 'stats-panel',
	category: 'stats',
	title: 'Metric spotlight',
	description:
		'A text column beside a panel of metrics, as cards or a ruled list, with trends or meters.',
	file: 'stats/StatsPanel.svelte',
	dims: {
		layout: ['cards', 'list'],
		textCols: [5, 4, 6],
		mediaSide: ['end', 'start'],
		count: [4, 2],
		indicator: ['trend', 'meter', 'none'],
		cards: ['outline', 'soft', 'solid'],
		eyebrow: [true, false],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { cards: 'Cards', list: 'List' },
			hint: 'List: one card holds every metric as a ruled row, value beside its label.'
		},
		textCols: { label: 'Text columns', hint: 'The panel takes the remaining columns of 12.' },
		mediaSide: { label: 'Panel side', values: { start: 'Start', end: 'End' } },
		count: {
			label: 'Metrics',
			hint: 'As cards, two stack in one column and four sit two by two; a list stacks them all.'
		},
		indicator: {
			label: 'Indicator',
			values: { trend: 'Trend', meter: 'Meter', none: 'None' }
		},
		cards: cardsMeta,
		eyebrow: { label: 'Eyebrow', values: booleanValues },
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({ panelCols: 12 - Number(p.textCols) }),
	rules: [
		{
			id: 'spans-sum',
			text: 'Text and panel spans sum to 12',
			test: (p) => Number(p.textCols) + Number(p.panelCols) === 12
		},
		{
			id: 'h2-room',
			text: 'An H2 needs a text column of at least 5 of 12',
			test: (p) => p.headline !== 'h2' || Number(p.textCols) >= 5
		},
		{
			id: 'four-room',
			text: 'Four metric cards sit two by two, half the panel each: they need a panel of at least 7 columns (a list stacks them)',
			test: (p) => p.layout === 'list' || p.count === 2 || Number(p.panelCols) >= 7
		},
		{
			id: 'meter-room',
			text: 'A meter needs a card 4 columns wide: four metered cards need an 8-column panel (list rows span the panel)',
			test: (p) =>
				p.indicator !== 'meter' || p.count === 2 || p.layout === 'list' || Number(p.panelCols) >= 8
		},
		{
			id: 'tint-cards',
			text: 'Outlines and soft fills match a tint band and vanish: solid cards on tint',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid'
		}
	]
};

export const sectionTypes = [statsRow, statsPanel];
