// The only WebMCP code every Form carries. The schema builder loads when an app turned WebMCP on
// and the browser has it, so a page that did neither pays nothing.

import { getModelContext, useWebMCPConfig } from '$lib/utils/webmcp/webmcp.registry.js';
import type { FormToolSource } from './form.webmcp.svelte.js';

/** Exposes a Form as a WebMCP tool while `<Theme webmcp>` is on. Call during initialization. */
export function useFormTool(source: FormToolSource): void {
	const config = useWebMCPConfig();
	// A boolean, so a fresh `tool={{ … }}` object updates the tool instead of restarting it.
	const active = $derived(Boolean(config.options) && source.tool !== false && !source.disabled);
	$effect(() => {
		if (!active || !getModelContext()) return;
		let stop: (() => void) | undefined;
		let stopped = false;
		void import('./form.webmcp.svelte.js').then(({ exposeForm }) => {
			if (!stopped) stop = exposeForm(source, config);
		});
		return () => {
			stopped = true;
			stop?.();
		};
	});
}
