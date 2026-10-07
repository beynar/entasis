import {
	alignMeta,
	booleanValues,
	densityMeta,
	headlineMeta,
	toneMeta
} from '../../engine/levers.js';
import type { Rule, SectionType } from '../../engine/types.js';

const compactHeadline: Rule = {
	id: 'compact-h3',
	text: 'Compact padding pairs with an H3 heading',
	test: (p) => p.density !== 'compact' || p.headline === 'h3'
};

export const newsletterInline: SectionType = {
	id: 'newsletter-inline',
	category: 'newsletter',
	title: 'Inline signup',
	description:
		'A heading and an email field, side by side or stacked, open on the section or boxed in a panel.',
	file: 'newsletter/NewsletterInline.svelte',
	dims: {
		layout: ['inline', 'stacked'],
		arrangement: ['open', 'boxed'],
		align: ['start', 'center'],
		headline: ['h2', 'h3'],
		consent: [false, true],
		proof: ['none', 'count'],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { inline: 'Beside the form', stacked: 'Above the form' },
			hint: 'Where the copy sits relative to the email field.'
		},
		arrangement: {
			label: 'Form',
			values: { open: 'On the section', boxed: 'Boxed panel' },
			hint: 'A boxed form sits in an inset panel one surface step off the section.'
		},
		align: alignMeta,
		headline: headlineMeta,
		consent: { label: 'Consent checkbox', values: booleanValues },
		proof: { label: 'Proof', values: { none: 'None', count: 'Reader count' } },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'inline-start',
			text: 'Copy beside the form reads from the start edge (canonical: start when inline)',
			test: (p) => p.layout !== 'inline' || p.align === 'start'
		},
		{
			id: 'fine-print',
			text: 'Beside the copy, the form column holds one line of fine print: consent or a reader count, not both',
			test: (p) => p.layout !== 'inline' || !(p.consent && p.proof === 'count')
		},
		compactHeadline,
		{
			id: 'consent-brand',
			text: 'A checked consent box fills with the primary colour: on a brand surface it needs the boxed panel',
			test: (p) => !p.consent || p.tone !== 'brand' || p.arrangement === 'boxed'
		}
	]
};

export const newsletterCard: SectionType = {
	id: 'newsletter-card',
	category: 'newsletter',
	title: 'Signup card',
	description:
		'A raised card holding the signup form, inset on its own or beside media, or split into two panes.',
	file: 'newsletter/NewsletterCard.svelte',
	dims: {
		layout: ['inset', 'split'],
		media: ['none', 'pattern', 'photo'],
		mediaSide: ['end', 'start'],
		width: ['narrow', 'content'],
		cards: ['solid', 'outline', 'soft'],
		headline: ['h2', 'h3'],
		perks: [true, false],
		tone: ['plain', 'muted', 'tint', 'inverse', 'brand'],
		density: ['compact', 'normal', 'comfortable']
	},
	meta: {
		layout: {
			label: 'Layout',
			values: { inset: 'Inset', split: 'Split panes' },
			hint: 'Split cuts the card into a flush photo or colour pane and the form pane.'
		},
		media: { label: 'Media', values: { none: 'None', pattern: 'Pattern', photo: 'Photo' } },
		mediaSide: { label: 'Media side', values: { start: 'Start', end: 'End' } },
		width: {
			label: 'Card width',
			values: { narrow: 'Narrow', content: 'Content' },
			hint: 'A narrow card centres its copy; a content-width card sets the form beside it.'
		},
		cards: {
			label: 'Card',
			values: { outline: 'Outline', soft: 'Soft', solid: 'Solid' },
			hint: 'The Card variant holding the form.'
		},
		headline: headlineMeta,
		perks: { label: 'Perks', values: booleanValues },
		tone: toneMeta,
		density: densityMeta
	},
	rules: [
		{
			id: 'side-needs-media',
			text: 'Media side only applies when there is media or a split pane (canonical: end)',
			test: (p) => p.media !== 'none' || p.layout === 'split' || p.mediaSide === 'end'
		},
		{
			id: 'media-room',
			text: 'Media or a split pane beside the form needs a content-width card',
			test: (p) => (p.media === 'none' && p.layout === 'inset') || p.width === 'content'
		},
		{
			id: 'split-pane',
			text: 'A split pane shows a photo edge to edge, or the perks on a colour field: a pattern needs its frame',
			test: (p) =>
				p.layout !== 'split' || p.media === 'photo' || (p.media === 'none' && p.perks === true)
		},
		{
			id: 'colour-solid',
			text: 'On a tint or brand surface only a solid card stands off the colour',
			test: (p) => (p.tone !== 'tint' && p.tone !== 'brand') || p.cards === 'solid'
		},
		{
			id: 'soft-contrast',
			text: 'A soft card fades into a muted surface',
			test: (p) => p.cards !== 'soft' || p.tone !== 'muted'
		},
		compactHeadline
	]
};

export const sectionTypes = [newsletterInline, newsletterCard];
