// How a Sidebar appears to AI agents: its links, in `navigate`, and the rows that only run a
// handler, in `run_command`. A row with a popup menu gets there through its PopupMenu.

import type { WebMCPChoice } from '$lib/utils/webmcp/webmcp.choices.js';
import { commandTool } from '$lib/utils/webmcp/webmcp.commands.js';
import { watchWebMCP, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { contributeLinks, type WebMCPLink } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type {
	SidebarActivityBar,
	SidebarGroup,
	SidebarMenuEntry,
	SidebarMenuSubEntry
} from './sidebar.props.js';

export type SidebarToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly activityBar: SidebarActivityBar | undefined;
	readonly items: readonly SidebarGroup[] | undefined;
	readonly views: Readonly<Record<string, { items?: SidebarGroup[] }>> | undefined;
};

type Row = (SidebarMenuEntry | SidebarMenuSubEntry) & { items?: SidebarMenuSubEntry[] };

function collect(rows: readonly Row[], links: WebMCPLink[], commands: WebMCPChoice[]): void {
	for (const row of rows) {
		const disabled = 'disabled' in row && Boolean(row.disabled);
		if (row.href) {
			const target = 'target' in row ? (row.target as string | undefined) : undefined;
			links.push({ href: row.href, label: row.label, disabled, target });
		} else if (row.onclick && !disabled && !row.items?.length) {
			const { onclick } = row;
			commands.push({
				key: row,
				label: row.label,
				run: () => onclick(new MouseEvent('click', { bubbles: true, cancelable: true }))
			});
		}
		if (row.items) collect(row.items, links, commands);
	}
}

export const expose: WebMCPExpose<SidebarToolSource> = (source, config) => {
	let links: WebMCPLink[] = [];
	let commands: WebMCPChoice[] = [];
	const linkSource = contributeLinks(() => links);
	const commandSource = commandTool.contribute(() => commands);
	const stop = watchWebMCP(() => {
		const exposedTo = exposureOf(source.tool, config);
		const nextLinks: WebMCPLink[] = [];
		const nextCommands: WebMCPChoice[] = [];
		const groups = [
			...(source.items ?? []),
			...Object.values(source.views ?? {}).flatMap((view) => view.items ?? [])
		];
		for (const group of groups) collect((group.items ?? []) as Row[], nextLinks, nextCommands);
		for (const item of source.activityBar?.items ?? []) {
			nextLinks.push({ href: item.href, label: item.label, target: item.target });
		}
		links = nextLinks.map((link) => ({ ...link, exposedTo, surface: config.surface }));
		commands = nextCommands.map((command) => ({ ...command, exposedTo, surface: config.surface }));
		linkSource.refresh();
		commandSource.refresh();
	});
	return () => {
		stop();
		linkSource.remove();
		commandSource.remove();
	};
};
