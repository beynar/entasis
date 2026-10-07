import type { Direction } from './types.js';

/**
 * Art directions sit above the legal space. Each one fixes its tokens by naming an Entasis theme
 * preset and palette (applied through the global theme, so the docs' own theme controls keep
 * working), narrows a few levers, biases others with weights, and lists the page rules that bind
 * its sections together. Narrowing is the only way a direction excludes a variant; weights only
 * change how often one is picked.
 */
export const directions: Direction[] = [
	{
		id: 'neutral',
		label: 'Neutral',
		description: 'The whole legal space, unbiased. Only the structural page rules apply.',
		preset: 'balanced',
		palette: 'default',
		pageRules: ['hero-leads-type', 'single-inverse', 'single-brand', 'no-compact-run']
	},
	{
		id: 'swiss',
		label: 'Swiss Editorial',
		description:
			'Flush-left type on quiet surfaces, generous rhythm, and a strict alternation of tones.',
		preset: 'editorial',
		palette: 'graphite',
		narrow: {
			'*': {
				align: ['start'],
				tone: ['plain', 'muted', 'inverse'],
				cards: ['ghost', 'outline'],
				eyebrow: [false, 'none', 'link']
			},
			// Quiet ink: neutral or primary actions, outlined chips, understated secondary links.
			kit: { accent: ['neutral', 'primary'], chip: ['outline'], secondary: ['link', 'ghost'] }
		},
		weights: {
			'*': {
				density: { comfortable: 2, normal: 1, compact: 0.5 },
				headline: { h1: 2 },
				media: { photo: 2, pattern: 0.5 }
			}
		},
		pageRules: ['adjacent-tones-differ', 'hero-leads-type', 'single-inverse', 'alternate-media']
	},
	{
		id: 'calm',
		label: 'Calm Luxury',
		description: 'Centred, airy compositions with one action at a time and soft surfaces only.',
		preset: 'spacious',
		palette: 'amber',
		narrow: {
			'*': {
				density: ['comfortable'],
				tone: ['plain', 'muted'],
				align: ['center'],
				buttons: [1],
				actions: [1],
				cards: ['ghost', 'soft']
			},
			hero: { media: ['photo', 'none'] },
			kit: { size: ['large', 'normal'], chip: ['outline', 'soft'], secondary: ['link', 'ghost'] }
		},
		weights: {
			'*': { media: { photo: 3 } }
		},
		pageRules: ['hero-leads-type', 'alternate-media']
	},
	{
		id: 'brutalist',
		label: 'Bold Brutalist',
		description: 'Hard edges, compact bands, loud tones, and the largest type the grid allows.',
		preset: 'sharp',
		palette: 'violet',
		narrow: {
			'*': {
				density: ['compact', 'normal'],
				cards: ['solid', 'outline'],
				headline: ['h1', 'h2']
			},
			kit: {
				primary: ['solid'],
				secondary: ['outline'],
				chip: ['solid'],
				size: ['large', 'normal']
			}
		},
		weights: {
			'*': {
				tone: { inverse: 3, brand: 3, tint: 2, plain: 1, muted: 0.5 },
				headline: { h1: 3 },
				media: { pattern: 3 }
			}
		},
		pageRules: ['adjacent-tones-differ', 'alternate-media']
	},
	{
		id: 'playful',
		label: 'Playful DTC',
		description: 'Rounded, tinted, and centred — warm colour blocks with friendly soft cards.',
		preset: 'rounded',
		palette: 'rose',
		narrow: {
			'*': {
				tone: ['plain', 'tint', 'brand', 'muted'],
				cards: ['soft', 'solid']
			},
			kit: { accent: ['primary'], chip: ['solid', 'soft'], size: ['large', 'normal'] }
		},
		weights: {
			'*': {
				tone: { tint: 3, brand: 2 },
				align: { center: 3 },
				shape: { pill: 3 }
			},
			kit: { primary: { soft: 2 } }
		},
		pageRules: ['adjacent-tones-differ', 'hero-leads-type', 'single-brand']
	}
];

export const defaultDirection = directions[0];

export const findDirection = (id: string | null | undefined) =>
	directions.find((direction) => direction.id === id) ?? defaultDirection;
