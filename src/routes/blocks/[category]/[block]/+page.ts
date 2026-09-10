import { error } from '@sveltejs/kit';
import { findBlock } from '../../catalog.js';
import type { PageLoad } from './$types.js';

export const load: PageLoad = ({ params }) => {
	const selection = findBlock(params.category, params.block);
	if (!selection) error(404, 'Block not found');
	return selection;
};
