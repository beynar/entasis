import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Params, SectionType } from '../../engine/types.js';

export const teamGrid: SectionType = {
	id: 'team-grid',
	category: 'team',
	title: 'Team grid',
	description:
		'People with their roles as an even grid, a list with a line about each, or a carousel.',
	file: 'team/TeamGrid.svelte',
	dims: {
		layout: ['grid', 'list', 'carousel'],
		columns: [4, 3],
		count: [8, 6, 4],
		cards: ['ghost', 'outline', 'soft', 'solid'],
		avatar: ['normal', 'large', 'small'],
		socials: [true, false],
		align: ['center', 'start'],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { grid: 'Grid', list: 'List', carousel: 'Carousel' },
			hint: 'An even grid, one person per line with a line about them, or a sliding row.'
		},
		columns: { label: 'Columns', hint: 'In a carousel, the people in view at once.' },
		count: { label: 'People' },
		cards: {
			label: 'Cards',
			values: { ghost: 'None', outline: 'Outline', soft: 'Soft', solid: 'Solid' },
			hint: 'The Card variant every person shares.'
		},
		avatar: {
			label: 'Avatar',
			values: { small: 'Small', normal: 'Normal', large: 'Large' },
			hint: 'A step from the kit size; the tinted disc around it scales with it.'
		},
		socials: { label: 'Social links', values: booleanValues },
		align: {
			...alignMeta,
			hint: 'Centred profiles stack the avatar over the name; start-aligned ones sit beside it.'
		},
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	// Rows of the grid, or pages of the carousel.
	derive: (p: Params) => ({ rows: Number(p.count) / Number(p.columns) }),
	rules: [
		{
			id: 'full-rows',
			text: 'In a grid, people fill every row: the count divides by the columns',
			test: (p) => p.layout !== 'grid' || Number.isInteger(p.rows)
		},
		{
			id: 'carousel-pages',
			text: 'A carousel pages through whole views: at least two of them, and no half-empty last page',
			test: (p) => p.layout !== 'carousel' || (Number.isInteger(p.rows) && Number(p.rows) >= 2)
		},
		{
			id: 'list-start',
			text: 'A list is one column read down its start edge: columns and alignment do not apply (canonical: 4, start)',
			test: (p) => p.layout !== 'list' || (p.columns === 4 && p.align === 'start')
		},
		{
			id: 'stacked-anchor',
			text: 'A centred profile stacks the avatar over the name: a small avatar cannot anchor it',
			test: (p) => p.align !== 'center' || p.avatar !== 'small'
		},
		{
			id: 'inline-room',
			text: 'In a grid or carousel, a large avatar beside the name needs 3 columns to keep the name on one line',
			test: (p) =>
				p.layout === 'list' || p.align !== 'start' || p.avatar !== 'large' || p.columns === 3
		},
		{
			id: 'tint-cards',
			text: 'On a tint, outline rings and soft fills match the surface: solid cards or no chrome',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid' || p.cards === 'ghost'
		}
	]
};

export const teamSpotlight: SectionType = {
	id: 'team-spotlight',
	category: 'team',
	title: 'Team intro',
	description:
		'The mission and a hiring call beside the people behind it: a roster panel, or a mosaic of tiles.',
	file: 'team/TeamSpotlight.svelte',
	dims: {
		layout: ['panel', 'mosaic'],
		textCols: [5, 6, 7],
		mediaSide: ['end', 'start'],
		roster: ['list', 'avatars'],
		cards: ['solid', 'outline', 'soft'],
		stats: [true, false],
		buttons: [2, 1],
		headline: ['h2', 'h3'],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['normal', 'compact', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { panel: 'Panel', mosaic: 'Mosaic' },
			hint: 'One card holding the roster, or a mosaic with a tile per person and a lead portrait.'
		},
		textCols: {
			label: 'Text columns',
			hint: 'The roster takes the remaining columns of 12.'
		},
		mediaSide: { label: 'Roster side', values: { start: 'Start', end: 'End' } },
		roster: {
			label: 'Roster',
			values: { list: 'List', avatars: 'Avatars' },
			hint: 'People with their roles, or avatars alone with a count.'
		},
		cards: {
			label: 'Cards',
			values: { solid: 'Solid', outline: 'Outline', soft: 'Soft' },
			hint: 'The Card variant of the roster panel, or of every mosaic tile.'
		},
		stats: { label: 'Stats', values: booleanValues },
		buttons: { label: 'Buttons' },
		headline: headlineMeta,
		tone: toneMeta,
		density: densityMeta
	},
	derive: (p: Params) => ({ panelCols: 12 - Number(p.textCols) }),
	rules: [
		{
			id: 'spans-sum',
			text: 'Text and roster spans sum to 12',
			test: (p) => Number(p.textCols) + Number(p.panelCols) === 12
		},
		{
			id: 'list-room',
			text: 'A roster with roles (avatar, name, role) needs at least 6 columns',
			test: (p) => p.roster !== 'list' || Number(p.panelCols) >= 6
		},
		{
			id: 'stack-adrift',
			text: 'In a panel, an avatar stack is compact: a panel wider than 6 columns leaves it adrift (mosaic tiles grow with the columns)',
			test: (p) => p.layout === 'mosaic' || p.roster !== 'avatars' || Number(p.panelCols) <= 6
		},
		{
			id: 'stack-rings',
			text: 'In a panel, an avatar stack is separated by rings that match a soft fill: it needs a solid or outline panel',
			test: (p) => p.layout === 'mosaic' || p.roster !== 'avatars' || p.cards !== 'soft'
		},
		{
			id: 'h2-room',
			text: 'An H2 needs a text column of at least 6 of 12',
			test: (p) => p.headline !== 'h2' || Number(p.textCols) >= 6
		},
		{
			id: 'tint-cards',
			text: 'On a tint, an outline ring or a soft fill matches the surface: the roster takes solid cards',
			test: (p) => p.tone !== 'tint' || p.cards === 'solid'
		}
	]
};

export const sectionTypes = [teamGrid, teamSpotlight];
