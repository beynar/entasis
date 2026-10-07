import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

export const faqSplit: SectionType = {
	id: 'faq-split',
	category: 'faq',
	title: 'Split questions',
	description:
		'A header column beside an accordion of questions, or a header above two columns of them, with an optional way to ask more.',
	file: 'faq/FaqSplit.svelte',
	dims: {
		layout: ['split', 'stacked'],
		headerCols: [4, 5],
		count: [6, 4],
		style: ['classic', 'outline', 'card'],
		splitted: [false, true],
		contact: ['none', 'card', 'link'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { split: 'Split', stacked: 'Stacked' },
			hint: 'The header beside the questions, or above them with the questions in two columns.'
		},
		headerCols: {
			label: 'Header columns',
			hint: 'Beside the questions; they take the remaining columns of 12.'
		},
		count: { label: 'Questions' },
		style: {
			label: 'Accordion',
			values: { classic: 'Classic', outline: 'Outline', card: 'Card' },
			hint: 'The Accordion variant.'
		},
		splitted: {
			label: 'Split items',
			values: booleanValues,
			hint: 'One surface per question instead of one shared container.'
		},
		contact: {
			label: 'Contact',
			values: { none: 'None', card: 'Card', link: 'Link' },
			hint: 'A way to ask what the list does not answer; stacked, the card sits beside the header.'
		},
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({
		listCols: p.layout === 'stacked' ? 12 : 12 - Number(p.headerCols)
	}),
	rules: [
		{
			id: 'spans-sum',
			text: 'Beside the header, header and question spans sum to 12; stacked questions span all 12',
			test: (p) => Number(p.listCols) === (p.layout === 'stacked' ? 12 : 12 - Number(p.headerCols))
		},
		{
			id: 'stacked-header',
			text: 'A stacked header runs above the questions, so header columns do not apply (canonical: 5)',
			test: (p) => p.layout !== 'stacked' || p.headerCols === 5
		},
		{
			id: 'h2-room',
			text: 'An H2 needs a header of at least 5 columns',
			test: (p) => p.headline !== 'h2' || Number(p.headerCols) >= 5
		},
		{
			id: 'classic-joined',
			text: 'Classic rows are already divided by rules: splitting them only unevens the spacing around each rule (canonical: joined)',
			test: (p) => p.style !== 'classic' || p.splitted === false
		},
		{
			id: 'stacked-rows',
			text: 'Side by side, two columns of classic rows put their rules out of line: stacked questions take outline or card items',
			test: (p) => p.layout !== 'stacked' || p.style !== 'classic'
		},
		{
			id: 'tint-raised',
			text: 'On a tint, row rules and outlines match the surface: the questions take raised cards',
			test: (p) => p.tone !== 'tint' || p.style === 'card'
		},
		{
			id: 'contact-balance',
			text: 'Beside the questions, a contact card lengthens the header column: it pairs with six questions',
			test: (p) => p.layout === 'stacked' || p.contact !== 'card' || p.count === 6
		}
	]
};

export const faqGrid: SectionType = {
	id: 'faq-grid',
	category: 'faq',
	title: 'Answer grid',
	description:
		'Every answer open at once, in a grid of two or three columns, or as a list with each question beside its answer.',
	file: 'faq/FaqGrid.svelte',
	dims: {
		layout: ['grid', 'list'],
		columns: [2, 3],
		count: [6, 4],
		cards: ['ghost', 'outline', 'soft', 'solid'],
		icon: [false, true],
		divider: [true, false],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { grid: 'Grid', list: 'List' },
			hint: 'Answers in a grid, or one per line with the question beside its answer.'
		},
		columns: { label: 'Columns', hint: 'Grid only.' },
		count: { label: 'Questions' },
		cards: {
			label: 'Cards',
			values: { ghost: 'None', outline: 'Outline', soft: 'Soft', solid: 'Solid' },
			hint: 'The Card variant every answer in the grid shares, or the card a list sits on.'
		},
		icon: { label: 'Topic icon', values: booleanValues },
		divider: {
			label: 'Divider',
			values: booleanValues,
			hint: 'A rule over each answer: in a grid, for answers without cards; in a list, between lines.'
		},
		align: { ...alignMeta, hint: 'The header; answers always read from the start.' },
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({
		rows: p.layout === 'list' ? Number(p.count) : Number(p.count) / Number(p.columns)
	}),
	rules: [
		{
			id: 'full-rows',
			text: 'Answers fill every row: the count divides by the columns',
			test: (p) => Number.isInteger(p.rows)
		},
		{
			id: 'list-columns',
			text: 'A list runs one answer per line, so columns do not apply (canonical: 2)',
			test: (p) => p.layout !== 'list' || p.columns === 2
		},
		{
			id: 'list-marked',
			text: 'Lines in a list need a marker to start them: a divider or a topic icon',
			test: (p) => p.layout !== 'list' || p.divider === true || p.icon === true
		},
		{
			id: 'divider-ghost',
			text: 'In a grid, a divider only applies to answers without cards (canonical: off on cards)',
			test: (p) => p.layout === 'list' || !p.divider || p.cards === 'ghost'
		},
		{
			id: 'one-marker',
			text: 'An icon and a divider both mark where an answer starts: one at a time',
			test: (p) => !(p.icon && p.divider)
		},
		{
			id: 'tint-cards',
			text: 'On a tint, outline rings and soft fills match the surface: solid cards or no chrome',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid' || p.cards === 'ghost'
		},
		{
			id: 'muted-rules',
			text: 'Dividers are muted hairlines that vanish on a tint or a soft fill',
			test: (p) => !p.divider || (p.tone !== 'tint' && p.cards !== 'soft')
		}
	]
};

export const sectionTypes = [faqSplit, faqGrid];
