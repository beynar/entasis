import { resolve } from '$app/paths';
import type { ResolvedPathname, RouteId } from '$app/types';
import type { SidebarGroup } from '$lib/components/Sidebar/index.js';
import { componentNavigationSections } from './componentNavigation.generated.js';
import { blockCategories, blockGroups } from './blocks/catalog.js';
import { workflowBlocks } from './blocks/blocks.js';

/**
 * `resolve()` is typed one route id at a time, so a union of ids — navigation data, a
 * related-components list — cannot be spread into its argument tuple. Every id the docs site links
 * to is parameterless, so narrowing to one such id drops only the params half of that tuple.
 */
export function resolveLink(href: RouteId): ResolvedPathname {
	return resolve(href as '/');
}

export type AppNavigationLink = {
	href: RouteId;
	text: string;
};

export const headerLinks: AppNavigationLink[] = [
	{ href: '/docs', text: 'Docs' },
	{ href: '/components', text: 'Components' },
	{ href: '/blocks', text: 'Blocks' },
	{ href: '/templates', text: 'Templates' },
	{ href: '/playground', text: 'Playground' },
	{ href: '/colors', text: 'Colors' }
];

const gettingStartedLinks: AppNavigationLink[] = [
	{ href: '/docs', text: 'Theme & setup' },
	{ href: '/docs/conventions', text: 'Conventions' },
	{ href: '/docs/colors', text: 'Color system' },
	{ href: '/docs/tokens', text: 'Tokens' },
	{ href: '/docs/motion', text: 'Motion' },
	{ href: '/docs/consistency', text: 'Consistency rules' },
	{ href: '/docs/theme-transitions', text: 'Theme transitions' },
	{ href: '/docs/i18n', text: 'Internationalization' },
	{ href: '/stress', text: 'Stress test' }
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
