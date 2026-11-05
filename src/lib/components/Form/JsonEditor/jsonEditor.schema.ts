// JSON Schema, read for an editor: which types a value may take, what its children are, and which
// branch of a union applies. `validateJson` (jsonEditor.validate.ts) says whether a value conforms;
// this module says how to edit it. Drafts 2020-12 and 7 are both read. Only references inside the
// schema are followed: nothing is ever fetched.
import { isValidJson } from './jsonEditor.validate.js';

/** Any value JSON can hold. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
/** A JSON object. */
export type JsonObject = { [key: string]: JsonValue };
/** Where a value sits: object keys and array indexes from the root. */
export type JsonPath = readonly (string | number)[];
/** The type names of JSON Schema. */
export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array';

/** The keywords the editor reads. Unknown keywords are kept and ignored. */
export type JsonSchemaObject = {
	$ref?: string;
	$id?: string;
	$anchor?: string;
	$defs?: Record<string, JsonSchema>;
	definitions?: Record<string, JsonSchema>;
	title?: string;
	description?: string;
	default?: JsonValue;
	examples?: JsonValue[];
	deprecated?: boolean;
	readOnly?: boolean;
	writeOnly?: boolean;
	type?: JsonType | JsonType[];
	enum?: JsonValue[];
	const?: JsonValue;
	/** Display names for `enum`, in the same order. */
	'x-enumNames'?: string[];
	format?: string;
	contentMediaType?: string;
	pattern?: string;
	minLength?: number;
	maxLength?: number;
	minimum?: number;
	maximum?: number;
	/** A number in draft 2020-12; a boolean modifying `minimum` in draft 4. */
	exclusiveMinimum?: number | boolean;
	/** A number in draft 2020-12; a boolean modifying `maximum` in draft 4. */
	exclusiveMaximum?: number | boolean;
	multipleOf?: number;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	additionalProperties?: JsonSchema;
	patternProperties?: Record<string, JsonSchema>;
	propertyNames?: JsonSchema;
	minProperties?: number;
	maxProperties?: number;
	dependentRequired?: Record<string, string[]>;
	dependentSchemas?: Record<string, JsonSchema>;
	/** Draft 7: a list of keys or a schema, per key. */
	dependencies?: Record<string, string[] | JsonSchema>;
	/** A schema, or in draft 7 a list of schemas for the first items. */
	items?: JsonSchema | JsonSchema[];
	prefixItems?: JsonSchema[];
	additionalItems?: JsonSchema;
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
	contains?: JsonSchema;
	minContains?: number;
	maxContains?: number;
	allOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	not?: JsonSchema;
	if?: JsonSchema;
	then?: JsonSchema;
	else?: JsonSchema;
	[keyword: string]: unknown;
};

/** A JSON Schema: an object of keywords, or `true` (anything) or `false` (nothing). */
export type JsonSchema = boolean | JsonSchemaObject;

/** One branch of a `oneOf` or `anyOf` the user can pick. */
export type JsonSchemaVariant = {
	/** What to call the branch; `null` when the schema offers nothing better than its position. */
	label: string | null;
	schema: JsonSchemaObject;
};

/** What the editor needs to know about one value. */
export type JsonSchemaNode = {
	/** The flattened schema: references followed, `allOf` and the active branch merged in. */
	schema: JsonSchemaObject;
	/** The declared types. Empty when any type goes. */
	types: JsonType[];
	/** The branches of a union, when there are several to choose from. */
	variants: JsonSchemaVariant[];
	/** The branch in use. */
	variantIndex: number;
	/** The allowed values, when the schema lists them. */
	options: { value: JsonValue; label: string }[] | null;
};

export const JSON_TYPES: readonly JsonType[] = [
	'string',
	'number',
	'integer',
	'boolean',
	'object',
	'array',
	'null'
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** The JSON type of a value, or `undefined` for an absent one. Whole numbers read as `number`. */
export const jsonTypeOf = (value: unknown): JsonType | undefined => {
	if (value === undefined) return undefined;
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	switch (typeof value) {
		case 'string':
			return 'string';
		case 'number':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'object':
			return 'object';
		default:
			return undefined;
	}
};

/** Whether a value has a type. `integer` takes a whole number, and `number` takes both. */
export const matchesJsonType = (value: unknown, type: JsonType): boolean => {
	const actual = jsonTypeOf(value);
	if (type === 'integer') return actual === 'number' && Number.isInteger(value);
	return actual === type;
};

const schemaObject = (schema: JsonSchema | undefined): JsonSchemaObject =>
	schema === undefined || schema === true ? {} : schema === false ? { not: {} } : schema;

const decodePointer = (segment: string) =>
	decodeURIComponent(segment).replace(/~1/g, '/').replace(/~0/g, '~');

// Finds a `$anchor` or a `$id` anywhere under the root schema.
const findNamed = (
	node: unknown,
	matches: (schema: JsonSchemaObject) => boolean,
	seen = new Set<unknown>()
): JsonSchemaObject | undefined => {
	if (typeof node !== 'object' || node === null || seen.has(node)) return undefined;
	seen.add(node);
	if (!Array.isArray(node) && matches(node as JsonSchemaObject)) return node as JsonSchemaObject;
	for (const child of Object.values(node)) {
		const found = findNamed(child, matches, seen);
		if (found) return found;
	}
	return undefined;
};

/** The schema a `$ref` points at inside `root`, or `undefined` when it leaves the document. */
export const lookupRef = (ref: string, root: JsonSchema): JsonSchema | undefined => {
	if (ref === '#') return root;
	if (ref.startsWith('#/')) {
		let current: unknown = root;
		for (const segment of ref.slice(2).split('/')) {
			if (typeof current !== 'object' || current === null) return undefined;
			current = (current as Record<string, unknown>)[decodePointer(segment)];
		}
		return current as JsonSchema | undefined;
	}
	if (ref.startsWith('#')) {
		const anchor = ref.slice(1);
		return findNamed(root, (schema) => schema.$anchor === anchor);
	}
	return findNamed(root, (schema) => schema.$id === ref);
};

const asTypeList = (type: JsonSchemaObject['type']): JsonType[] =>
	type === undefined ? [] : Array.isArray(type) ? type : [type];

const intersectTypes = (left: JsonType[], right: JsonType[]): JsonType[] => {
	if (left.length === 0) return right;
	if (right.length === 0) return left;
	const shared = left.flatMap((type) => {
		if (right.includes(type)) return [type];
		if (type === 'number' && right.includes('integer')) return ['integer' as const];
		if (type === 'integer' && right.includes('number')) return ['integer' as const];
		return [];
	});
	return shared.length > 0 ? shared : right;
};

const tightest = (left: number | undefined, right: number | undefined, pick: typeof Math.max) =>
	left === undefined ? right : right === undefined ? left : pick(left, right);

/** Merges two schemas that both apply: the result allows what both allow, as far as it can tell. */
export const mergeSchemas = (
	left: JsonSchemaObject,
	right: JsonSchemaObject,
	root: JsonSchema
): JsonSchemaObject => {
	const merged: JsonSchemaObject = { ...left, ...right };

	if (left.type !== undefined && right.type !== undefined) {
		const types = intersectTypes(asTypeList(left.type), asTypeList(right.type));
		merged.type = types.length === 1 ? types[0] : types;
	}
	if (left.required && right.required) {
		merged.required = [...new Set([...left.required, ...right.required])];
	}
	if (left.properties && right.properties) {
		const properties: Record<string, JsonSchema> = { ...left.properties };
		for (const [key, schema] of Object.entries(right.properties)) {
			const existing = properties[key];
			properties[key] =
				existing === undefined || typeof existing === 'boolean' || typeof schema === 'boolean'
					? schema
					: mergeSchemas(flattenRefs(existing, root), flattenRefs(schema, root), root);
		}
		merged.properties = properties;
	}
	if (left.enum && right.enum) {
		const allowed = right.enum.map((value) => JSON.stringify(value));
		merged.enum = left.enum.filter((value) => allowed.includes(JSON.stringify(value)));
	}
	for (const keyword of ['minimum', 'minLength', 'minItems', 'minProperties'] as const) {
		const value = tightest(left[keyword], right[keyword], Math.max);
		if (value !== undefined) merged[keyword] = value;
	}
	for (const keyword of ['maximum', 'maxLength', 'maxItems', 'maxProperties'] as const) {
		const value = tightest(left[keyword], right[keyword], Math.min);
		if (value !== undefined) merged[keyword] = value;
	}
	return merged;
};

// Follows `$ref` chains, keeping the keywords written beside each reference.
const flattenRefs = (schema: JsonSchema | undefined, root: JsonSchema): JsonSchemaObject => {
	let current = schemaObject(schema);
	const seen = new Set<string>();
	while (typeof current.$ref === 'string' && !seen.has(current.$ref)) {
		seen.add(current.$ref);
		const { $ref, ...siblings } = current;
		const target = schemaObject(lookupRef($ref, root));
		current = Object.keys(siblings).length > 0 ? { ...target, ...siblings } : target;
		if (target.$ref === undefined) delete current.$ref;
	}
	return current;
};

/**
 * One schema object for a value: references followed, `allOf` merged, and the conditional keywords
 * (`if`, `dependentSchemas`, `dependentRequired`) applied as far as `value` triggers them. `oneOf`
 * and `anyOf` stay: `resolveJsonSchema` picks the branch.
 */
export const flattenSchema = (
	schema: JsonSchema | undefined,
	root: JsonSchema,
	value: unknown,
	depth = 0
): JsonSchemaObject => {
	let flat = flattenRefs(schema, root);
	if (depth > 16) return flat;
	const nested = (next: JsonSchema | undefined) => flattenSchema(next, root, value, depth + 1);

	if (flat.allOf) {
		const { allOf, ...rest } = flat;
		flat = rest;
		for (const part of allOf) flat = mergeSchemas(flat, nested(part), root);
	}
	if (flat.if !== undefined) {
		const { if: condition, then: consequent, else: alternative, ...rest } = flat;
		const branch = isValidJson(value, condition, root) ? consequent : alternative;
		flat = branch === undefined ? rest : mergeSchemas(rest, nested(branch), root);
	}
	if (isPlainObject(value)) {
		for (const [key, list] of Object.entries(flat.dependentRequired ?? {})) {
			if (key in value) {
				flat = { ...flat, required: [...new Set([...(flat.required ?? []), ...list])] };
			}
		}
		for (const [key, part] of Object.entries(flat.dependentSchemas ?? {})) {
			if (key in value) flat = mergeSchemas(flat, nested(part), root);
		}
		for (const [key, part] of Object.entries(flat.dependencies ?? {})) {
			if (!(key in value)) continue;
			if (Array.isArray(part)) {
				flat = { ...flat, required: [...new Set([...(flat.required ?? []), ...part])] };
			} else {
				flat = mergeSchemas(flat, nested(part), root);
			}
		}
	}
	return flat;
};

const stringifyOption = (value: JsonValue) =>
	typeof value === 'string' ? value : JSON.stringify(value);

// `oneOf: [{ const, title }, ...]` is the usual way to give an enum its labels.
const constBranches = (branches: JsonSchemaObject[]) =>
	branches.length > 0 && branches.every((branch) => branch.const !== undefined)
		? branches.map((branch) => ({
				value: branch.const as JsonValue,
				label: branch.title ?? stringifyOption(branch.const as JsonValue)
			}))
		: null;

// The best name a branch offers: its title, the constant that tells it apart, or its type.
const branchLabel = (branch: JsonSchemaObject, root: JsonSchema): string | null => {
	if (branch.title) return branch.title;
	for (const [key, property] of Object.entries(branch.properties ?? {})) {
		const flat = flattenRefs(property, root);
		if (flat.const !== undefined && branch.required?.includes(key)) {
			return stringifyOption(flat.const);
		}
	}
	return null;
};

const isNullBranch = (branch: JsonSchemaObject) => branch.type === 'null';

const issueCount = (value: unknown, branch: JsonSchemaObject, root: JsonSchema) => {
	const types = asTypeList(branch.type);
	const typed = types.length === 0 || types.some((type) => matchesJsonType(value, type));
	if (!typed) return Number.POSITIVE_INFINITY;
	return isValidJson(value, branch, root) ? 0 : 1;
};

/** The branch a value belongs to: the chosen one while the value still fits it, else the best fit. */
const pickVariant = (
	value: unknown,
	branches: JsonSchemaObject[],
	root: JsonSchema,
	preferred: number | undefined
): number => {
	const chosen = preferred !== undefined && branches[preferred] ? preferred : undefined;
	if (value === undefined) return chosen ?? 0;
	if (chosen !== undefined && issueCount(value, branches[chosen], root) === 0) return chosen;
	let best = chosen ?? 0;
	let bestScore = chosen !== undefined ? issueCount(value, branches[chosen], root) : Infinity;
	branches.forEach((branch, index) => {
		const score = issueCount(value, branch, root);
		if (score < bestScore) {
			best = index;
			bestScore = score;
		}
	});
	return best;
};

/**
 * Reads a schema for one value: its types, its allowed values and, for a union, the branches and
 * the one in use. `preferred` is the branch the user picked, kept while the value fits it.
 */
export const resolveJsonSchema = (
	schema: JsonSchema | undefined,
	root: JsonSchema,
	value: unknown,
	preferred?: number
): JsonSchemaNode => {
	let flat = flattenSchema(schema, root, value);
	let variants: JsonSchemaVariant[] = [];
	let variantIndex = 0;
	let options: JsonSchemaNode['options'] = null;

	const unionKeyword = flat.oneOf ? 'oneOf' : flat.anyOf ? 'anyOf' : null;
	if (unionKeyword) {
		const { [unionKeyword]: union, ...base } = flat;
		const all = (union as JsonSchema[]).map((branch) => flattenSchema(branch, root, value));
		const nullable = all.some(isNullBranch);
		const branches = all.filter((branch) => !isNullBranch(branch));
		options = constBranches(branches);
		flat = base;
		if (options) {
			if (nullable) options = [...options, { value: null, label: 'null' }];
		} else if (branches.length > 0) {
			variantIndex = pickVariant(value, branches, root, preferred);
			if (branches.length > 1) {
				variants = branches.map((branch) => ({
					label: branchLabel(branch, root),
					schema: branch
				}));
			}
			flat = mergeSchemas(base, branches[variantIndex], root);
			// The merged branch may name a title of its own; the property keeps the one written on it.
			if (base.title) flat.title = base.title;
			if (base.description) flat.description = base.description;
		}
		if (nullable && !options) {
			const types = asTypeList(flat.type);
			if (types.length > 0 && !types.includes('null')) flat.type = [...types, 'null'];
		}
	}

	if (!options && flat.enum) {
		const names = flat['x-enumNames'];
		options = flat.enum.map((option, index) => ({
			value: option,
			label: names?.[index] ?? stringifyOption(option)
		}));
	}
	return { schema: flat, types: asTypeList(flat.type), variants, variantIndex, options };
};

/** The schema of one property: declared, else by pattern, else `additionalProperties`. */
export const propertySchema = (schema: JsonSchemaObject, key: string): JsonSchema | undefined => {
	const declared = schema.properties?.[key];
	if (declared !== undefined) return declared;
	for (const [pattern, patterned] of Object.entries(schema.patternProperties ?? {})) {
		try {
			if (new RegExp(pattern, 'u').test(key)) return patterned;
		} catch {
			// A pattern this engine cannot read matches nothing.
		}
	}
	return schema.additionalProperties;
};

/** Whether the schema invites new keys, rather than only tolerating them. */
export const acceptsNewProperties = (schema: JsonSchemaObject): boolean => {
	if (schema.additionalProperties === false) return Boolean(schema.patternProperties);
	if (schema.additionalProperties !== undefined || schema.patternProperties) return true;
	return !schema.properties;
};

/** Whether a new key can be added to this object right now. */
export const canAddProperty = (
	schema: JsonSchemaObject,
	object: unknown,
	free: boolean
): boolean => {
	const count = isPlainObject(object) ? Object.keys(object).length : 0;
	if (schema.maxProperties !== undefined && count >= schema.maxProperties) return false;
	return free || acceptsNewProperties(schema);
};

/** The first items a tuple fixes, in either draft's spelling. */
export const tupleSchemas = (schema: JsonSchemaObject): JsonSchema[] =>
	schema.prefixItems ?? (Array.isArray(schema.items) ? schema.items : []);

/** The schema of the items after the tuple; `false` when none are allowed. */
export const restItemSchema = (schema: JsonSchemaObject): JsonSchema | undefined =>
	Array.isArray(schema.items) ? schema.additionalItems : schema.items;

/** The schema of the item at `index`. */
export const itemSchema = (schema: JsonSchemaObject, index: number): JsonSchema | undefined =>
	tupleSchemas(schema)[index] ?? restItemSchema(schema);

/** The type a value is edited as: what it holds, else what the schema expects first. */
export const editedType = (node: JsonSchemaNode, value: unknown): JsonType | undefined => {
	const actual = jsonTypeOf(value);
	if (actual === undefined) {
		const declared = node.types.find((type) => type !== 'null') ?? node.types[0];
		if (declared) return declared;
		if (node.schema.properties) return 'object';
		if (node.schema.items || node.schema.prefixItems) return 'array';
		return undefined;
	}
	if (actual === 'number' && node.types.includes('integer') && !node.types.includes('number')) {
		return 'integer';
	}
	return actual;
};

const DEFAULT_DEPTH_LIMIT = 8;

const blankOfType = (
	type: JsonType | undefined,
	schema: JsonSchemaObject,
	root: JsonSchema,
	depth: number
): JsonValue | undefined => {
	switch (type) {
		case 'string':
			return '';
		case 'number':
			return schema.minimum ?? 0;
		case 'integer':
			return Math.ceil(schema.minimum ?? 0);
		case 'boolean':
			return false;
		case 'null':
			return null;
		case 'array': {
			const items: JsonValue[] = [];
			const count = Math.max(schema.minItems ?? 0, tupleSchemas(schema).length);
			for (let index = 0; index < count; index += 1) {
				const item = blankAt(itemSchema(schema, index), root, undefined, depth + 1);
				if (item === undefined) break;
				items.push(item);
			}
			return items;
		}
		case 'object':
			return initialObject(schema, root, depth);
		default:
			return undefined;
	}
};

const blankAt = (
	schema: JsonSchema | undefined,
	root: JsonSchema,
	preferred: number | undefined,
	depth: number
): JsonValue | undefined => {
	if (depth > DEFAULT_DEPTH_LIMIT) return undefined;
	const node = resolveJsonSchema(schema, root, undefined, preferred);
	const flat = node.schema;
	if (flat.default !== undefined) return structuredClone(flat.default);
	if (flat.const !== undefined) return flat.const;
	if (node.options?.length) return node.options[0].value;
	return blankOfType(editedType(node, undefined), flat, root, depth);
};

// An object starts with its required keys and the keys that have a default. A required scalar with
// no default stays absent: the user owes a value, and its empty control says so. Containers and
// constants have a shape worth starting from.
const initialObject = (schema: JsonSchemaObject, root: JsonSchema, depth: number): JsonObject => {
	const object: JsonObject = {};
	for (const [key, property] of Object.entries(schema.properties ?? {})) {
		const value = initialAt(property, root, depth + 1, schema.required?.includes(key) ?? false);
		if (value !== undefined) object[key] = value;
	}
	return object;
};

const initialAt = (
	schema: JsonSchema | undefined,
	root: JsonSchema,
	depth: number,
	required: boolean
): JsonValue | undefined => {
	if (depth > DEFAULT_DEPTH_LIMIT) return undefined;
	const node = resolveJsonSchema(schema, root, undefined);
	const flat = node.schema;
	if (flat.default !== undefined) return structuredClone(flat.default);
	if (flat.const !== undefined) return flat.const;
	if (!required) return undefined;
	const type = editedType(node, undefined);
	return type === 'object' || type === 'array' ? blankOfType(type, flat, root, depth) : undefined;
};

/**
 * The value an editor starts from when it was given none: the schema's `default` or `const`, else
 * the shape of a required object or array. `undefined` when the schema has nothing to start from.
 */
export const initialJsonValue = (
	schema: JsonSchema | undefined,
	root: JsonSchema = schema ?? true
): JsonValue | undefined => initialAt(schema, root, 0, true);

/** A fresh value for a new array row or a newly set key: always something a control can hold. */
export const blankJsonValue = (
	schema: JsonSchema | undefined,
	root: JsonSchema,
	preferred?: number
): JsonValue | undefined => blankAt(schema, root, preferred, 0);

/**
 * A new row shaped like its inferred siblings: every key they have, blank. Unlike a schema of the
 * app's, an inferred one has no optional keys worth leaving out.
 */
export const blankFromInferred = (schema: JsonSchema | undefined): JsonValue => {
	const flat = schemaObject(schema);
	const type = asTypeList(flat.type).find((candidate) => candidate !== 'null');
	switch (type) {
		case 'object':
			return Object.fromEntries(
				Object.entries(flat.properties ?? {}).map(([key, property]) => [
					key,
					blankFromInferred(property)
				])
			);
		case 'array':
			return [];
		case 'number':
		case 'integer':
			return 0;
		case 'boolean':
			return false;
		case 'string':
			return '';
		default:
			return asTypeList(flat.type).includes('null') ? null : '';
	}
};

/** Converts a value to another type as gently as the types allow. */
export const coerceJsonValue = (value: unknown, type: JsonType): JsonValue => {
	switch (type) {
		case 'string':
			if (value === undefined || value === null) return '';
			return typeof value === 'string' ? value : JSON.stringify(value);
		case 'number':
		case 'integer': {
			const parsed = typeof value === 'boolean' ? Number(value) : Number(value ?? 0);
			if (!Number.isFinite(parsed)) return 0;
			return type === 'integer' ? Math.trunc(parsed) : parsed;
		}
		case 'boolean':
			return value === 'false' ? false : Boolean(value);
		case 'null':
			return null;
		case 'array':
			if (Array.isArray(value)) return value as JsonValue[];
			return value === undefined || value === null || value === '' ? [] : [value as JsonValue];
		case 'object':
			return isPlainObject(value) ? (value as JsonObject) : {};
	}
};

/** The value at `path`, or `undefined`. */
export const readJsonValue = (root: unknown, path: JsonPath): unknown => {
	let current = root;
	for (const segment of path) {
		if (typeof current !== 'object' || current === null) return undefined;
		current = (current as Record<string | number, unknown>)[segment];
	}
	return current;
};

/** A copy of `root` with the value at `path` replaced, or removed when `next` is `undefined`. */
export const setJsonValue = (root: unknown, path: JsonPath, next: unknown): unknown => {
	if (path.length === 0) return next;
	const [head, ...rest] = path;
	if (typeof head === 'number') {
		const list = Array.isArray(root) ? [...root] : [];
		const item = setJsonValue(list[head], rest, next);
		if (item === undefined) list.splice(head, 1);
		else list[head] = item;
		return list;
	}
	const object = isPlainObject(root) ? { ...root } : {};
	const child = setJsonValue(object[head], rest, next);
	if (child === undefined) delete object[head];
	else object[head] = child;
	return object;
};

/** A copy of an object with a key renamed in place, so the keys keep their order. */
export const renameJsonKey = (object: JsonObject, from: string, to: string): JsonObject =>
	Object.fromEntries(
		Object.entries(object).map(([key, value]) => [key === from ? to : key, value])
	) as JsonObject;

/** Whether a key is free to take in this object. */
export const isJsonKeyFree = (object: JsonObject, key: string): boolean =>
	!Object.prototype.hasOwnProperty.call(object, key);

/** A stable string for a path, usable as a map key. */
export const jsonPathKey = (path: JsonPath): string => JSON.stringify(path);
