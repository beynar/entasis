// Reads a schema out of a value, for the JsonEditor without one: what each value looks like, so it
// gets the right control. A guess, and the editor treats it as one: the types stay changeable.
import { jsonTypeOf, type JsonSchemaObject, type JsonType } from './jsonEditor.schema.js';

const FORMAT_TESTS: [string, RegExp][] = [
	['date-time', /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?$/],
	['date', /^\d{4}-\d{2}-\d{2}$/],
	['time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/],
	['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
	['uri', /^[a-z][a-z0-9+.-]*:\/\/\S+$/i],
	['uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
	['color', /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i]
];

const stringFormat = (text: string) => FORMAT_TESTS.find(([, test]) => test.test(text))?.[0];

const typesOf = (schema: JsonSchemaObject): JsonType[] =>
	schema.type === undefined ? [] : [schema.type].flat();

// What two siblings have in common: the shape a new row of the same list should take.
const mergeInferred = (left: JsonSchemaObject, right: JsonSchemaObject): JsonSchemaObject => {
	const leftTypes = typesOf(left);
	const rightTypes = typesOf(right);
	const nullable = leftTypes.includes('null') || rightTypes.includes('null');
	const solid = [...new Set([...leftTypes, ...rightTypes])].filter((type) => type !== 'null');
	// `null` next to a real type is that type, left blank.
	const numeric = solid.length === 2 && solid.includes('integer') && solid.includes('number');
	const types: JsonType[] = numeric ? ['number'] : solid;

	const merged: JsonSchemaObject = {};
	const type =
		types.length === 0 ? ['null' as const] : nullable ? [...types, 'null' as const] : types;
	merged.type = type.length === 1 ? type[0] : type;

	if (types.length === 1 && types[0] === 'string' && left.format === right.format) {
		if (left.format) merged.format = left.format;
	} else if (types.length === 1 && types[0] === 'string') {
		// Only one side is formatted, and the other is an actual text: no format fits both.
		const formatted = !leftTypes.includes('string')
			? right
			: !rightTypes.includes('string')
				? left
				: null;
		if (formatted?.format) merged.format = formatted.format;
	}
	if (types.includes('object')) {
		const leftProperties = left.properties ?? {};
		const rightProperties = right.properties ?? {};
		const properties: Record<string, JsonSchemaObject> = {};
		for (const key of new Set([...Object.keys(leftProperties), ...Object.keys(rightProperties)])) {
			const one = leftProperties[key] as JsonSchemaObject | undefined;
			const other = rightProperties[key] as JsonSchemaObject | undefined;
			properties[key] =
				one && other ? mergeInferred(one, other) : (one ?? (other as JsonSchemaObject));
		}
		merged.properties = properties;
		merged.additionalProperties = true;
		merged.required = (left.required ?? right.required ?? []).filter(
			(key) => (left.required ?? []).includes(key) && (right.required ?? []).includes(key)
		);
	}
	if (types.includes('array')) {
		const items = [left.items, right.items].filter(Boolean) as JsonSchemaObject[];
		merged.items = items.length === 2 ? mergeInferred(items[0], items[1]) : (items[0] ?? {});
	}
	return merged;
};

/**
 * Infers a JSON Schema from a value: types, string formats (date, date-time, time, email, uri, uuid,
 * color), the properties of objects, and for arrays the shape their items share. A best effort, for
 * editing: the value it came from always conforms, and little else is promised.
 */
export const inferJsonSchema = (value: unknown): JsonSchemaObject => {
	const type = jsonTypeOf(value);
	switch (type) {
		case undefined:
			return {};
		case 'string': {
			const format = stringFormat(value as string);
			return format ? { type, format } : { type };
		}
		case 'number':
			return { type: Number.isInteger(value) ? 'integer' : 'number' };
		case 'array': {
			const items = (value as unknown[]).map(inferJsonSchema);
			return {
				type,
				items: items.length > 0 ? items.reduce(mergeInferred) : {}
			};
		}
		case 'object': {
			const entries = Object.entries(value as Record<string, unknown>).filter(
				([, item]) => item !== undefined
			);
			return {
				type,
				properties: Object.fromEntries(entries.map(([key, item]) => [key, inferJsonSchema(item)])),
				required: entries.map(([key]) => key),
				additionalProperties: true
			};
		}
		default:
			return { type };
	}
};
