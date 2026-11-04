// How a Chart appears to AI agents: `read_chart_data`, the values it plots. Only the fields its
// marks name by key: a row can hold more than the chart shows, and a person sees no more than that.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions, toolText, toolValue } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';

export type ChartToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly label: string;
	readonly description: string | undefined;
	readonly data: readonly object[];
	readonly marks: readonly object[];
};

const MAX_ROWS = 500;

// The options of a mark that read a row. Any other string in a mark (its `type`, a color, a label)
// says nothing about the data, even when a row has a field by that name.
const DATA_CHANNELS = new Set([
	'x',
	'y',
	'x2',
	'y2',
	'value',
	'colorBy',
	'radius',
	'upper',
	'lower',
	'text',
	'series',
	'parent',
	'nodeId',
	'key',
	'group',
	'date',
	'category',
	'by',
	'baseline',
	'angle',
	'size'
]);
const NESTED_OPTIONS = new Set(['interval', 'marks', 'relations']);

/** The row keys the marks name: a channel as a key, or a list of keys. */
export function plottedFields(marks: readonly object[], row: object): string[] {
	const fields = new Set<string>();
	const addKeys = (value: unknown) => {
		for (const key of Array.isArray(value) ? value : [value]) {
			if (typeof key === 'string' && Object.hasOwn(row, key)) fields.add(key);
		}
	};
	const visit = (mark: object) => {
		for (const [option, value] of Object.entries(mark)) {
			if (DATA_CHANNELS.has(option)) addKeys(value);
			if (!NESTED_OPTIONS.has(option) || !value || typeof value !== 'object') continue;
			for (const nested of Array.isArray(value) ? value : [value]) {
				if (nested && typeof nested === 'object') visit(nested);
			}
		}
	};
	for (const mark of marks) visit(mark);
	return [...fields];
}

export const expose: WebMCPExpose<ChartToolSource> = (source, config) =>
	watchWebMCPTool(
		() => {
			const first = source.data[0];
			const fields = first ? plottedFields(source.marks, first) : [];
			if (fields.length === 0) return null;
			const options = toolOptions(source.tool);
			const about = [toolText(source.label), toolText(source.description)]
				.filter(Boolean)
				.join(': ');
			return {
				name: options.name ?? 'read_chart_data',
				title: options.title ?? (toolText(source.label) || undefined),
				description: options.description ?? `Reads the values plotted by the chart "${about}".`,
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				annotations: { readOnlyHint: true, untrustedContentHint: true },
				execute: () => ({
					fields,
					total: source.data.length,
					rows: source.data
						.slice(0, MAX_ROWS)
						.map((row) =>
							Object.fromEntries(
								fields.map((field) => [field, toolValue((row as Record<string, unknown>)[field])])
							)
						)
				})
			};
		},
		() => ({ exposedTo: exposureOf(source.tool, config), modal: config.surface })
	);
