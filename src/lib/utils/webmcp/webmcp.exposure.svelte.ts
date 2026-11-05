// What ties a component to its `.webmcp.ts` file. The component calls `useWebMCPExposure`, which
// stays this small so a page that did not turn WebMCP on carries nothing else. The file builds its
// tools from the component's source object with `watchWebMCPTool`, which follows the props.

import {
	getModelContext,
	registerWebMCPTool,
	startExposure,
	useWebMCPConfig,
	type WebMCPConfig,
	type WebMCPToolHandle
} from './webmcp.registry.js';
import type { WebMCPRegisterOptions, WebMCPTool, WebMCPToolProp } from './webmcp.types.js';

// A tool of any input: each `execute` restores its own.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = WebMCPTool<any>;

const toolOf = (source: object) => (source as { readonly tool?: WebMCPToolProp }).tool;

/** What a component's `.webmcp.ts` file exports. It returns how to stop. */
export type WebMCPExpose<Source> = (source: Source, config: WebMCPConfig) => () => void;

/**
 * Exposes a component to agents while `<Theme webmcp>` is on, its `tool` prop is not `false` and
 * `enabled` allows it. Call during initialization, with a source whose getters read the props.
 */
export function useWebMCPExposure<Source extends object>(
	load: () => Promise<{ expose: WebMCPExpose<Source> }>,
	source: Source,
	enabled: () => boolean = () => true
): void {
	const config = useWebMCPConfig();
	// A boolean, so a fresh `tool={{ … }}` object updates the tools instead of restarting them.
	const active = $derived(Boolean(config.options) && enabled() && toolOf(source) !== false);
	$effect(() => {
		if (!active || !getModelContext()) return;
		return startExposure(load, ({ expose }) => expose(source, config));
	});
}

/** Runs a function again whenever what it reads changes, until the returned function runs. */
export const watchWebMCP = (run: () => void): (() => void) =>
	$effect.root(() => {
		$effect(run);
	});

/**
 * Keeps one tool in step with what `build` reads: a change updates it, `null` removes it until a
 * tool comes back. `options` is read each time, except `modal`, which the first tool settles.
 */
export function watchWebMCPTool(
	build: () => AnyTool | null,
	options: () => WebMCPRegisterOptions
): () => void {
	let handle: WebMCPToolHandle | null = null;
	const stop = watchWebMCP(() => {
		const tool = build();
		const { exposedTo, modal } = options();
		if (!tool) {
			handle?.remove();
			handle = null;
		} else if (handle) {
			handle.update(tool, { exposedTo });
		} else {
			handle = registerWebMCPTool(tool, { exposedTo, modal });
		}
	});
	return () => {
		stop();
		handle?.remove();
		handle = null;
	};
}
