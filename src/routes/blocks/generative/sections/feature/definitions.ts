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
	hint: 'The Card variant every item shares.'
};

export const featureGrid: SectionType = {
	id: 'feature-grid',
	category: 'feature',
	title: 'Feature grid',
	description:
		'A heading over features as an even grid, a bento around one large tile, or a ruled list.',
	file: 'feature/FeatureGrid.svelte',
	dims: {
		layout: ['grid', 'bento', 'list'],
		columns: [3, 2, 4],
		count: [3, 4, 6, 8],
		icon: ['tile', 'plain', 'none'],
		cards: ['ghost', 'outline', 'soft', 'solid'],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { grid: 'Even grid', bento: 'Bento', list: 'Ruled list' },
			hint: 'A bento gives the first feature a 2 × 2 tile; a list sets rows beside the heading.'
		},
		columns: { label: 'Columns' },
		count: { label: 'Items' },
		icon: { label: 'Icon', values: { tile: 'Tile', plain: 'Plain', none: 'None' } },
		cards: cardsMeta,
		align: alignMeta,
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => {
		// The bento's lead tile covers four cells; a list sets one item per row.
		const cells = Number(p.count) + (p.layout === 'bento' ? 3 : 0);
		return { rows: p.layout === 'list' ? Number(p.count) : cells / Number(p.columns) };
	},
	rules: [
		{
			id: 'full-rows',
			text: 'Items fill every row: the cells (the bento tile counts four) divide by the columns',
			test: (p) => Number.isInteger(p.rows)
		},
		{
			id: 'row-limit',
			text: 'A grid or bento holds at most three rows; more items take more columns',
			test: (p) => p.layout === 'list' || Number(p.rows) <= 3
		},
		{
			id: 'tint-contrast',
			text: 'On a tint, soft fills, outline rings and row rules vanish: solid cards or none, and no list',
			test: (p) =>
				p.tone !== 'tint' || ((p.cards === 'solid' || p.cards === 'ghost') && p.layout !== 'list')
		},
		{
			id: 'centered-anchor',
			text: 'Centred items need an icon to anchor them',
			test: (p) => p.align !== 'center' || p.icon !== 'none'
		},
		{
			id: 'four-across',
			text: 'Four across is tight: a plain icon or none, never a tile',
			test: (p) => p.columns !== 4 || p.icon !== 'tile'
		},
		{
			id: 'bento-tiles',
			text: 'A bento is a mosaic of tiles with a track beside the lead one: card chrome and at least three columns',
			test: (p) => p.layout !== 'bento' || (p.cards !== 'ghost' && Number(p.columns) >= 3)
		},
		{
			id: 'list-canonical',
			text: 'A list is one column of rows beside the heading: columns, cards and alignment do not apply (canonical: 3, none, start)',
			test: (p) =>
				p.layout !== 'list' || (p.columns === 3 && p.cards === 'ghost' && p.align === 'start')
		},
		{
			id: 'list-length',
			text: 'Beside the heading, a list holds at most six rows',
			test: (p) => p.layout !== 'list' || Number(p.count) <= 6
		}
	]
};

export const featureSplit: SectionType = {
	id: 'feature-split',
	category: 'feature',
	title: 'Feature spotlight',
	description:
		'Media beside a short list of features, beside tabs that swap the photo, or stacked above columns.',
	file: 'feature/FeatureSplit.svelte',
	dims: {
		layout: ['split', 'tabs', 'stacked'],
		textCols: [5, 6, 7],
		mediaSide: ['start', 'end'],
		media: ['product', 'photo', 'pattern'],
		list: ['checks', 'numbered', 'accordion'],
		count: [3, 4],
		headline: ['h2', 'h3'],
		eyebrow: [true, false],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: {
				split: 'List beside media',
				tabs: 'Tabs swap media',
				stacked: 'Media over columns'
			},
			hint: 'Tabs turn the list into a vertical tab list; stacked sets the media full width.'
		},
		textCols: { label: 'Text columns', hint: 'Media takes the remaining columns of 12.' },
		mediaSide: { label: 'Media side', values: { start: 'Start', end: 'End' } },
		media: {
			label: 'Media',
			values: { product: 'Product', photo: 'Photo', pattern: 'Pattern' }
		},
		list: {
			label: 'List',
			values: { checks: 'Checks', numbered: 'Numbered', accordion: 'Accordion' }
		},
		count: { label: 'Items' },
		headline: headlineMeta,
		eyebrow: { label: 'Eyebrow', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => {
		const stacked = p.layout === 'stacked';
		return {
			mediaCols: stacked ? 12 : 12 - Number(p.textCols),
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
			id: 'product-room',
			text: 'A product mock needs at least 6 media columns',
			test: (p) => p.media !== 'product' || Number(p.mediaCols) >= 6
		},
		{
			id: 'h2-room',
			text: 'An H2 needs a text column of at least 6 of 12',
			test: (p) => p.headline !== 'h2' || Number(p.textCols) >= 6
		},
		{
			id: 'tint-rules',
			text: 'Accordion rules vanish on a tint: checks or numbers there',
			test: (p) => p.tone !== 'tint' || p.list !== 'accordion'
		},
		{
			id: 'numbered-room',
			text: 'Numbered steps read as a sequence: four of them need 6 text columns',
			test: (p) => p.list !== 'numbered' || p.count === 3 || Number(p.textCols) >= 6
		},
		{
			id: 'tabs-photo',
			text: 'Tabs swap the media per feature, and only photos differ from one tab to the next',
			test: (p) => p.layout !== 'tabs' || p.media === 'photo'
		},
		{
			id: 'list-fits-layout',
			text: 'The list style follows the layout: tabs replace it (canonical: checks), and stacked columns hold checks or numbers, never an accordion',
			test: (p) =>
				p.layout === 'split' || (p.layout === 'tabs' ? p.list === 'checks' : p.list !== 'accordion')
		},
		{
			id: 'stacked-canonical',
			text: 'Stacked, the media spans the full width: text columns and media side do not apply (canonical: 6, end)',
			test: (p) => p.layout !== 'stacked' || (p.textCols === 6 && p.sideLever === 'end')
		}
	]
};

export const sectionTypes = [featureGrid, featureSplit];
