// Turns a Form entry into the JSON Schema an agent reads, and what the agent sends back into the
// value the field holds. Pure, so every input type can be checked without rendering it.

import type { WebMCPJsonSchema } from '$lib/utils/webmcp/webmcp.types.js';
import type { FieldType } from '../Field/field.js';
import { denormalizeTimeValue } from '../TimeInput/timeInputValue.js';
import type { TimeInputValueUnit } from '../TimeInput/timeInputValue.js';
import { getFormInputDefinition } from './form.registry.js';
import type { FormValueInput } from './form.js';

type EntryProps = Record<string, unknown>;
type Choice = { value: string; label?: unknown; disabled?: boolean; items?: Choice[] };

const numeric = (value: unknown): number | undefined =>
	typeof value === 'number' ? value : undefined;

const defined = (schema: WebMCPJsonSchema): WebMCPJsonSchema =>
	Object.fromEntries(Object.entries(schema).filter(([, value]) => value !== undefined));

const textSchema = (props: EntryProps, extra: WebMCPJsonSchema = {}): WebMCPJsonSchema =>
	defined({
		type: 'string',
		minLength: numeric(props.minLength),
		maxLength: numeric(props.maxLength),
		...extra
	});

type TimeSegments = { hours?: number; minutes?: number; seconds?: number };

const flattenChoices = (items: readonly Choice[]): Choice[] =>
	items.flatMap((item) => (Array.isArray(item.items) ? flattenChoices(item.items) : [item]));

/**
 * The options an agent may pick. `null` when they load on demand (an `items` function): nothing
 * here can tell an offered option from any other string, so the choice stays with the user.
 */
function choiceSchema(props: EntryProps): WebMCPJsonSchema | null {
	if (!Array.isArray(props.items)) return null;
	const choices = flattenChoices(props.items as Choice[]).filter((item) => !item.disabled);
	const labelled = choices.filter(
		({ value, label }) => typeof label === 'string' && label !== value
	);
	return defined({
		type: 'string',
		enum: choices.map(({ value }) => value),
		oneOf: labelled.length
			? choices.map(({ value, label }) => ({
					const: value,
					title: typeof label === 'string' ? label : value
				}))
			: undefined
	});
}

const TIME_PATTERN = '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$';

const dateSchema = { type: 'string', format: 'date' };
const dateTimeSchema = { type: 'string', format: 'date-time' };

/**
 * The JSON Schema of one entry's value, or `null` for a value JSON cannot carry (a file, a voice
 * recording, a drawn signature) and an app-defined type that declares no `toolSchema`: those stay
 * for the user to fill in.
 */
export function fieldToolSchema(input: FormValueInput): WebMCPJsonSchema | null {
	const type = (input.type === 'field' ? input.fieldType : input.type) as FieldType;
	const props = input as unknown as EntryProps;
	const own = input.tool ? input.tool.schema : undefined;
	if (own) return own;

	switch (type) {
		case 'text':
		case 'textarea':
			return textSchema(props);
		case 'rich-text':
			return textSchema(props, { description: 'Markdown.' });
		case 'email':
			return textSchema(props, { format: 'email' });
		case 'url':
			return textSchema(props, { format: 'uri' });
		case 'password':
			return defined({
				...textSchema(props, { format: 'password', writeOnly: true }),
				minLength: numeric(props.minLength) ?? 6
			});
		case 'phone':
			return { type: 'string', description: 'International format, such as +33612345678.' };
		case 'color':
			return { type: 'string' };
		case 'pin': {
			const length = numeric(props.length);
			return defined({ type: 'string', minLength: length, maxLength: length });
		}
		case 'number':
		case 'slider':
			return defined({
				type: 'number',
				minimum: numeric(props.min),
				maximum: numeric(props.max),
				multipleOf: numeric(props.step)
			});
		case 'slider-range':
			return {
				type: 'array',
				minItems: 1,
				items: defined({
					type: 'number',
					minimum: numeric(props.min),
					maximum: numeric(props.max)
				})
			};
		case 'rating':
			return { type: 'number', minimum: 0, maximum: numeric(props.max) ?? 5 };
		case 'time':
			return { type: 'string', pattern: TIME_PATTERN, description: 'HH:MM.' };
		case 'date':
		case 'calendar':
			return dateSchema;
		case 'datetime':
			return dateTimeSchema;
		case 'calendar-range':
			return { type: 'array', minItems: 2, maxItems: 2, items: dateSchema };
		case 'checkbox':
		case 'switch':
			return { type: 'boolean' };
		case 'select':
		case 'radio':
		case 'combobox':
			return choiceSchema(props);
		case 'select-multiple':
		case 'checkboxes': {
			const choice = choiceSchema(props);
			return choice && { type: 'array', uniqueItems: true, items: choice };
		}
		case 'tag-group': {
			const choice = choiceSchema(props);
			return choice && props.multiple
				? { type: 'array', uniqueItems: true, items: choice }
				: choice;
		}
		case 'tag':
			return defined({
				type: 'array',
				items: { type: 'string' },
				maxItems: numeric(props.maxTags)
			});
		case 'keyvalue':
			return {
				type: 'array',
				items: {
					type: 'object',
					properties: { key: { type: 'string' }, value: { type: 'string' } },
					required: ['key', 'value']
				}
			};
		case 'address':
			return {
				type: 'object',
				properties: {
					line1: { type: 'string', description: 'Street number and street.' },
					line2: { type: 'string', description: 'Apartment, suite, building, floor.' },
					postalCode: { type: 'string' },
					city: { type: 'string' },
					region: { type: 'string' },
					country: { type: 'string' },
					countryCode: { type: 'string', description: 'ISO 3166-1 alpha-2 code, such as FR.' }
				}
			};
		case 'file':
		case 'files':
		case 'voice':
		case 'signature':
			return null;
		default:
			return getFormInputDefinition(type)?.toolSchema ?? null;
	}
}

/**
 * Whether a value fits its schema. A person is held to these limits by the control itself (a
 * disabled option cannot be picked, `maxLength` stops the typing) and validation does not repeat
 * them, so a written value has to pass here first. `null` clears a field.
 */
export function fitsToolSchema(schema: WebMCPJsonSchema, value: unknown): boolean {
	if (value === null) return true;
	const { type, minimum, maximum, minLength, maxLength, minItems, maxItems, items } = schema;
	if (schema.enum && !(schema.enum as unknown[]).includes(value)) return false;
	if (type === 'boolean') return typeof value === 'boolean';
	if (type === 'object') return fitsObject(schema, value);
	if (type === 'number') {
		if (typeof value !== 'number' || Number.isNaN(value)) return false;
		return (
			value >= ((minimum as number) ?? -Infinity) && value <= ((maximum as number) ?? Infinity)
		);
	}
	if (type === 'string') {
		if (typeof value !== 'string') return false;
		if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) return false;
		return (
			value.length >= ((minLength as number) ?? 0) &&
			value.length <= ((maxLength as number) ?? Infinity)
		);
	}
	if (type === 'array') {
		if (!Array.isArray(value)) return false;
		if (value.length < ((minItems as number) ?? 0)) return false;
		if (value.length > ((maxItems as number) ?? Infinity)) return false;
		if (schema.uniqueItems && new Set(value).size !== value.length) return false;
		return value.every((item) => !items || fitsToolSchema(items as WebMCPJsonSchema, item));
	}
	return true;
}

function fitsObject(schema: WebMCPJsonSchema, value: unknown): boolean {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const properties = (schema.properties ?? {}) as Record<string, WebMCPJsonSchema>;
	const record = value as Record<string, unknown>;
	if (((schema.required ?? []) as string[]).some((key) => record[key] === undefined)) return false;
	return Object.entries(record).every(([key, item]) =>
		key in properties
			? fitsToolSchema(properties[key], item)
			: schema.additionalProperties !== false
	);
}

function timeWithinLimits(props: EntryProps, value: unknown): boolean {
	if (typeof value !== 'string') return true;
	const [hours, minutes, seconds = 0] = value.split(':').map(Number);
	const parts: TimeSegments = { hours, minutes, seconds };
	const least = (props.minValues ?? {}) as TimeSegments;
	const most = (props.maxValues ?? {}) as TimeSegments;
	return (['hours', 'minutes', 'seconds'] as const).every(
		(unit) =>
			(parts[unit] as number) >= (least[unit] ?? 0) &&
			(parts[unit] as number) <= (most[unit] ?? Infinity)
	);
}

/** A disabled thumb keeps its value: it cannot be moved by a person either. */
function thumbsStayPut(props: EntryProps, value: unknown, current: unknown): boolean {
	const disabled = (props.thumbDisabled ?? []) as boolean[];
	const next = Array.isArray(value) ? value : [value];
	const previous = Array.isArray(current) ? current : [current];
	return disabled.every((locked, index) => !locked || next[index] === previous[index]);
}

/** Limits a control holds a person to that its schema cannot express. */
export function controlAccepts(input: FormValueInput, value: unknown, current: unknown): boolean {
	if (value === null) return true;
	const props = input as unknown as EntryProps;
	const type = input.type === 'field' ? input.fieldType : input.type;
	if (type === 'time') return timeWithinLimits(props, value);
	if (type === 'rating') return (value as number) % (props.halfSteps ? 0.5 : 1) === 0;
	if (type === 'slider' || type === 'slider-range') return thumbsStayPut(props, value, current);
	return true;
}

// A bare date is that day where the user is: `new Date('2026-11-03')` would be UTC midnight, the
// day before in the Americas.
function toDate(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	return day ? new Date(+day[1], +day[2] - 1, +day[3]) : new Date(value);
}

function toTime(value: unknown, unit: TimeInputValueUnit): unknown {
	const parts = typeof value === 'string' ? /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value) : null;
	if (!parts) return value;
	const [hours, minutes, seconds] = [+parts[1], +parts[2], +(parts[3] ?? 0)];
	return denormalizeTimeValue((hours * 3600 + minutes * 60 + seconds) * 1000, unit);
}

/**
 * What the agent sent, as the value the field holds. A value of the wrong shape passes through
 * unchanged: the field's own validation rejects it with a catalog message.
 */
export function toFieldValue(input: FormValueInput, value: unknown): unknown {
	const type = (input.type === 'field' ? input.fieldType : input.type) as FieldType;
	switch (type) {
		case 'date':
		case 'datetime':
		case 'calendar':
			return toDate(value);
		case 'calendar-range':
			return Array.isArray(value) ? value.map(toDate) : value;
		case 'time':
			return toTime(
				value,
				((input as { as?: TimeInputValueUnit }).as ??
					'millisecondSinceMidnight') as TimeInputValueUnit
			);
		default:
			return value;
	}
}
