import { resolve } from '$app/paths';
import type { ResolvedPathname, RouteId } from '$app/types';
import type { SidebarGroup, SidebarView } from '$lib/components/Sidebar/index.js';
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

const toolLinks: AppNavigationLink[] = [
	{ href: '/playground', text: 'Playground' },
	{ href: '/colors', text: 'Colors' }
];

const templateLinks: AppNavigationLink[] = [
	{ href: '/templates', text: 'All templates' },
	{ href: '/templates/tasks-dashboard', text: 'Tasks dashboard' }
];

const componentSections: Array<{ label: string; links: AppNavigationLink[] }> =
	componentNavigationSections.map((section) => ({
		label: section.label,
		links:
			section.label === 'Utilities'
				? [...section.links, ...additionalUtilityLinks]
				: [...section.links]
	}));

const sidebarSections: Array<{ label: string; links: AppNavigationLink[] }> = [
	{ label: 'Getting Started', links: gettingStartedLinks },
	...componentSections
];

const linkGroup = (
	label: string,
	links: AppNavigationLink[],
	routeId: string | null | undefined
): SidebarGroup => ({
	label,
	items: links.map((link) => ({
		label: link.text,
		href: link.href,
		isActive: routeId === link.href
	}))
});

function blockSidebarGroups(routeId: string): SidebarGroup[] {
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

export type DocsSidebarView = 'docs' | 'components' | 'blocks' | 'templates';

/**
 * The sidebar view a route shows: one per header section. Playground and Colors are single pages
 * with no list of their own, so they sit in the Docs view beside the theme topics they belong to.
 */
export function getSidebarView(routeId: string | null | undefined): DocsSidebarView {
	if (routeId?.startsWith('/blocks')) return 'blocks';
	if (routeId?.startsWith('/templates')) return 'templates';
	if (
		routeId?.startsWith('/docs') ||
		routeId === '/playground' ||
		routeId === '/colors' ||
		routeId === '/stress'
	)
		return 'docs';
	return 'components';
}

/**
 * The docs sidebar's views, keyed in the header's order: a view later in the header slides in from
 * the inline end, an earlier one slides back, so the sidebar moves the way the header does.
 */
export function getSidebarViews(
	routeId: string | null | undefined
): Record<DocsSidebarView, SidebarView> {
	return {
		docs: {
			label: 'Docs',
			items: [
				linkGroup('Getting Started', gettingStartedLinks, routeId),
				linkGroup('Tools', toolLinks, routeId)
			]
		},
		components: {
			label: 'Components',
			items: componentSections.map((section) => linkGroup(section.label, section.links, routeId))
		},
		blocks: { label: 'Blocks', items: blockSidebarGroups(routeId ?? '') },
		templates: { label: 'Templates', items: [linkGroup('Templates', templateLinks, routeId)] }
	};
}

/** Every page the command palette searches: the blocks catalog on its own section, all docs otherwise. */
export function getSidebarGroups(routeId: string | null | undefined): SidebarGroup[] {
	if (routeId?.startsWith('/blocks')) return blockSidebarGroups(routeId);
	return sidebarSections.map((section) => linkGroup(section.label, section.links, routeId));
}
