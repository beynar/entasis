// How a Command appears to AI agents: its items, as options of `run_command`. A palette needs no
// opening; while a person has it open, only its items stay on offer.

import type { WebMCPChoice } from '$lib/utils/webmcp/webmcp.choices.js';
import { commandTool } from '$lib/utils/webmcp/webmcp.commands.js';
import { watchWebMCP, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { followLink, siteAddress } from '$lib/utils/webmcp/webmcp.navigation.js';
import { exposureOf, toolOptions } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { CommandGroup, CommandItem } from './command.props.js';

export type CommandToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly groups: readonly CommandGroup[];
	/** The palette's Dialog while it is open. */
	readonly surface: string | undefined;
	readonly select: (item: CommandItem) => void;
};

export const expose: WebMCPExpose<CommandToolSource> = (source, config) => {
	let choices: WebMCPChoice[] = [];
	const contribution = commandTool.contribute(() => choices);
	const stop = watchWebMCP(() => {
		const { consequential } = toolOptions(source.tool);
		const exposedTo = exposureOf(source.tool, config);
		const surface = source.surface ?? config.surface;
		choices = source.groups.flatMap((group) =>
			group.items
				.filter((item) => !item.disabled)
				.map((item) => ({
					key: item,
					id: item.value,
					label: group.heading ? `${group.heading} > ${item.label}` : item.label,
					description: item.description,
					consequential,
					exposedTo,
					surface,
					run: () => {
						source.select(item);
						const to = siteAddress(item.href);
						if (to) followLink(to);
					}
				}))
		);
		contribution.refresh();
	});
	return () => {
		stop();
		contribution.remove();
	};
};
