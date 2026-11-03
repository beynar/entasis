// The one place entasis talks to the browser's WebMCP API. Every tool goes through this registry,
// which gives each a valid unique name, re-registers it only when what the agent sees changes, and
// offers only the tools of the topmost modal surface, as a person can only reach that one.

import { DEV } from 'esm-env';
import { getContext } from 'svelte';
import type {
	ModelContextLike,
	WebMCPOptions,
	WebMCPRegisterOptions,
	WebMCPTool
} from './webmcp.types.js';

// Keeps the erased tools of every Form and dialog in one set; each `execute` restores its own input.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = WebMCPTool<any>;

type Entry = {
	tool: AnyTool;
	options: WebMCPRegisterOptions;
	/** The modal surface the tool belongs to; none for a tool of the page. */
	surface: unknown;
	name: string;
	/** What the agent saw at the last registration. */
	signature: string | null;
	controller: AbortController | null;
};

/** Removes or changes one registered tool. */
export type WebMCPToolHandle = {
	update: (tool: AnyTool, options?: Pick<WebMCPRegisterOptions, 'exposedTo'>) => void;
	remove: () => void;
};

const MAX_NAME_LENGTH = 128;

const entries = new Set<Entry>();
/** Open modal surfaces with how many holders each has, the topmost last. */
const surfaces = new Map<unknown, number>();
let flushScheduled = false;

const topSurface = (): unknown => [...surfaces.keys()].at(-1);

const isReachable = ({ surface }: Entry): boolean =>
	surfaces.size === 0 || surface === topSurface();

function retainSurface(surface: unknown): void {
	surfaces.set(surface, (surfaces.get(surface) ?? 0) + 1);
}

function releaseSurface(surface: unknown): void {
	const holders = (surfaces.get(surface) ?? 0) - 1;
	if (holders > 0) surfaces.set(surface, holders);
	else surfaces.delete(surface);
}

/** The browser's model context: `document.modelContext`, or Chrome's older `navigator` one. */
export function getModelContext(): ModelContextLike | null {
	if (typeof document === 'undefined') return null;
	const hosts = [document, navigator] as unknown as { modelContext?: ModelContextLike }[];
	for (const host of hosts) {
		if (typeof host.modelContext?.registerTool === 'function') return host.modelContext;
	}
	return null;
}

/**
 * Text from a prop, as a tool may quote it: one line and short, because whatever a description
 * says is read by the model as an instruction. Anything but a plain string gives nothing.
 */
export const toolText = (slot: unknown): string =>
	typeof slot === 'string' ? slot.replace(/\s+/g, ' ').trim().slice(0, 200) : '';

/** Whether this browser exposes WebMCP. False during server rendering. */
export const webmcpSupported = (): boolean => getModelContext() !== null;

/** Turns text such as a form title into a tool name, or `undefined` when none of it survives. */
export function toToolName(text: string | undefined): string | undefined {
	const name = text
		?.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 120);
	return name || undefined;
}

// The browser rejects a name outside these rules, which would leave the tool silently missing.
const uniqueName = (requested: string): string => {
	const base = requested.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, MAX_NAME_LENGTH) || 'tool';
	if (DEV && base !== requested) {
		console.warn(`[WebMCP] The tool name "${requested}" is not valid; using "${base}".`);
	}
	const taken = new Set([...entries].map((entry) => entry.name));
	if (!taken.has(base)) return base;
	for (let number = 2; ; number += 1) {
		const suffix = `_${number}`;
		const name = `${base.slice(0, MAX_NAME_LENGTH - suffix.length)}${suffix}`;
		if (!taken.has(name)) return name;
	}
};

const signatureOf = ({ tool, options, name }: Entry): string =>
	JSON.stringify([
		name,
		tool.title,
		tool.description,
		tool.inputSchema,
		tool.annotations,
		options.exposedTo
	]);

function unregister(context: ModelContextLike, entry: Entry): void {
	entry.controller?.abort();
	entry.controller = null;
	entry.signature = null;
	try {
		context.unregisterTool?.(entry.name);
	} catch {
		// Older Chrome throws for a name it does not know; the signal already removed the tool.
	}
}

function register(context: ModelContextLike, entry: Entry): void {
	const controller = new AbortController();
	const { tool, options } = entry;
	const report = (error: unknown) => {
		// Nothing is registered: the next change tries again instead of believing it is.
		if (entry.controller === controller) {
			entry.controller = null;
			entry.signature = null;
		}
		if (DEV) console.warn(`[WebMCP] Could not register the tool "${entry.name}".`, error);
	};
	entry.controller = controller;
	entry.signature = signatureOf(entry);
	try {
		const result = context.registerTool(
			{
				name: entry.name,
				...(tool.title ? { title: tool.title } : {}),
				description: tool.description,
				inputSchema: tool.inputSchema ?? { type: 'object', properties: {} },
				...(tool.annotations ? { annotations: tool.annotations } : {}),
				// Read at call time: a form's handlers change without the agent seeing a new tool.
				execute: (input: unknown, runOptions?: { signal?: AbortSignal }) =>
					entry.tool.execute(input ?? {}, runOptions ?? {})
			},
			{
				signal: controller.signal,
				...(options.exposedTo ? { exposedTo: options.exposedTo } : {})
			}
		);
		void Promise.resolve(result).catch(report);
	} catch (error) {
		report(error);
	}
}

function flush(): void {
	flushScheduled = false;
	const context = getModelContext();
	if (!context) return;
	const list = [...entries];
	// Removals first: a tool that changed takes back its own name.
	for (const entry of list) {
		if (entry.controller && (!isReachable(entry) || entry.signature !== signatureOf(entry))) {
			unregister(context, entry);
		}
	}
	for (const entry of list) {
		if (isReachable(entry) && !entry.controller) register(context, entry);
	}
}

// Several fields of one form change in the same tick: the agent sees one change.
function scheduleFlush(): void {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(flush);
}

/**
 * Registers a tool until the returned handle removes it. Does nothing where the browser has no
 * WebMCP. Inside a component, prefer `useWebMCPTool`, which removes the tool on unmount.
 */
export function registerWebMCPTool(
	tool: AnyTool,
	options: WebMCPRegisterOptions = {}
): WebMCPToolHandle {
	const entry: Entry = {
		tool,
		options,
		surface: undefined,
		name: uniqueName(tool.name),
		signature: null,
		controller: null
	};
	let baseName = tool.name;
	if (options.modal) {
		entry.surface = options.modal === true ? entry : options.modal;
		retainSurface(entry.surface);
	}
	entries.add(entry);
	scheduleFlush();

	return {
		update(nextTool, nextOptions) {
			if (!entries.has(entry)) return;
			entry.tool = nextTool;
			if (nextOptions) entry.options = { ...entry.options, ...nextOptions };
			if (nextTool.name !== baseName) {
				baseName = nextTool.name;
				entries.delete(entry);
				const context = getModelContext();
				if (context && entry.controller) unregister(context, entry);
				entry.name = uniqueName(nextTool.name);
				entries.add(entry);
			}
			scheduleFlush();
		},
		remove() {
			if (!entries.delete(entry)) return;
			if (entry.options.modal) releaseSurface(entry.surface);
			const context = getModelContext();
			if (context && entry.controller) unregister(context, entry);
			// The surface may have been the last: the tools below it come back.
			scheduleFlush();
		}
	};
}

/**
 * Marks a modal surface as open until the returned function runs. Only its tools stay available,
 * whether it has any or not: what is behind a modal is out of reach. Tools join it with
 * `modal: id`.
 */
export function holdWebMCPSurface(id: string): () => void {
	retainSurface(id);
	scheduleFlush();
	return () => {
		releaseSurface(id);
		scheduleFlush();
	};
}

/** What a `<Theme webmcp>` above the caller turned on, or `null`. Call during initialization. */
export function useWebMCPConfig(): { readonly options: WebMCPOptions | null } {
	const theme = getContext<{ webmcp?: boolean | WebMCPOptions } | undefined>('entasisTheme');
	return {
		get options() {
			const webmcp = theme?.webmcp;
			if (!webmcp) return null;
			return webmcp === true ? {} : webmcp;
		}
	};
}
