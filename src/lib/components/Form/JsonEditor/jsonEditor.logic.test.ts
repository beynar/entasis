// The schema logic, without a component: resolving unions and references, the validator's verdicts,
// inferring a schema from a value, and the immutable edits.
import { describe, expect, test } from 'vitest';
import { inferJsonSchema } from './jsonEditor.infer.js';
import {
	blankFromInferred,
	blankJsonValue,
	coerceJsonValue,
	editedType,
	flattenSchema,
	initialJsonValue,
	itemSchema,
	propertySchema,
	renameJsonKey,
	resolveJsonSchema,
	setJsonValue,
	type JsonSchema,
	type JsonSchemaObject
} from './jsonEditor.schema.js';
import { isValidJson, validateJson } from './jsonEditor.validate.js';
import {
	dateFromJson,
	dateToJson,
	joinDateTime,
	secondsFromTime,
	splitDateTime,
	stringControl,
	timeFromSeconds
} from './jsonEditor.controls.js';

const codes = (value: unknown, schema: JsonSchema) =>
	validateJson(value, schema).map((issue) => issue.code);
const at = (value: unknown, schema: JsonSchema) =>
	validateJson(value, schema).map((issue) => [issue.path.join('.'), issue.code]);

describe('validateJson', () => {
	test.each<[string, JsonSchema, unknown, string[]]>([
		['type', { type: 'string' }, 1, ['type']],
		['type list', { type: ['string', 'null'] }, null, []],
		['integer refuses a decimal', { type: 'integer' }, 1.5, ['type']],
		['integer takes a whole number', { type: 'integer' }, 2, []],
		['number takes a whole number', { type: 'number' }, 2, []],
		['enum', { enum: ['a', 'b'] }, 'c', ['enum']],
		['enum compares objects', { enum: [{ a: 1, b: 2 }] }, { b: 2, a: 1 }, []],
		['const', { const: 'a' }, 'b', ['const']],
		['minLength', { minLength: 2 }, 'a', ['minLength']],
		['maxLength counts code points', { maxLength: 1 }, '😀', []],
		['pattern', { pattern: '^a' }, 'b', ['pattern']],
		['an unreadable pattern says nothing', { pattern: '(' }, 'b', []],
		['minimum', { minimum: 2 }, 1, ['minimum']],
		['maximum', { maximum: 2 }, 3, ['maximum']],
		['exclusive minimum', { exclusiveMinimum: 2 }, 2, ['exclusiveMinimum']],
		['exclusive maximum', { exclusiveMaximum: 2 }, 2, ['exclusiveMaximum']],
		['draft 4 exclusive minimum', { minimum: 2, exclusiveMinimum: true }, 2, ['exclusiveMinimum']],
		['multipleOf', { multipleOf: 0.25 }, 0.3, ['multipleOf']],
		['multipleOf survives floats', { multipleOf: 0.1 }, 0.3, []],
		['minItems', { minItems: 1 }, [], ['minItems']],
		['maxItems', { maxItems: 1 }, [1, 2], ['maxItems']],
		['uniqueItems', { uniqueItems: true }, [1, 1], ['uniqueItems']],
		['contains', { contains: { const: 1 } }, [2], ['contains']],
		['minProperties', { minProperties: 1 }, {}, ['minProperties']],
		['maxProperties', { maxProperties: 0 }, { a: 1 }, ['maxProperties']],
		['not', { not: { const: 1 } }, 1, ['not']],
		['false', false, 1, ['not']],
		['true', true, 1, []]
	])('%s', (_, schema, value, expected) => {
		expect(codes(value, schema)).toEqual(expected);
	});

	test.each<[string, string, boolean]>([
		['email', 'a@b.co', true],
		['email', 'nope', false],
		['uri', 'https://a.co', true],
		['uri', 'nope', false],
		['date', '2024-02-29', true],
		['date', '2023-02-29', false],
		['time', '10:30:00Z', true],
		['time', '25:00', false],
		['date-time', '2024-05-01T10:30:00+02:00', true],
		['date-time', '2024-05-01', false],
		['uuid', '7f1c0a52-9a3e-4c7b-8a55-2c0e7d9b1f10', true],
		['uuid', 'nope', false],
		['ipv4', '127.0.0.1', true],
		['ipv4', '256.0.0.1', false],
		['ipv6', '::1', true],
		['hostname', 'a.example.com', true],
		['hostname', '-a', false],
		['regex', '^a$', true],
		['regex', '(', false],
		['color', '#5f62ef', true],
		['color', 'blue', false]
	])('format %s of %s', (format, value, valid) => {
		expect(isValidJson(value, { format }, true)).toBe(valid);
	});

	test('an empty text is not a badly formatted one', () => {
		expect(codes('', { format: 'email' })).toEqual([]);
	});

	test('a missing required key points at the key', () => {
		expect(at({}, { required: ['a'] })).toEqual([['a', 'required']]);
	});

	test('problems point at the value that has them', () => {
		const schema: JsonSchema = {
			properties: { list: { items: { properties: { n: { type: 'number' } } } } }
		};
		expect(at({ list: [{ n: 1 }, { n: 'x' }] }, schema)).toEqual([['list.1.n', 'type']]);
	});

	test('additionalProperties and propertyNames', () => {
		expect(at({ a: 1 }, { additionalProperties: false })).toEqual([['a', 'additionalProperties']]);
		expect(at({ a: 1 }, { additionalProperties: { type: 'string' } })).toEqual([['a', 'type']]);
		expect(at({ a: 1 }, { propertyNames: { pattern: '^b' } })).toEqual([['a', 'propertyNames']]);
	});

	test('patternProperties take a key from additionalProperties', () => {
		const schema: JsonSchema = {
			patternProperties: { '^x-': { type: 'string' } },
			additionalProperties: false
		};
		expect(at({ 'x-a': 'y' }, schema)).toEqual([]);
		expect(at({ 'x-a': 1, b: 1 }, schema)).toEqual([
			['x-a', 'type'],
			['b', 'additionalProperties']
		]);
	});

	test('tuples, in both drafts', () => {
		const modern: JsonSchema = { prefixItems: [{ type: 'string' }], items: false };
		const old: JsonSchema = { items: [{ type: 'string' }], additionalItems: false };
		for (const schema of [modern, old]) {
			expect(at(['a'], schema)).toEqual([]);
			expect(at([1], schema)).toEqual([['0', 'type']]);
			expect(at(['a', 'b'], schema)).toEqual([['1', 'additionalItems']]);
		}
	});

	test('dependentRequired names the key that asks', () => {
		const issues = validateJson({ a: 1 }, { dependentRequired: { a: ['b'] } });
		expect(issues).toMatchObject([
			{ path: ['b'], code: 'dependentRequired', params: { key: 'a' } }
		]);
	});

	test('if / then / else', () => {
		const schema: JsonSchema = {
			if: { properties: { a: { const: 1 } }, required: ['a'] },
			then: { required: ['b'] },
			else: { required: ['c'] }
		};
		expect(at({ a: 1 }, schema)).toEqual([['b', 'required']]);
		expect(at({ a: 2 }, schema)).toEqual([['c', 'required']]);
	});

	test('a union reports the branch that fits best, not that nothing matched', () => {
		const schema: JsonSchema = {
			oneOf: [
				{ type: 'object', required: ['a'], properties: { a: { type: 'string' } } },
				{ type: 'number' }
			]
		};
		expect(at({ a: 1 }, schema)).toEqual([['a', 'type']]);
		expect(at(true, schema)).toEqual([['', 'noVariant']]);
	});

	test('oneOf refuses a value that fits two branches', () => {
		expect(codes(1, { oneOf: [{ type: 'number' }, { minimum: 0 }] })).toEqual(['noVariant']);
	});

	test('references, recursion included', () => {
		const schema: JsonSchema = {
			$defs: {
				node: {
					type: 'object',
					properties: { child: { $ref: '#/$defs/node' }, n: { type: 'number' } }
				}
			},
			$ref: '#/$defs/node'
		};
		expect(at({ child: { child: { n: 'x' } } }, schema)).toEqual([['child.child.n', 'type']]);
	});

	test('errorMessage rewords the schema that has it', () => {
		const [issue] = validateJson('x', { pattern: '^a', errorMessage: 'Starts with a' });
		expect(issue.message).toBe('Starts with a');
	});
});

describe('resolveJsonSchema', () => {
	test('follows $ref chains and keeps the keywords beside them', () => {
		const root: JsonSchema = {
			$defs: { a: { $ref: '#/$defs/b' }, b: { type: 'string', minLength: 1 } }
		};
		const node = resolveJsonSchema({ $ref: '#/$defs/a', title: 'Here' }, root, undefined);
		expect(node.types).toEqual(['string']);
		expect(node.schema).toMatchObject({ minLength: 1, title: 'Here' });
	});

	test('finds an anchor', () => {
		const root: JsonSchema = { $defs: { a: { $anchor: 'name', type: 'number' } } };
		expect(resolveJsonSchema({ $ref: '#name' }, root, undefined).types).toEqual(['number']);
	});

	test('a cycle of references ends', () => {
		const root: JsonSchema = { $defs: { a: { $ref: '#/$defs/b' }, b: { $ref: '#/$defs/a' } } };
		expect(() => resolveJsonSchema({ $ref: '#/$defs/a' }, root, undefined)).not.toThrow();
	});

	test('merges allOf, tightest limit and all required', () => {
		const schema: JsonSchema = {
			allOf: [
				{ type: 'object', required: ['a'], properties: { a: { minimum: 1 } } },
				{ required: ['b'], properties: { a: { maximum: 5 }, b: { type: 'string' } } }
			]
		};
		const flat = flattenSchema(schema, schema, {});
		expect(flat.required).toEqual(['a', 'b']);
		expect(flat.properties?.a).toMatchObject({ minimum: 1, maximum: 5 });
	});

	test('conditions apply as the value triggers them', () => {
		const schema: JsonSchema = {
			type: 'object',
			if: { properties: { kind: { const: 'a' } }, required: ['kind'] },
			then: { properties: { extra: { type: 'string' } } }
		};
		expect(flattenSchema(schema, schema, { kind: 'a' }).properties).toHaveProperty('extra');
		expect(flattenSchema(schema, schema, { kind: 'b' }).properties).toBeUndefined();
	});

	test('dependentRequired and dependentSchemas follow the value', () => {
		const schema: JsonSchema = {
			dependentRequired: { a: ['b'] },
			dependentSchemas: { c: { properties: { d: { type: 'string' } } } }
		};
		expect(flattenSchema(schema, schema, { a: 1 }).required).toEqual(['b']);
		expect(flattenSchema(schema, schema, {}).required).toBeUndefined();
		expect(flattenSchema(schema, schema, { c: 1 }).properties).toHaveProperty('d');
	});

	test('oneOf of constants is a list of options with their titles', () => {
		const node = resolveJsonSchema(
			{ oneOf: [{ const: 'a', title: 'A' }, { const: 'b' }] },
			true,
			undefined
		);
		expect(node.options).toEqual([
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'b' }
		]);
		expect(node.variants).toEqual([]);
	});

	test('x-enumNames name the options', () => {
		const node = resolveJsonSchema({ enum: [1, 2], 'x-enumNames': ['One', 'Two'] }, true, 1);
		expect(node.options?.map((option) => option.label)).toEqual(['One', 'Two']);
	});

	test('a null branch makes the other one nullable, without a choice to make', () => {
		const node = resolveJsonSchema({ anyOf: [{ type: 'string' }, { type: 'null' }] }, true, 'a');
		expect(node.variants).toEqual([]);
		expect(node.types).toEqual(['string', 'null']);
	});

	const union: JsonSchema = {
		oneOf: [
			{
				title: 'Card',
				type: 'object',
				properties: { kind: { const: 'card' }, number: { type: 'string' } },
				required: ['kind']
			},
			{
				type: 'object',
				properties: { kind: { const: 'iban' }, iban: { type: 'string' } },
				required: ['kind']
			}
		]
	};

	test('a union names its branches by title, else by the constant that tells them apart', () => {
		const node = resolveJsonSchema(union, union, undefined);
		expect(node.variants.map((variant) => variant.label)).toEqual(['Card', 'iban']);
	});

	test('the value picks the branch', () => {
		expect(resolveJsonSchema(union, union, { kind: 'iban' }).variantIndex).toBe(1);
		expect(resolveJsonSchema(union, union, { kind: 'iban' }).schema.properties).toHaveProperty(
			'iban'
		);
	});

	test('a branch the user picked holds while the value fits it, and gives way when it does not', () => {
		const loose: JsonSchema = {
			anyOf: [
				{ title: 'A', type: 'object' },
				{ title: 'B', type: 'object' }
			]
		};
		expect(resolveJsonSchema(loose, loose, {}, 1).variantIndex).toBe(1);
		expect(resolveJsonSchema(union, union, { kind: 'card' }, 1).variantIndex).toBe(0);
	});

	test('the property keeps its own title over its branch', () => {
		const schema: JsonSchema = { title: 'Pay with', oneOf: [{ title: 'Card' }, { title: 'Iban' }] };
		expect(resolveJsonSchema(schema, schema, undefined).schema.title).toBe('Pay with');
	});

	test('the type edited follows the value, else the schema', () => {
		const text = resolveJsonSchema({ type: ['string', 'number'] }, true, undefined);
		expect(editedType(text, undefined)).toBe('string');
		expect(editedType(text, 3)).toBe('number');
		const whole = resolveJsonSchema({ type: 'integer' }, true, 3);
		expect(editedType(whole, 3)).toBe('integer');
		const nullable = resolveJsonSchema({ type: ['null', 'string'] }, true, undefined);
		expect(editedType(nullable, undefined)).toBe('string');
		expect(editedType(resolveJsonSchema({ properties: {} }, true, undefined), undefined)).toBe(
			'object'
		);
	});
});

describe('children', () => {
	test('propertySchema: declared, then by pattern, then additional', () => {
		const schema = {
			properties: { a: { type: 'string' as const } },
			patternProperties: { '^x': { type: 'number' as const } },
			additionalProperties: { type: 'boolean' as const }
		};
		expect(propertySchema(schema, 'a')).toEqual({ type: 'string' });
		expect(propertySchema(schema, 'xy')).toEqual({ type: 'number' });
		expect(propertySchema(schema, 'z')).toEqual({ type: 'boolean' });
	});

	test('itemSchema: tuple, then rest', () => {
		const schema = {
			prefixItems: [{ type: 'string' as const }],
			items: { type: 'number' as const }
		};
		expect(itemSchema(schema, 0)).toEqual({ type: 'string' });
		expect(itemSchema(schema, 3)).toEqual({ type: 'number' });
	});
});

describe('starting values', () => {
	test('an object starts with its defaults and required shapes, not with empty scalars', () => {
		const schema: JsonSchema = {
			type: 'object',
			required: ['name', 'tags', 'nested', 'kind'],
			properties: {
				name: { type: 'string' },
				tags: { type: 'array', items: { type: 'string' } },
				nested: {
					type: 'object',
					required: ['n'],
					properties: { n: { type: 'number', default: 1 } }
				},
				kind: { const: 'a' },
				level: { type: 'integer', default: 3 },
				optional: { type: 'object' }
			}
		};
		expect(initialJsonValue(schema)).toEqual({
			tags: [],
			nested: { n: 1 },
			kind: 'a',
			level: 3
		});
	});

	test('a recursive schema stops', () => {
		const schema: JsonSchema = {
			$ref: '#/$defs/a',
			$defs: {
				a: { type: 'object', required: ['next'], properties: { next: { $ref: '#/$defs/a' } } }
			}
		};
		expect(() => initialJsonValue(schema)).not.toThrow();
	});

	test('a blank row is something its control can hold', () => {
		expect(blankJsonValue({ type: 'string' }, true)).toBe('');
		expect(blankJsonValue({ type: 'integer', minimum: 1.5 }, true)).toBe(2);
		expect(blankJsonValue({ type: 'boolean' }, true)).toBe(false);
		expect(blankJsonValue({ enum: ['a', 'b'] }, true)).toBe('a');
		expect(blankJsonValue({ type: 'array', minItems: 2, items: { type: 'number' } }, true)).toEqual(
			[0, 0]
		);
		expect(blankJsonValue({ default: { a: 1 } }, true)).toEqual({ a: 1 });
	});

	test('a default is copied, so editing it cannot change the schema', () => {
		const shared = { a: 1 };
		expect(blankJsonValue({ default: shared }, true)).not.toBe(shared);
	});
});

describe('inferJsonSchema', () => {
	test.each<[unknown, object]>([
		['a', { type: 'string' }],
		['ada@acme.dev', { type: 'string', format: 'email' }],
		['https://acme.dev', { type: 'string', format: 'uri' }],
		['2024-05-01', { type: 'string', format: 'date' }],
		['2024-05-01T10:00:00Z', { type: 'string', format: 'date-time' }],
		['10:30', { type: 'string', format: 'time' }],
		['#5f62ef', { type: 'string', format: 'color' }],
		['7f1c0a52-9a3e-4c7b-8a55-2c0e7d9b1f10', { type: 'string', format: 'uuid' }],
		[1, { type: 'integer' }],
		[1.5, { type: 'number' }],
		[true, { type: 'boolean' }],
		[null, { type: 'null' }]
	])('%s', (value, expected) => {
		expect(inferJsonSchema(value)).toEqual(expected);
	});

	test('the value it came from conforms', () => {
		const value = {
			a: 1,
			b: [{ c: 'x@y.co' }, { c: 'x@z.co', d: null }, { c: 'x@w.co', d: 2 }],
			e: [1, 1.5],
			f: [],
			g: { h: [[1], [2]] }
		};
		expect(validateJson(value, inferJsonSchema(value))).toEqual([]);
	});

	test('items share what siblings have in common', () => {
		const schema = inferJsonSchema([
			{ a: 1, b: 'x' },
			{ a: 1.5, c: true }
		]);
		expect(schema.items).toMatchObject({
			type: 'object',
			required: ['a'],
			properties: { a: { type: 'number' }, b: { type: 'string' }, c: { type: 'boolean' } }
		});
	});

	test('a format holds only if every sibling has it', () => {
		expect(inferJsonSchema(['a@b.co', 'c@d.co']).items).toEqual({
			type: 'string',
			format: 'email'
		});
		expect(inferJsonSchema(['a@b.co', 'plain']).items).toEqual({ type: 'string' });
	});

	test('null beside a type is that type, left blank', () => {
		expect(inferJsonSchema(['a', null]).items).toEqual({ type: ['string', 'null'] });
	});

	test('a new row looks like its siblings', () => {
		const schema = inferJsonSchema([{ a: 'x', n: 1, ok: true, list: [1], sub: { b: null } }]);
		expect(blankFromInferred(schema.items as JsonSchema)).toEqual({
			a: '',
			n: 0,
			ok: false,
			list: [],
			sub: { b: null }
		});
	});
});

describe('edits', () => {
	test('setJsonValue changes a copy and shares the rest', () => {
		const root = { a: { b: 1 }, c: { d: 2 } };
		const next = setJsonValue(root, ['a', 'b'], 3) as typeof root;
		expect(next).toEqual({ a: { b: 3 }, c: { d: 2 } });
		expect(root.a.b).toBe(1);
		expect(next.c).toBe(root.c);
	});

	test('setJsonValue builds what is missing', () => {
		expect(setJsonValue(undefined, ['a', 'b'], 1)).toEqual({ a: { b: 1 } });
	});

	test('setJsonValue removes on undefined', () => {
		expect(setJsonValue({ a: 1, b: 2 }, ['a'], undefined)).toEqual({ b: 2 });
		expect(setJsonValue([1, 2, 3], [1], undefined)).toEqual([1, 3]);
	});

	test('renameJsonKey keeps the order of the keys', () => {
		expect(Object.keys(renameJsonKey({ a: 1, b: 2, c: 3 }, 'b', 'z'))).toEqual(['a', 'z', 'c']);
	});

	test.each<[unknown, Parameters<typeof coerceJsonValue>[1], unknown]>([
		['12', 'number', 12],
		['x', 'number', 0],
		[1.9, 'integer', 1],
		[true, 'number', 1],
		[1, 'string', '1'],
		[{ a: 1 }, 'string', '{"a":1}'],
		[null, 'string', ''],
		['false', 'boolean', false],
		['x', 'boolean', true],
		['x', 'array', ['x']],
		['', 'array', []],
		['x', 'object', {}],
		['x', 'null', null]
	])('coerce %j to %s', (value, type, expected) => {
		expect(coerceJsonValue(value, type)).toEqual(expected);
	});
});

describe('controls', () => {
	test.each<[JsonSchemaObject, unknown, string]>([
		[{ format: 'date' }, '', 'date'],
		[{ format: 'date-time' }, '', 'date-time'],
		[{ format: 'time' }, '', 'time'],
		[{ format: 'email' }, '', 'email'],
		[{ format: 'uri' }, '', 'url'],
		[{ format: 'password' }, '', 'password'],
		[{ writeOnly: true }, '', 'password'],
		[{ format: 'color' }, '', 'color'],
		[{ format: 'textarea' }, '', 'textarea'],
		[{ maxLength: 500 }, '', 'textarea'],
		[{ contentMediaType: 'text/markdown' }, '', 'textarea'],
		[{}, 'two\nlines', 'textarea'],
		[{}, 'x'.repeat(100), 'textarea'],
		[{}, 'short', 'text']
	])('%j', (schema, value, expected) => {
		expect(stringControl(schema, value)).toBe(expected);
	});

	test('dates round-trip through the picker without moving', () => {
		for (const text of ['2024-01-01', '2024-12-31', '0999-06-15']) {
			expect(dateToJson(dateFromJson(text))).toBe(text);
		}
		expect(dateFromJson('nope')).toBeNull();
		expect(dateToJson(null)).toBe('');
	});

	test('times round-trip', () => {
		expect(secondsFromTime('01:02:03')).toBe(3723);
		expect(secondsFromTime('01:02')).toBe(3720);
		expect(timeFromSeconds(3723)).toBe('01:02:03');
		expect(secondsFromTime('')).toBeNull();
	});

	test('a date-time keeps its offset when one part changes', () => {
		const parts = splitDateTime('2024-05-01T23:30:00+02:00');
		expect(parts).toEqual({ date: '2024-05-01', time: '23:30:00', suffix: '+02:00' });
		expect(joinDateTime('2024-06-01', parts.time, parts.suffix)).toBe('2024-06-01T23:30:00+02:00');
	});

	test('a date-time keeps its fractions', () => {
		const parts = splitDateTime('2024-05-01T10:00:00.250Z');
		expect(joinDateTime(parts.date, parts.time, parts.suffix)).toBe('2024-05-01T10:00:00.250Z');
	});

	test('a new date-time is complete, in UTC', () => {
		expect(joinDateTime('2024-05-01', '', '')).toBe('2024-05-01T00:00:00Z');
		expect(joinDateTime('', '10:00:00', '')).toBe('');
		expect(joinDateTime('2024-05-01', '10:00', '')).toBe('2024-05-01T10:00:00Z');
	});
});
