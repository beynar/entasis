// How Tabs appear to AI agents: `select_tab`, its options the tabs a person could pick.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { followLink, siteAddress } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf, toolOptions, toolText } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';

export type TabsToolOption = {
	value: string;
	label: unknown;
	href: string | undefined;
	disabled: boolean;
};

export type TabsToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly tabs: readonly TabsToolOption[];
	readonly active: string | undefined;
	readonly select: (value: string) => void;
};

export const expose: WebMCPExpose<TabsToolSource> = (source, config) =>
	watchWebMCPTool(
		() => {
			const tabs = source.tabs.filter((tab) => !tab.disabled);
			if (tabs.length < 2) return null;
			const options = toolOptions(source.tool);
			const titled = tabs.map(({ value, label }) => ({
				const: value,
				title: toolText(label) || value
			}));
			const showing = titled.find((tab) => tab.const === source.active)?.title;
			return {
				name: options.name ?? 'select_tab',
				title: options.title,
				description:
					options.description ??
					`Switches between these tabs: ${titled.map((tab) => tab.title).join(', ')}.${showing ? ` "${showing}" is showing.` : ''}`,
				inputSchema: {
					type: 'object',
					properties: {
						value: { type: 'string', enum: tabs.map((tab) => tab.value), oneOf: titled }
					},
					required: ['value'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? false },
				execute: ({ value }: { value: string }) => {
					const tab = source.tabs.find((candidate) => candidate.value === value);
					if (!tab || tab.disabled) return { status: 'unavailable' };
					source.select(value);
					const to = siteAddress(tab.href);
					if (to) followLink(to);
					return { status: 'done', value };
				}
			};
		},
		() => ({ exposedTo: exposureOf(source.tool, config), modal: config.surface })
	);
