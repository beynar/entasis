import type { SidebarGroup } from '$lib/components/Sidebar/index.js';
import { componentNavigationSections } from './componentNavigation.generated.js';
import { blockCategories, blockGroups } from './blocks/catalog.js';
import { workflowBlocks } from './blocks/blocks.js';

export type AppNavigationLink = {
	href: string;
	text: string;
};

export const headerLinks: AppNavigationLink[] = [
	{ href: '/docs', text: 'Docs' },
	{ href: '/components', text: 'Components' },
	{ href: '/blocks', text: 'Blocks' },
	{ href: '/playground', text: 'Playground' },
	{ href: '/colors', text: 'Colors' }
];

const gettingStartedLinks: AppNavigationLink[] = [
	{ href: '/docs', text: 'Theme & setup' },
	{ href: '/docs/conventions', text: 'Conventions' },
	{ href: '/docs/colors', text: 'Color system' },
	{ href: '/docs/theme-transitions', text: 'Theme transitions' },
	{ href: '/docs/i18n', text: 'Internationalization' }
];

const additionalUtilityLinks: AppNavigationLink[] = [
	{ href: '/utilities/dnd', text: 'Dnd list' },
	{ href: '/utilities/raised', text: 'Raised' },
	{ href: '/utilities/scroll-fade', text: 'Scroll fade' },
	{ href: '/utilities/shimmer', text: 'Shimmer' }
];

const sidebarSections: Array<{ label: string; links: AppNavigationLink[] }> = [
	{ label: 'Getting Started', links: gettingStartedLinks },
	...componentNavigationSections.map((section) => ({
		label: section.label,
		links:
			section.label === 'Utilities'
				? [...section.links, ...additionalUtilityLinks]
				: [...section.links]
	}))
];

export function getSidebarGroups(routeId: string | null | undefined): SidebarGroup[] {
	if (routeId?.startsWith('/blocks')) {
		return [
			{ items: [{ label: 'All blocks', href: '/blocks', isActive: routeId === '/blocks' }] },
			...blockGroups.map((group) => ({
				label: group,
				items: blockCategories
					.filter((category) => category.group === group)
					.map((category) => ({
						label: category.title,
						href: `/blocks/${category.slug}`,
						badge: category.blocks.length,
						isActive:
							routeId === `/blocks/${category.slug}` ||
							routeId.startsWith(`/blocks/${category.slug}/`)
					}))
			})),
			{
				label: 'Application workflows',
				items: workflowBlocks.map((block) => ({
					label: block.title,
					href: `/blocks/${block.slug}`,
					isActive: routeId === `/blocks/${block.slug}`
				}))
			}
		];
	}
	return sidebarSections.map((section) => ({
		label: section.label,
		items: section.links.map((link) => ({
			label: link.text,
			href: link.href,
			isActive: routeId === link.href
		}))
	}));
}
