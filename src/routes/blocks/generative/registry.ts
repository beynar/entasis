import type { SectionCategory, SectionType } from './engine/types.js';

/**
 * The generative catalogue: twelve section categories, two section types each. Categories are
 * listed in the order a landing page usually reads, which is also the library order in the
 * composer.
 */
export const sectionCategories: SectionCategory[] = [
	{
		slug: 'navbar',
		title: 'Navbar',
		description: 'Site headers that pin to the top of a page.',
		order: 0
	},
	{
		slug: 'hero',
		title: 'Hero',
		description: 'The opening statement: headline, actions, and media.',
		order: 1
	},
	{
		slug: 'logos',
		title: 'Logos',
		description: 'Customer and partner proof, as a strip or a wall.',
		order: 2
	},
	{
		slug: 'feature',
		title: 'Feature',
		description: 'What the product does, as a grid or a spotlight.',
		order: 3
	},
	{
		slug: 'stats',
		title: 'Stats',
		description: 'Numbers that carry the argument.',
		order: 4
	},
	{
		slug: 'testimonial',
		title: 'Testimonial',
		description: 'Customer voices, one at a time or as a wall.',
		order: 5
	},
	{
		slug: 'pricing',
		title: 'Pricing',
		description: 'Plans side by side, or a single offer.',
		order: 6
	},
	{
		slug: 'faq',
		title: 'FAQ',
		description: 'Answers before the questions are asked.',
		order: 7
	},
	{
		slug: 'team',
		title: 'Team',
		description: 'The people behind the product.',
		order: 8
	},
	{
		slug: 'newsletter',
		title: 'Newsletter',
		description: 'Email capture, inline or as a card.',
		order: 9
	},
	{
		slug: 'cta',
		title: 'CTA',
		description: 'The closing call to action.',
		order: 10
	},
	{
		slug: 'footer',
		title: 'Footer',
		description: 'Site footers that close a page.',
		order: 11
	}
];

const definitionModules = import.meta.glob<{ sectionTypes: SectionType[] }>(
	'./sections/*/definitions.ts',
	{ eager: true }
);

export const sectionTypes: SectionType[] = sectionCategories.flatMap(
	(category) => definitionModules[`./sections/${category.slug}/definitions.ts`]?.sectionTypes ?? []
);

const typesById = new Map(sectionTypes.map((type) => [type.id, type]));

export const lookupSection = (id: string): SectionType | undefined => typesById.get(id);

export const typesInCategory = (slug: string) =>
	sectionTypes.filter((type) => type.category === slug);

export const findCategory = (slug: string) =>
	sectionCategories.find((category) => category.slug === slug);
