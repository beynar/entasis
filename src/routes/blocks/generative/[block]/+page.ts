import { error } from '@sveltejs/kit';
import { findCategory, lookupSection } from '../registry.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params }) => {
	const type = lookupSection(params.block);
	const category = type && findCategory(type.category);
	if (!type || !category) error(404, 'Generative block not found');
	return { typeId: type.id, category };
};
