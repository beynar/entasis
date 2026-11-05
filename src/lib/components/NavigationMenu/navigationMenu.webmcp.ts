// How a NavigationMenu appears to AI agents: its links, panels included, in `navigate`.

import { watchWebMCP, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { contributeLinks, type WebMCPLink } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { NavigationMenuItem, NavigationMenuLink } from './navigationMenu.props.js';

export type NavigationMenuToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly items: readonly NavigationMenuItem[];
};

const toLink = ({
	href,
	label,
	description,
	disabled,
	target
}: NavigationMenuLink): WebMCPLink => ({
	href,
	label,
	description,
	disabled,
	target
});

function linksOf(items: readonly NavigationMenuItem[]): WebMCPLink[] {
	return items.flatMap((item) => {
		if (item.type === 'link') return [toLink(item)];
		if (item.disabled) return [];
		const content = Array.isArray(item.content) ? item.content.map(toLink) : [];
		return [...content, ...linksOf(item.items ?? [])];
	});
}

export const expose: WebMCPExpose<NavigationMenuToolSource> = (source, config) => {
	let links: WebMCPLink[] = [];
	const contribution = contributeLinks(() => links);
	const stop = watchWebMCP(() => {
		const exposedTo = exposureOf(source.tool, config);
		links = linksOf(source.items).map((link) => ({ ...link, exposedTo, surface: config.surface }));
		contribution.refresh();
	});
	return () => {
		stop();
		contribution.remove();
	};
};
