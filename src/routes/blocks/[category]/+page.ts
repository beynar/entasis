import { error } from '@sveltejs/kit';
import { blockCategories } from '../catalog.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params }) => {
	const category = blockCategories.find((category) => category.slug === params.category);
	if (!category) error(404, 'Block category not found');
	return { category };
};
