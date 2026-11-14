import { describe, expect, test } from 'vitest';
import {
	controlAccepts,
	controlRefusal,
	fieldToolSchema,
	fitsToolSchema,
	toFieldValue,
	toolSchemaProblem
} from './form.webmcp.js';
import type { FormValueInput } from './form.js';
import type { WebMCPJsonSchema } from '$lib/utils/webmcp/webmcp.types.js';

const plans = [
	{ value: 'free', label: 'Free' },
	{ label: 'Paid', items: [{ value: 'team', label: 'Team' }] },
	{ value: 'corp', label: 'Corporate', disabled: true }
];
const schemaOf = (input: unknown) => fieldToolSchema(input as FormValueInput);

describe('fieldToolSchema', () => {
	test('lists the enabled options, group members included', () => {
		const schema = schemaOf({ type: 'select', items: plans });
		expect(schema?.enum).toEqual(['free', 'team']);
		expect(schema?.oneOf).toEqual([
			{ const: 'free', title: 'Free' },
			{ const: 'team', title: 'Team' }
		]);
	});

	test('a JSON field is offered, its $ref standing inside the tool', () => {
		const schema = schemaOf({
			type: 'json',
			schema: {
				type: 'object',
				$defs: {
					name: { type: 'string', maxLength: 4 },
					node: { properties: { next: { $ref: '#/$defs/node' } } }
				},
				properties: {
					title: { $ref: '#/$defs/name', description: 'Its title' },
					$ref: { const: { $ref: 'kept, this is data' } },
					tree: { $ref: '#/$defs/node' }
				}
			}
		});
		expect(schema).toEqual({
			type: 'object',
			properties: {
				title: { type: 'string', maxLength: 4, description: 'Its title' },
				$ref: { const: { $ref: 'kept, this is data' } },
				tree: { properties: { next: {} } }
			}
		});
	});

	test('a JSON field takes any JSON without a schema, and nothing under `false`', () => {
		expect(schemaOf({ type: 'json' })).toEqual({});
		expect(schemaOf({ type: 'json', schema: true })).toEqual({});
		expect(schemaOf({ type: 'json', schema: false })).toBeNull();
	});

	test('a JSON field is held to the whole schema', () => {
		const input = {
			type: 'json',
			schema: { type: 'object', required: ['a'], oneOf: [{ properties: { a: { const: 1 } } }] }
		} as unknown as FormValueInput;
		expect(controlAccepts(input, { a: 1 }, null)).toBe(true);
		expect(controlAccepts(input, { a: 2 }, null)).toBe(false);
		expect(controlAccepts(input, {}, null)).toBe(false);
		expect(controlAccepts(input, null, null)).toBe(true);
	});

	test('options that load on demand stay for the user', () => {
		expect(schemaOf({ type: 'combobox', items: async () => [] })).toBeNull();
	});

	test('an hour must exist', () => {
		const schema = schemaOf({ type: 'time' }) as WebMCPJsonSchema;
		expect(fitsToolSchema(schema, '23:59')).toBe(true);
		expect(fitsToolSchema(schema, '25:00')).toBe(false);
	});

	test('carries limits and hides nothing a person could type', () => {
		expect(schemaOf({ type: 'number', min: 1, max: 5 })).toEqual({
			type: 'number',
			minimum: 1,
			maximum: 5
		});
		expect(schemaOf({ type: 'password' })).toMatchObject({ minLength: 6, writeOnly: true });
	});

	test('leaves what JSON cannot carry to the user', () => {
		for (const type of ['file', 'files', 'voice', 'signature']) {
			expect(schemaOf({ type })).toBeNull();
		}
		expect(schemaOf({ type: 'app-type-without-schema' })).toBeNull();
	});

	test('an entry can bring its own schema', () => {
		const schema = { type: 'string', enum: ['a'] };
		expect(schemaOf({ type: 'field', fieldType: 'text', tool: { schema } })).toBe(schema);
	});
});

describe('fitsToolSchema', () => {
	test('holds a value to the limits the control would enforce', () => {
		expect(fitsToolSchema({ type: 'string', enum: ['free'] }, 'corp')).toBe(false);
		expect(fitsToolSchema({ type: 'string', maxLength: 3 }, 'long')).toBe(false);
		expect(fitsToolSchema({ type: 'number', maximum: 5 }, 9)).toBe(false);
		expect(fitsToolSchema({ type: 'number' }, '5')).toBe(false);
		expect(fitsToolSchema({ type: 'boolean' }, 'yes')).toBe(false);
		expect(
			fitsToolSchema({ type: 'array', items: { type: 'string', enum: ['free'] } }, ['corp'])
		).toBe(false);
	});

	test('accepts what fits, and null to clear', () => {
		expect(fitsToolSchema({ type: 'string', enum: ['free'] }, 'free')).toBe(true);
		expect(fitsToolSchema({ type: 'number', maximum: 5 }, 5)).toBe(true);
		expect(fitsToolSchema({ type: 'string', enum: ['free'] }, null)).toBe(true);
	});
});

describe('fitsToolSchema on composite values', () => {
	test('checks the fields of an object', () => {
		const money = {
			type: 'object',
			properties: { amount: { type: 'number', minimum: 0 } },
			required: ['amount'],
			additionalProperties: false
		};
		expect(fitsToolSchema(money, { amount: 1 })).toBe(true);
		expect(fitsToolSchema(money, { amount: -1 })).toBe(false);
		expect(fitsToolSchema(money, {})).toBe(false);
		expect(fitsToolSchema(money, { amount: 1, admin: true })).toBe(false);
	});

	test('a multiple choice holds each value once', () => {
		expect(fitsToolSchema({ type: 'array', uniqueItems: true }, ['a', 'a'])).toBe(false);
	});
});

describe('controlAccepts', () => {
	const accepts = (input: unknown, value: unknown, current?: unknown) =>
		controlAccepts(input as FormValueInput, value, current);

	test('a time stays within the input limits', () => {
		const input = { type: 'time', minValues: { hours: 8 }, maxValues: { hours: 18 } };
		expect(accepts(input, '09:00')).toBe(true);
		expect(accepts(input, '19:00')).toBe(false);
	});

	test('a rating moves in the steps of its control', () => {
		expect(accepts({ type: 'rating' }, 3)).toBe(true);
		expect(accepts({ type: 'rating' }, 2.5)).toBe(false);
		expect(accepts({ type: 'rating', halfSteps: true }, 2.5)).toBe(true);
	});

	test('a disabled thumb stays where it is', () => {
		const input = { type: 'slider-range', thumbDisabled: [true, false] };
		expect(accepts(input, [20, 70], [20, 80])).toBe(true);
		expect(accepts(input, [30, 80], [20, 80])).toBe(false);
	});
});

describe('toFieldValue', () => {
	test('a bare date is that day locally', () => {
		const date = toFieldValue({ type: 'date' } as FormValueInput, '2026-11-03') as Date;
		expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 3]);
	});

	test('a time follows the unit of the input', () => {
		expect(toFieldValue({ type: 'time' } as FormValueInput, '01:30')).toBe(5400000);
		expect(
			toFieldValue({ type: 'time', as: 'minuteSinceMidnight' } as FormValueInput, '01:30')
		).toBe(90);
	});
});

describe('a disabled option the value already holds', () => {
	const tags = {
		type: 'checkboxes',
		items: [
			{ value: 'a', label: 'A' },
			{ value: 'legacy', label: 'Legacy', disabled: true },
			{ value: 'gone', label: 'Gone', disabled: true }
		]
	} as unknown as FormValueInput;
	const plan = { type: 'select', items: plans } as unknown as FormValueInput;

	test('stays in the schema, which tells the agent to keep it', () => {
		const schema = fieldToolSchema(tags, ['legacy']);
		expect((schema?.items as WebMCPJsonSchema).enum).toEqual(['a', 'legacy']);
		expect(schema?.description).toBe(
			'"Legacy" is disabled: keep it in the list, as the user cannot remove it either.'
		);
		expect(fieldToolSchema(plan, 'corp')?.enum).toEqual(['free', 'team', 'corp']);
		expect(fieldToolSchema(plan, 'corp')?.description).toBe(
			'"Corporate" is disabled: keep it or pick another option.'
		);
	});

	test('cannot be removed from a list, nor added, and the refusal says why', () => {
		expect(controlRefusal(tags, ['legacy', 'a'], ['legacy'])).toBeNull();
		expect(controlRefusal(tags, ['a'], ['legacy'])).toBe(
			'"Legacy" is disabled and already selected: keep it in the list, as the user cannot remove it either.'
		);
		expect(controlRefusal(tags, null, ['legacy'])).toMatch(/"Legacy" is disabled/);
		expect(controlRefusal(tags, ['legacy', 'gone'], ['legacy'])).toBe(
			'"Gone" is disabled: it cannot be picked, by the user either.'
		);
	});

	test('a single choice may move off it, as a person can, but not onto one', () => {
		expect(controlRefusal(plan, 'free', 'corp')).toBeNull();
		expect(controlRefusal(plan, 'corp', 'corp')).toBeNull();
		expect(controlRefusal(plan, 'corp', 'free')).toMatch(/"Corporate" is disabled/);
	});
});

describe('toolSchemaProblem', () => {
	test('says what is wrong and what fits', () => {
		expect(toolSchemaProblem({ type: 'string', enum: ['free', 'team'] }, 'corp')).toBe(
			'Not one of the options: "free", "team".'
		);
		expect(toolSchemaProblem({ type: 'string', maxLength: 3 }, 'long')).toBe(
			'At most 3 characters.'
		);
		expect(toolSchemaProblem({ type: 'number', minimum: 1 }, 0)).toBe('The least is 1.');
		expect(
			toolSchemaProblem({ type: 'array', items: { type: 'string', enum: ['a'] } }, ['a', 'b'])
		).toBe('Item 2: Not one of the options: "a".');
		expect(
			toolSchemaProblem(
				{ type: 'object', properties: { amount: {} }, additionalProperties: false },
				{ admin: true }
			)
		).toBe('No property "admin": use "amount".');
		expect(toolSchemaProblem({ type: 'string' }, 'ok')).toBeNull();
	});
});
