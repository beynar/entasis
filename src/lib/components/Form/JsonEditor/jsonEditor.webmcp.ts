// How a JsonEditor outside a Form appears to AI agents: `read_json`, then `edit_json`, held to the
// schema. In a Form, its value is one field of the form's own tool.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions, toolText } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import {
	itemSchema,
	jsonToolSchema,
	propertySchema,
	resolveJsonSchema,
	type JsonPath,
	type JsonSchema
} from './jsonEditor.schema.js';
import { validateJson } from './jsonEditor.validate.js';
import type { JsonEditorIssue } from './jsonEditor.props.js';

export type JsonEditorToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly label: unknown;
	readonly schema: JsonSchema | undefined;
	readonly value: unknown;
	readonly disabled: boolean;
	readonly readOnly: boolean;
	readonly issues: readonly JsonEditorIssue[];
	/** Replaces the whole value, as an edit of the JSON text does: a person can take it back. */
	readonly replace: (next: unknown) => void;
};

// What stands for a value the editor masks. The model reads this, and writing it back keeps the
// value it stands for, so reading then editing the whole document loses no secret.
const HIDDEN = '[hidden]';

/** Rebuilds a value, passing every masked string through `change`, with its path. */
const mapHidden = (
	value: unknown,
	schema: JsonSchema | undefined,
	root: JsonSchema,
	change: (text: string, path: JsonPath) => unknown,
	path: JsonPath = []
): unknown => {
	const { schema: flat } = resolveJsonSchema(schema, root, value);
	if (typeof value === 'string') {
		const masked = flat.writeOnly === true || flat.format === 'password';
		return masked && value !== '' ? change(value, path) : value;
	}
	if (Array.isArray(value)) {
		return value.map((item, index) =>
			mapHidden(item, itemSchema(flat, index), root, change, [...path, index])
		);
	}
	if (typeof value !== 'object' || value === null) return value;
	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => [
			key,
			mapHidden(item, propertySchema(flat, key), root, change, [...path, key])
		])
	);
};

const readAt = (value: unknown, path: JsonPath): unknown =>
	path.reduce<unknown>(
		(current, key) =>
			typeof current === 'object' && current !== null
				? (current as Record<string | number, unknown>)[key]
				: undefined,
		value
	);

function shownValue({ value, schema }: JsonEditorToolSource): unknown {
	return schema === undefined ? value : mapHidden(value, schema, schema, () => HIDDEN);
}

function edit(source: JsonEditorToolSource, input: { value?: unknown }) {
	if (source.disabled || source.readOnly) {
		return { status: 'refused', message: 'This editor cannot be changed.' };
	}
	if (input.value === undefined) return { status: 'invalid', message: 'No value given.' };
	const { schema, value: current } = source;
	const next =
		schema === undefined
			? input.value
			: mapHidden(input.value, schema, schema, (text, path) =>
					text === HIDDEN ? readAt(current, path) : text
				);
	if (schema !== undefined) {
		const issues = validateJson(next, schema);
		if (issues.length > 0) {
			return {
				status: 'invalid',
				issues: issues.map(({ path, code, params }) => ({ path, code, params }))
			};
		}
	}
	source.replace(next);
	return { status: 'done' };
}

export const expose: WebMCPExpose<JsonEditorToolSource> = (source, config) => {
	const exposure = () => ({
		exposedTo: exposureOf(source.tool, config),
		modal: config.surface
	});
	const named = () => {
		const label = toolText(source.label);
		return label ? `"${label}"` : 'this editor';
	};
	const stops = [
		watchWebMCPTool(() => {
			return {
				name: 'read_json',
				description: `Reads the JSON value of ${named()}, with any problems in it. Masked values read "${HIDDEN}".`,
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				annotations: { readOnlyHint: true, untrustedContentHint: true },
				execute: () => {
					const issues = source.issues.map(({ path, text }) => ({ path, text }));
					return {
						status: 'done',
						value: shownValue(source),
						...(issues.length > 0 ? { issues } : {})
					};
				}
			};
		}, exposure),
		watchWebMCPTool(() => {
			// A read-only editor is still read; a person cannot change it either.
			if (source.disabled || source.readOnly || source.schema === false) return null;
			const options = toolOptions(source.tool);
			return {
				name: options.name ?? 'edit_json',
				title: options.title,
				description:
					options.description ??
					`Replaces the whole JSON value of ${named()}. Read it first. Leave a masked value as "${HIDDEN}" to keep it. A value that breaks the schema is refused.`,
				inputSchema: {
					type: 'object',
					properties: { value: jsonToolSchema(source.schema) },
					required: ['value'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? true },
				execute: (input: { value?: unknown }) => edit(source, input)
			};
		}, exposure)
	];
	return () => {
		for (const stop of stops) stop();
	};
};
