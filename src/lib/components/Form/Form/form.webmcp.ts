// How a Form appears to AI agents: the JSON Schema of each entry, what the agent sends back turned
// into the value the field holds, and the tool that fills, validates and submits. Loaded only when
// an app turned WebMCP on and the browser has it.

import { tick } from 'svelte';
import { jsonToolSchema, type JsonSchema } from '../JsonEditor/jsonEditor.schema.js';
import { validateJson } from '../JsonEditor/jsonEditor.validate.js';
import type { WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { watchWebMCPTool } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import {
	exposureOf,
	toolOptions,
	toolText,
	toToolName
} from '$lib/utils/webmcp/webmcp.registry.js';
import type {
	WebMCPJsonSchema,
	WebMCPTool,
	WebMCPToolProp
} from '$lib/utils/webmcp/webmcp.types.js';
import type { FieldType } from '../Field/field.js';
import { denormalizeTimeValue, type TimeInputValueUnit } from '../TimeInput/timeInputValue.js';
import { getFormInputDefinition } from './form.registry.js';
import type { FormState } from './form.state.svelte.js';
import {
	getFormValueInputType,
	type FormGroup,
	type FormInputs,
	type FormValueInput
} from './form.js';

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
		case 'json':
			return props.schema === false ? null : jsonToolSchema(props.schema as JsonSchema | undefined);
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
	if (type === 'json')
		return validateJson(value, (props.schema ?? true) as JsonSchema).length === 0;
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

export type FormToolSource = {
	readonly form: FormState<FormInputs>;
	readonly tool: WebMCPToolProp | undefined;
	readonly title: unknown;
	readonly description: unknown;
	/** Whether the form has an `onSubmit` to run; without it, the tool can only fill it in. */
	readonly canSubmit: boolean;
};

type FormToolInput = Record<string, unknown>;

const humanize = (name: string): string =>
	name
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.toLowerCase();

/** The field's visible name: its own label, or its name when the label is not plain text. */
const fieldLabel = (name: string, input: { label?: unknown }): string =>
	toolText(input.label) || humanize(name);

function fieldDescription(
	name: string,
	input: { label?: unknown; description?: unknown; helper?: unknown; placeholder?: unknown },
	group: FormGroup | undefined,
	typeNote: unknown
): string {
	const parts = [
		[toolText(group?.label), fieldLabel(name, input)].filter(Boolean).join(' / '),
		toolText(input.description),
		toolText(input.helper),
		toolText(input.placeholder) && `Example: ${toolText(input.placeholder)}`,
		toolText(typeNote)
	];
	return parts.filter(Boolean).join('. ');
}

const sentence = (text: string): string => (/[.!?…:]$/.test(text) ? text : `${text}.`);

/** What the agent sees of the form right now. Reads the form's state, so it tracks it. */
function buildTool(source: FormToolSource): Omit<WebMCPTool<FormToolInput>, 'execute'> {
	const options = toolOptions(source.tool);
	const properties: Record<string, unknown> = {};
	const required: string[] = [];
	const labels: string[] = [];
	const forTheUser: string[] = [];

	for (const { name, input, group, field } of source.form.toolFields()) {
		if (input.tool === false || field.disabled || field.readOnly) continue;
		const label = fieldLabel(name, input);
		const schema = fieldToolSchema(input);
		if (!schema) {
			forTheUser.push(label);
			continue;
		}
		properties[name] = {
			...schema,
			description:
				(input.tool && input.tool.description) ||
				fieldDescription(name, input, group, schema.description)
		};
		labels.push(label);
		if (field.required) required.push(name);
	}

	const title = toolText(source.title);
	const summary = [title, toolText(source.description)].filter(Boolean).map(sentence).join(' ');
	const behaviour = source.canSubmit
		? 'Calling this tool fills in the form on the page and submits it.'
		: 'Calling this tool fills in the form on the page; the user then acts on it.';
	const description = [
		options.description ??
			`${summary || `Form with these fields: ${labels.join(', ') || 'none'}.`} ${behaviour}`,
		forTheUser.length ? `The user must fill these in on the page: ${forTheUser.join(', ')}.` : ''
	]
		.filter(Boolean)
		.join(' ');

	return {
		name: options.name ?? toToolName(title) ?? 'form',
		title: options.title ?? (title || undefined),
		description,
		inputSchema: {
			type: 'object',
			properties,
			...(required.length ? { required } : {}),
			additionalProperties: false
		},
		// A form changes something, and only the app knows how much: the browser may ask the
		// user to confirm unless the form says it is harmless.
		annotations: {
			consequentialHint: source.canSubmit && options.consequential !== false,
			// Error messages can come from the app's validators and its server.
			untrustedContentHint: true
		}
	};
}

/**
 * The messages the agent may read. A field kept from agents stays unnamed, and a password only
 * gets the catalog's word: an app's message about it could quote it.
 */
function collectErrors(form: FormState<FormInputs>) {
	const errors: Record<string, string[]> = {};
	let hidden = false;
	for (const { name, input, field } of form.toolFields()) {
		if (field.errorMessages.length === 0) continue;
		if (input.tool === false) hidden = true;
		else if (getFormValueInputType(input) === 'password') errors[name] = [field.messages.invalid];
		else errors[name] = [...field.errorMessages];
	}
	return { errors, hidden };
}

/**
 * Fills the fields the agent may write, as a user editing them would. A field that a value just
 * revealed gets its value too, hence the loop. Whatever is left was not writable: hidden,
 * disabled, read-only, or unknown. A value no control could produce is refused, not written.
 */
async function fill(form: FormState<FormInputs>, values: FormToolInput) {
	const remaining = new Map(Object.entries(values));
	const filled: string[] = [];
	const refused: Record<string, string[]> = {};
	let progressed = true;
	while (progressed && remaining.size > 0) {
		progressed = false;
		for (const { name, input, field } of form.toolFields()) {
			if (!remaining.has(name) || input.tool === false) continue;
			const schema = fieldToolSchema(input);
			if (field.disabled || field.readOnly || !schema) continue;
			const value = remaining.get(name);
			remaining.delete(name);
			progressed = true;
			// The editor holds a value to the whole of its schema, which this short check does not read.
			const isJson = (input.type === 'field' ? input.fieldType : input.type) === 'json';
			if ((isJson || fitsToolSchema(schema, value)) && controlAccepts(input, value, field.value)) {
				field.setValue(toFieldValue(input, value) as never);
				filled.push(name);
			} else {
				refused[name] = [field.messages.invalid];
			}
		}
		await tick();
	}
	return { filled, refused, ignored: [...remaining.keys()] };
}

/** Runs the tool. Answers with field names and catalog messages, never with a value. */
async function execute(source: FormToolSource, input: FormToolInput, cancelled: () => boolean) {
	const { form } = source;
	const { filled, refused, ignored } = await fill(form, input);
	const report = { filled, ...(ignored.length ? { ignored } : {}) };
	if (cancelled()) return { status: 'cancelled', ...report };

	const anyRefused = Object.keys(refused).length > 0;
	let accepted: unknown;
	try {
		if (anyRefused) await form.validateAsync({ reveal: false });
		else if (source.canSubmit) accepted = await form.submitUnless(cancelled);
		else accepted = await form.validateAsync();
	} catch {
		// The app's handler threw. Its message is not written for a model and may quote the value.
		return { status: 'failed', ...report, message: 'The form could not be submitted.' };
	}
	if (accepted === false && cancelled()) return { status: 'cancelled', ...report };
	await tick();
	const { errors, hidden } = collectErrors(form);
	if (anyRefused || accepted === false) {
		return {
			status: 'invalid',
			...report,
			errors: { ...errors, ...refused },
			message: hidden
				? 'Nothing was submitted. Correct these fields; the user must correct other ones.'
				: 'Nothing was submitted. Correct these fields and call the tool again.'
		};
	}
	// Errors left now came from the handler, which ran: submitting again would repeat it.
	return {
		status: source.canSubmit ? 'submitted' : 'filled',
		...report,
		...(Object.keys(errors).length ? { errors } : {})
	};
}

/** Keeps a tool in step with the form until the returned function runs. */
export const expose: WebMCPExpose<FormToolSource> = (source, config) => {
	let running = false;
	let exposed = true;
	const run: WebMCPTool<FormToolInput>['execute'] = async (input, { signal }) => {
		// One call at a time: a second one would write over the fields of the first.
		if (running || source.form.loading) {
			return { status: 'busy', message: 'The form is already being filled in or submitted.' };
		}
		running = true;
		try {
			return await execute(source, input, () => !exposed || Boolean(signal?.aborted));
		} finally {
			running = false;
		}
	};
	const stop = watchWebMCPTool(
		() => ({ ...buildTool(source), execute: run }),
		() => ({ exposedTo: exposureOf(source.tool, config), modal: config.surface })
	);
	return () => {
		exposed = false;
		stop();
	};
};
