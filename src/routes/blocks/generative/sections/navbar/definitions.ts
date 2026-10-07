import { booleanValues, densityMeta, toneMeta } from '../../engine/levers.js';
import type { SectionType } from '../../engine/types.js';

export const navbarBar: SectionType = {
	id: 'navbar-bar',
	category: 'navbar',
	title: 'Inline bar',
	description: 'A full-width bar: wordmark, links, and actions, on one row or two.',
	file: 'navbar/NavbarBar.svelte',
	placement: 'top',
	dims: {
		arrangement: ['single', 'utility', 'stacked'],
		layout: ['spread', 'centered', 'split'],
		links: [3, 4, 5],
		actions: [1, 2],
		badge: [false, true],
		border: [false, true],
		tone: ['plain', 'muted', 'inverse', 'brand'],
		density: ['compact', 'normal']
	},
	meta: {
		arrangement: {
			label: 'Arrangement',
			values: { single: 'One row', utility: 'Utility row', stacked: 'Links below' },
			hint: 'Utility: an announcement and secondary links above the bar. Links below: the links take their own row under the wordmark.'
		},
		layout: {
			label: 'Layout',
			values: { spread: 'Spread', centered: 'Centred links', split: 'Centred mark' }
		},
		links: { label: 'Links' },
		actions: { label: 'Actions' },
		badge: { label: 'Release badge', values: booleanValues },
		border: { label: 'Divider', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'split-links',
			text: 'A centred wordmark leaves four links room on its row; links below it get a row of their own',
			test: (p) => p.layout !== 'split' || p.arrangement === 'stacked' || Number(p.links) <= 4
		},
		{
			id: 'utility-badge',
			text: 'The utility row announces the release, so a badge would repeat it',
			test: (p) => !p.badge || p.arrangement !== 'utility'
		},
		{
			id: 'utility-sign-in',
			text: 'The utility row carries Sign in, so the bar below keeps a single action',
			test: (p) => p.arrangement !== 'utility' || p.actions === 1
		},
		{
			id: 'badge-room',
			text: 'The release badge only fits beside a leading wordmark',
			test: (p) => !p.badge || p.layout === 'spread'
		},
		{
			id: 'badge-tone',
			text: 'The release badge reads on surface tones, not on brand colour',
			test: (p) => !p.badge || p.tone !== 'brand'
		},
		{
			id: 'divider-surface',
			text: 'A divider only shows on surface tones (canonical: off elsewhere)',
			test: (p) => !p.border || p.tone === 'plain' || p.tone === 'muted'
		},
		{
			id: 'brand-single-action',
			text: 'A brand-coloured bar keeps a single action',
			test: (p) => p.tone !== 'brand' || p.actions === 1
		}
	]
};

export const navbarFloating: SectionType = {
	id: 'navbar-floating',
	category: 'navbar',
	title: 'Floating bar',
	description: 'A raised bar that floats over the page surface, whole or in separate pieces.',
	file: 'navbar/NavbarFloating.svelte',
	placement: 'top',
	dims: {
		layout: ['joined', 'split', 'islands'],
		width: ['content', 'narrow'],
		shape: ['rounded', 'pill'],
		elevation: ['outline', 'raised'],
		links: [3, 4],
		actions: [1, 2],
		tone: ['plain', 'muted', 'tint', 'inverse'],
		density: ['compact', 'normal']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { joined: 'One bar', split: 'Two bars', islands: 'Floating links' },
			hint: 'Two bars: the wordmark and links float apart from the actions. Floating links: only the links float; the wordmark and actions sit on the page.'
		},
		width: { label: 'Width', values: { content: 'Content', narrow: 'Narrow' } },
		shape: { label: 'Shape', values: { rounded: 'Rounded', pill: 'Pill' } },
		elevation: { label: 'Edge', values: { outline: 'Outline', raised: 'Raised' } },
		links: { label: 'Links' },
		actions: { label: 'Actions' },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'narrow-room',
			text: 'A narrow bar holds three links and one action',
			test: (p) => p.width !== 'narrow' || (p.links === 3 && p.actions === 1)
		},
		{
			id: 'apart-width',
			text: 'Pieces floating apart need the content width to leave a gap between them: only one bar narrows',
			test: (p) => p.layout === 'joined' || p.width === 'content'
		},
		{
			id: 'pill-compact',
			text: 'A pill keeps its height: compact density only',
			test: (p) => p.shape !== 'pill' || p.density === 'compact'
		}
	]
};

export const sectionTypes = [navbarBar, navbarFloating];
