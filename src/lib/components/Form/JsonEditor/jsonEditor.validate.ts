// A small JSON Schema validator, for the keywords an editor can act on. Issues are codes with
// parameters, never text: jsonEditor.messages.ts words them from the i18n catalog, so no message a
// user sees comes from here. Nothing is fetched and no code is generated from the schema.
import {
	jsonTypeOf,
	lookupRef,
	matchesJsonType,
	type JsonPath,
	type JsonSchema,
	type JsonSchemaObject,
	type JsonType
} from './jsonEditor.schema.js';

/** What a value breaks. `params` carries the limit the message names. */
export type JsonIssue = {
	/** Where the problem is. A missing key points at the key itself. */
	path: JsonPath;
	code: JsonIssueCode;
	params?: Record<string, string | number>;
	/** The schema's own wording for this value (`errorMessage`), which wins over the catalog. */
	message?: string;
};

export type JsonIssueCode =
	| 'required'
	| 'type'
	| 'enum'
	| 'const'
	| 'minLength'
	| 'maxLength'
	| 'pattern'
	| 'format'
	| 'email'
	| 'url'
	| 'minimum'
	| 'maximum'
	| 'exclusiveMinimum'
	| 'exclusiveMaximum'
	| 'multipleOf'
	| 'minItems'
	| 'maxItems'
	| 'uniqueItems'
	| 'contains'
	| 'additionalItems'
	| 'minProperties'
	| 'maxProperties'
	| 'additionalProperties'
	| 'propertyNames'
	| 'dependentRequired'
	| 'noVariant'
	| 'not';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:([0-5]\d|60)(\.\d+)?)?(Z|z|[+-]([01]\d|2[0-3]):?[0-5]\d)?$/;

const isRealDate = (text: string) => {
	const match = DATE.exec(text);
	if (!match) return false;
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const isDateTime = (text: string) => {
	const separator = text.search(/[Tt ]/);
	return separator === 10 && isRealDate(text.slice(0, 10)) && TIME.test(text.slice(separator + 1));
};

const isUrl = (text: string) => {
	try {
		return Boolean(new URL(text).protocol);
	} catch {
		return false;
	}
};

const isIpv4 = (text: string) =>
	/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(text) &&
	text.split('.').every((part) => Number(part) <= 255 && (part === '0' || !part.startsWith('0')));

const isIpv6 = (text: string) => {
	if (!/^[0-9a-fA-F:.]+$/.test(text) || !text.includes(':')) return false;
	try {
		return Boolean(new URL(`http://[${text}]`));
	} catch {
		return false;
	}
};

const isRegex = (text: string) => {
	try {
		new RegExp(text, 'u');
		return true;
	} catch {
		return false;
	}
};

const FORMATS: Record<string, (text: string) => boolean> = {
	date: isRealDate,
	time: (text) => TIME.test(text),
	'date-time': isDateTime,
	uuid: (text) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text),
	ipv4: isIpv4,
	ipv6: isIpv6,
	hostname: (text) =>
		text.length <= 253 &&
		/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(text),
	regex: isRegex,
	color: (text) => /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canonical = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	if (typeof value === 'object' && value !== null) {
		const entries = Object.entries(value).sort(([left], [right]) => (left < right ? -1 : 1));
		return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'undefined';
};

/** Whether two JSON values are equal, whatever order their keys are in. */
export const jsonEquals = (left: unknown, right: unknown): boolean =>
	canonical(left) === canonical(right);

const testPattern = (pattern: string, text: string) => {
	try {
		return new RegExp(pattern, 'u').test(text);
	} catch {
		// A pattern this engine cannot read says nothing about the value.
		return true;
	}
};

const isMultipleOf = (value: number, divisor: number) => {
	if (divisor <= 0) return true;
	const quotient = value / divisor;
	return Math.abs(quotient - Math.round(quotient)) < 1e-9;
};

type Context = { root: JsonSchema; issues: JsonIssue[]; depth: number };

const STRICT_MAX_DEPTH = 64;

const checkString = (text: string, schema: JsonSchemaObject, path: JsonPath, add: Add) => {
	const length = [...text].length;
	if (schema.minLength !== undefined && length < schema.minLength) {
		add(path, 'minLength', { limit: schema.minLength });
	}
	if (schema.maxLength !== undefined && length > schema.maxLength) {
		add(path, 'maxLength', { limit: schema.maxLength });
	}
	if (schema.pattern !== undefined && !testPattern(schema.pattern, text)) add(path, 'pattern');
	// An empty text says "nothing yet" better than "badly formatted"; minLength and required speak.
	if (schema.format && text !== '') {
		if (schema.format === 'email' || schema.format === 'idn-email') {
			if (!EMAIL.test(text)) add(path, 'email');
		} else if (schema.format === 'uri' || schema.format === 'url' || schema.format === 'iri') {
			if (!isUrl(text)) add(path, 'url');
		} else {
			const check = FORMATS[schema.format];
			if (check && !check(text)) add(path, 'format', { format: schema.format });
		}
	}
};

const checkNumber = (value: number, schema: JsonSchemaObject, path: JsonPath, add: Add) => {
	const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf } = schema;
	if (minimum !== undefined) {
		// Draft 4 spells an exclusive bound as a boolean beside `minimum`.
		if (exclusiveMinimum === true ? value <= minimum : value < minimum) {
			add(path, exclusiveMinimum === true ? 'exclusiveMinimum' : 'minimum', { limit: minimum });
		}
	}
	if (maximum !== undefined) {
		if (exclusiveMaximum === true ? value >= maximum : value > maximum) {
			add(path, exclusiveMaximum === true ? 'exclusiveMaximum' : 'maximum', { limit: maximum });
		}
	}
	if (typeof exclusiveMinimum === 'number' && value <= exclusiveMinimum) {
		add(path, 'exclusiveMinimum', { limit: exclusiveMinimum });
	}
	if (typeof exclusiveMaximum === 'number' && value >= exclusiveMaximum) {
		add(path, 'exclusiveMaximum', { limit: exclusiveMaximum });
	}
	if (multipleOf !== undefined && !isMultipleOf(value, multipleOf)) {
		add(path, 'multipleOf', { limit: multipleOf });
	}
};

type Add = (path: JsonPath, code: JsonIssueCode, params?: JsonIssue['params']) => void;

const checkArray = (
	list: unknown[],
	schema: JsonSchemaObject,
	path: JsonPath,
	add: Add,
	context: Context
) => {
	if (schema.minItems !== undefined && list.length < schema.minItems) {
		add(path, 'minItems', { limit: schema.minItems });
	}
	if (schema.maxItems !== undefined && list.length > schema.maxItems) {
		add(path, 'maxItems', { limit: schema.maxItems });
	}
	if (schema.uniqueItems) {
		const seen = new Set<string>();
		list.forEach((item, index) => {
			const key = canonical(item);
			if (seen.has(key)) add([...path, index], 'uniqueItems');
			seen.add(key);
		});
	}
	const tuple = schema.prefixItems ?? (Array.isArray(schema.items) ? schema.items : []);
	const rest = Array.isArray(schema.items) ? schema.additionalItems : schema.items;
	list.forEach((item, index) => {
		const itemSchema = index < tuple.length ? tuple[index] : rest;
		if (itemSchema === undefined) return;
		if (itemSchema === false) add([...path, index], 'additionalItems');
		else collect(item, itemSchema, [...path, index], context);
	});
	if (schema.contains !== undefined) {
		const matches = list.filter((item) => isValidJson(item, schema.contains, context.root)).length;
		const atLeast = schema.minContains ?? 1;
		if (matches < atLeast || (schema.maxContains !== undefined && matches > schema.maxContains)) {
			add(path, 'contains');
		}
	}
};

const checkObject = (
	object: Record<string, unknown>,
	schema: JsonSchemaObject,
	path: JsonPath,
	add: Add,
	context: Context
) => {
	const keys = Object.keys(object);
	for (const key of schema.required ?? []) {
		if (object[key] === undefined) add([...path, key], 'required');
	}
	if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
		add(path, 'minProperties', { limit: schema.minProperties });
	}
	if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
		add(path, 'maxProperties', { limit: schema.maxProperties });
	}
	for (const key of keys) {
		const value = object[key];
		let known = false;
		const declared = schema.properties?.[key];
		if (declared !== undefined) {
			known = true;
			collect(value, declared, [...path, key], context);
		}
		for (const [pattern, patterned] of Object.entries(schema.patternProperties ?? {})) {
			if (testPatternStrict(pattern, key)) {
				known = true;
				collect(value, patterned, [...path, key], context);
			}
		}
		if (!known && schema.additionalProperties !== undefined) {
			if (schema.additionalProperties === false) add([...path, key], 'additionalProperties');
			else collect(value, schema.additionalProperties, [...path, key], context);
		}
		if (
			schema.propertyNames !== undefined &&
			!isValidJson(key, schema.propertyNames, context.root)
		) {
			add([...path, key], 'propertyNames');
		}
	}
	const presentDependents = (dependent: string, list: string[]) => {
		if (object[dependent] === undefined) return;
		for (const key of list) {
			if (object[key] === undefined) add([...path, key], 'dependentRequired', { key: dependent });
		}
	};
	for (const [key, list] of Object.entries(schema.dependentRequired ?? {})) {
		presentDependents(key, list);
	}
	for (const [key, part] of Object.entries(schema.dependentSchemas ?? {})) {
		if (object[key] !== undefined) collect(object, part, path, context);
	}
	for (const [key, part] of Object.entries(schema.dependencies ?? {})) {
		if (Array.isArray(part)) presentDependents(key, part);
		else if (object[key] !== undefined) collect(object, part, path, context);
	}
};

const testPatternStrict = (pattern: string, text: string) => {
	try {
		return new RegExp(pattern, 'u').test(text);
	} catch {
		return false;
	}
};

const issuesOf = (value: unknown, schema: JsonSchema, path: JsonPath, context: Context) => {
	const issues: JsonIssue[] = [];
	collect(value, schema, path, { ...context, issues, depth: context.depth + 1 });
	return issues;
};

const checkUnions = (
	value: unknown,
	schema: JsonSchemaObject,
	path: JsonPath,
	add: Add,
	context: Context
) => {
	for (const part of schema.allOf ?? []) collect(value, part, path, context);

	const reportBest = (results: JsonIssue[][]) => {
		// The branch that fits best explains the problem better than "matches nothing" does.
		const typed = results
			.filter(
				(issues) =>
					!issues.some((issue) => issue.code === 'type' && issue.path.length === path.length)
			)
			.sort((left, right) => left.length - right.length);
		if (typed.length > 0) context.issues.push(...typed[0]);
		else add(path, 'noVariant');
	};
	if (schema.anyOf) {
		const results = schema.anyOf.map((part) => issuesOf(value, part, path, context));
		if (!results.some((issues) => issues.length === 0)) reportBest(results);
	}
	if (schema.oneOf) {
		const results = schema.oneOf.map((part) => issuesOf(value, part, path, context));
		const passing = results.filter((issues) => issues.length === 0).length;
		if (passing === 0) reportBest(results);
		else if (passing > 1) add(path, 'noVariant');
	}
	if (schema.not !== undefined && isValidJson(value, schema.not, context.root)) add(path, 'not');
	if (schema.if !== undefined) {
		const branch = isValidJson(value, schema.if, context.root) ? schema.then : schema.else;
		if (branch !== undefined) collect(value, branch, path, context);
	}
};

function collect(value: unknown, schema: JsonSchema, path: JsonPath, context: Context): void {
	if (context.depth > STRICT_MAX_DEPTH) return;
	if (schema === true) return;
	const before = context.issues.length;
	const add: Add = (at, code, params) => {
		context.issues.push({ path: at, code, params });
	};
	if (schema === false) {
		add(path, 'not');
		return;
	}
	const nested = { ...context, depth: context.depth + 1 };

	if (typeof schema.$ref === 'string') {
		const target = lookupRef(schema.$ref, context.root);
		if (target !== undefined) collect(value, target, path, nested);
	}

	const types = schema.type === undefined ? [] : ([schema.type].flat() as JsonType[]);
	const typed = types.length === 0 || types.some((type) => matchesJsonType(value, type));
	if (!typed) {
		add(path, 'type', { expected: types.join('|') });
	} else {
		if (schema.enum && !schema.enum.some((option) => jsonEquals(option, value))) add(path, 'enum');
		if (schema.const !== undefined && !jsonEquals(schema.const, value)) {
			add(path, 'const', { expected: JSON.stringify(schema.const) });
		}
		const actual = jsonTypeOf(value);
		if (actual === 'string') checkString(value as string, schema, path, add);
		if (actual === 'number') checkNumber(value as number, schema, path, add);
		if (actual === 'array') checkArray(value as unknown[], schema, path, add, nested);
		if (actual === 'object') {
			checkObject(value as Record<string, unknown>, schema, path, add, nested);
		}
		checkUnions(value, schema, path, add, nested);
	}

	// `errorMessage` rewords what this schema found at this very value.
	if (typeof schema.errorMessage === 'string') {
		for (const issue of context.issues.slice(before)) {
			if (issue.path.length === path.length) issue.message = schema.errorMessage;
		}
	}
}

/** Every way `value` breaks `schema`, with references resolved against `root` (default: `schema`). */
export const validateJson = (
	value: unknown,
	schema: JsonSchema,
	root: JsonSchema = schema
): JsonIssue[] => {
	const context: Context = { root, issues: [], depth: 0 };
	collect(value, schema, [], context);
	const seen = new Set<string>();
	return context.issues.filter((issue) => {
		const key = `${JSON.stringify(issue.path)}:${issue.code}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

/** Whether `value` conforms to `schema`. */
export const isValidJson = (
	value: unknown,
	schema: JsonSchema | undefined,
	root: JsonSchema
): boolean => {
	if (schema === undefined) return true;
	const context: Context = { root, issues: [], depth: 0 };
	collect(value, schema, [], context);
	return context.issues.length === 0;
};
