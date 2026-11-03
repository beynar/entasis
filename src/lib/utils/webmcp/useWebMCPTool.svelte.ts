import { registerWebMCPTool, type WebMCPToolHandle } from './webmcp.registry.js';
import type { WebMCPRegisterOptions, WebMCPTool } from './webmcp.types.js';

/**
 * Registers a WebMCP tool for the life of the calling component, whatever `<Theme webmcp>` says:
 * calling it is the opt-in. The getter is reactive: a new schema re-registers the tool, and
 * returning `null` or `false` removes it until a tool comes back. Does nothing on the server or
 * in a browser without WebMCP.
 *
 * ```ts
 * useWebMCPTool(() => ({
 *   name: 'search_orders',
 *   description: 'Search the orders of the signed-in customer.',
 *   inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
 *   annotations: { readOnlyHint: true },
 *   execute: ({ query }) => orders.search(query)
 * }));
 * ```
 */
export function useWebMCPTool<Input = Record<string, unknown>>(
	tool: () => WebMCPTool<Input> | null | false | undefined,
	options: WebMCPRegisterOptions = {}
): void {
	let handle: WebMCPToolHandle | null = null;
	$effect(() => {
		const current = tool();
		if (!current) {
			handle?.remove();
			handle = null;
		} else if (handle) {
			handle.update(current);
		} else {
			handle = registerWebMCPTool(current, options);
		}
	});
	$effect(() => () => {
		handle?.remove();
		handle = null;
	});
}
