import { applicationCategories } from './catalog/application.js';
import { commerceContentCategories } from './catalog/commerce-content.js';
import { marketingCategories } from './catalog/marketing.js';
import type { BlockGroup } from './catalog/types.js';

export const blockGroups: BlockGroup[] = ['Marketing', 'Application', 'Commerce', 'Content'];

export const blockCategories = [
	...marketingCategories,
	...applicationCategories,
	...commerceContentCategories
].sort((left, right) => left.title.localeCompare(right.title));

export const blockCount = blockCategories.reduce(
	(count, category) => count + category.blocks.length,
	0
);

export function findBlock(categorySlug: string, blockId: string) {
	const category = blockCategories.find((category) => category.slug === categorySlug);
	const block = category?.blocks.find((block) => block.id === blockId);
	return category && block ? { category, block } : undefined;
}
