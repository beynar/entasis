import { SPEC_VERSION } from './engine/spec.js';
import type { PageSpec } from './engine/types.js';

/**
 * Page outlines: which section types a page is made of, in order. The engine fills in every
 * section's levers from the seed; the outline itself is the composer's starting point.
 */
export interface Recipe {
	id: string;
	label: string;
	description: string;
	types: string[];
}

export const recipes: Recipe[] = [
	{
		id: 'landing',
		label: 'Landing page',
		description: 'The full argument: proof, features, numbers, voices, plans, answers.',
		types: [
			'navbar-bar',
			'hero-split',
			'logos-strip',
			'feature-grid',
			'stats-row',
			'testimonial-quote',
			'pricing-tiers',
			'faq-split',
			'cta-band',
			'footer-columns'
		]
	},
	{
		id: 'product',
		label: 'Product tour',
		description: 'Two feature beats around a customer story.',
		types: [
			'navbar-floating',
			'hero-centered',
			'feature-split',
			'feature-grid',
			'testimonial-wall',
			'cta-split',
			'footer-statement'
		]
	},
	{
		id: 'company',
		label: 'Company page',
		description: 'Who is behind it, and why it matters.',
		types: [
			'navbar-bar',
			'hero-centered',
			'stats-panel',
			'team-grid',
			'logos-grid',
			'newsletter-inline',
			'footer-columns'
		]
	},
	{
		id: 'minimal',
		label: 'Minimal launch',
		description: 'A headline, three reasons, and a sign-up.',
		types: ['navbar-floating', 'hero-split', 'feature-grid', 'newsletter-card', 'footer-statement']
	}
];

/** An outline as an ungenerated spec: slots with stable ids and empty levers. */
export function specFromRecipe(recipe: Recipe, seed: string, direction: string): PageSpec {
	return {
		version: SPEC_VERSION,
		seed,
		direction,
		sections: recipe.types.map((type, index) => ({
			id: `s${index + 1}`,
			type,
			params: {},
			locked: false,
			nonce: 0
		}))
	};
}
