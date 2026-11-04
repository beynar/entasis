// How Breadcrumbs appear to AI agents: their links, in `navigate`. A crumb with a menu gets there
// through its PopupMenu.

import { watchWebMCP, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { contributeLinks, type WebMCPLink } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { BreadcrumbItem } from './breadcrumbs.props.js';

export type BreadcrumbsToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly items: readonly BreadcrumbItem[];
};

export const expose: WebMCPExpose<BreadcrumbsToolSource> = (source, config) => {
	let links: WebMCPLink[] = [];
	const contribution = contributeLinks(() => links);
	const stop = watchWebMCP(() => {
		const exposedTo = exposureOf(source.tool, config);
		links = source.items.map(({ href, label, disabled, active }) => ({
			href,
			label,
			disabled: disabled || active,
			exposedTo,
			surface: config.surface
		}));
		contribution.refresh();
	});
	return () => {
		stop();
		contribution.remove();
	};
};
