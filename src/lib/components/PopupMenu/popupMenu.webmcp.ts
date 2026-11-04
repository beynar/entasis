// How a PopupMenu appears to AI agents: its rows, as options of `run_command`.

import { commandTool } from '$lib/utils/webmcp/webmcp.commands.js';
import { watchWebMCP, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import { menuChoices } from '../Menu/menu.webmcp.js';
import type { MenuItem } from '../Menu/menu.props.js';

export type PopupMenuToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly items: readonly MenuItem[];
};

export const expose: WebMCPExpose<PopupMenuToolSource> = (source, config) => {
	let choices: ReturnType<typeof menuChoices> = [];
	const contribution = commandTool.contribute(() => choices);
	const stop = watchWebMCP(() => {
		const { consequential, title } = toolOptions(source.tool);
		choices = menuChoices(
			source.items,
			{ exposedTo: exposureOf(source.tool, config), consequential, surface: config.surface },
			title ? [title] : []
		);
		contribution.refresh();
	});
	return () => {
		stop();
		contribution.remove();
	};
};
