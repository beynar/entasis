import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { findBlock } from '../../../../blocks/catalog.js';
import type { PageLoad } from './$types.js';

const components = import.meta.glob<{ default: Component }>(
	'../../../../blocks/catalog/*/*.svelte'
);

export const load: PageLoad = async ({ params, url }) => {
	const selection = findBlock(params.category, params.block);
	if (!selection) error(404, 'Block not found');
	const loadComponent = components[`../../../../blocks/catalog/${selection.block.file}`];
	if (!loadComponent) error(500, `Preview unavailable: ${selection.block.title}`);
	return {
		...selection,
		Preview: (await loadComponent()).default,
		embed: url.searchParams.get('embed')
	};
};
