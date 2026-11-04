// How a Pagination appears to AI agents: `go_to_page`.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { followLink, siteAddress } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf, toolOptions, toolText } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';

export type PaginationToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly label: unknown;
	readonly disabled: boolean;
	readonly page: number;
	readonly pageCount: number;
	readonly href: (page: number) => string | undefined;
	readonly setPage: (page: number) => void;
};

export const expose: WebMCPExpose<PaginationToolSource> = (source, config) =>
	watchWebMCPTool(
		() => {
			const { pageCount, page } = source;
			if (source.disabled || pageCount < 2) return null;
			const options = toolOptions(source.tool);
			const name = toolText(source.label);
			return {
				name: options.name ?? 'go_to_page',
				title: options.title,
				description:
					options.description ??
					`Goes to a page of ${name || 'the paginated list'}: page ${page} of ${pageCount} is showing.`,
				inputSchema: {
					type: 'object',
					properties: { page: { type: 'integer', minimum: 1, maximum: pageCount } },
					required: ['page'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? false },
				execute: ({ page: next }: { page: unknown }) => {
					if (typeof next !== 'number' || !Number.isInteger(next)) return { status: 'invalid' };
					if (next < 1 || next > source.pageCount) return { status: 'invalid' };
					// As a press does: the page changes, and a link is followed on top of that.
					source.setPage(next);
					const to = siteAddress(source.href(next));
					if (to) followLink(to);
					return { status: 'done', page: next };
				}
			};
		},
		() => ({ exposedTo: exposureOf(source.tool, config), modal: config.surface })
	);
