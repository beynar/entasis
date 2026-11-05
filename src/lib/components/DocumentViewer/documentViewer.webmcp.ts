// How a DocumentViewer appears to AI agents: `search_document`, which also shows the matches on
// screen as its search box does, and `read_document`. A document's words are not instructions, nor
// is its file name, often written by someone else: it stays out of what the tools say about
// themselves.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { DocumentSearchMatch } from './documentViewer.props.js';

export type DocumentViewerToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly unitCount: number;
	readonly loaded: boolean;
	readonly search: (query: string) => Promise<DocumentSearchMatch[]>;
	/** The text of a page, slide or sheet; `null` for a format with no text to read. */
	readonly readUnit: (unit: number) => Promise<string | null>;
};

const MAX_MATCHES = 50;
const MAX_TEXT = 20000;

export const expose: WebMCPExpose<DocumentViewerToolSource> = (source, config) => {
	const exposure = () => ({
		exposedTo: exposureOf(source.tool, config),
		modal: config.surface
	});
	const stops = [
		watchWebMCPTool(() => {
			if (!source.loaded) return null;
			const options = toolOptions(source.tool);
			return {
				name: options.name ?? 'search_document',
				title: options.title,
				description:
					options.description ?? 'Searches the document and shows the matches on screen.',
				inputSchema: {
					type: 'object',
					properties: { query: { type: 'string', minLength: 1 } },
					required: ['query'],
					additionalProperties: false
				},
				annotations: { untrustedContentHint: true },
				execute: async ({ query }: { query: unknown }) => {
					if (typeof query !== 'string' || !query.trim()) return { status: 'invalid' };
					const matches = await source.search(query);
					return { status: 'done', total: matches.length, matches: matches.slice(0, MAX_MATCHES) };
				}
			};
		}, exposure),
		watchWebMCPTool(() => {
			if (!source.loaded || source.unitCount < 1) return null;
			const { unitCount } = source;
			return {
				name: 'read_document',
				description: `Reads one page, slide or sheet of the document, of ${unitCount}.`,
				inputSchema: {
					type: 'object',
					properties: { unit: { type: 'integer', minimum: 1, maximum: unitCount } },
					required: ['unit'],
					additionalProperties: false
				},
				annotations: { readOnlyHint: true, untrustedContentHint: true },
				execute: async ({ unit }: { unit: unknown }) => {
					if (typeof unit !== 'number' || unit < 1 || unit > source.unitCount) {
						return { status: 'invalid' };
					}
					const text = await source.readUnit(unit);
					if (text === null) {
						return { status: 'unavailable', message: 'Use search_document on this format.' };
					}
					return {
						status: 'done',
						unit,
						text: text.slice(0, MAX_TEXT),
						truncated: text.length > MAX_TEXT
					};
				}
			};
		}, exposure)
	];
	return () => {
		for (const stop of stops) stop();
	};
};
