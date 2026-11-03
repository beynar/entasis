import { tick } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import {
	registerWebMCPTool,
	toolText,
	toToolName,
	type WebMCPToolHandle
} from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPOptions, WebMCPTool } from '$lib/utils/webmcp/webmcp.types.js';
import type { FormToolOptions } from './form.props.js';
import type { FormState } from './form.state.svelte.js';
import type { FormGroup, FormInputs } from './form.js';
import { getFormValueInputType } from './form.js';
import {
	controlAccepts,
	fieldToolSchema,
	fitsToolSchema,
	toFieldValue
} from './form.toolSchema.js';

export type FormToolSource = {
	readonly form: FormState<FormInputs>;
	readonly tool: boolean | FormToolOptions | undefined;
	readonly title: unknown;
	readonly description: unknown;
	readonly disabled: boolean;
	/** Whether the form has an `onSubmit` to run; without it, the tool can only fill it in. */
	readonly canSubmit: boolean;
	readonly root: HTMLElement | undefined;
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
	const options = typeof source.tool === 'object' ? source.tool : {};
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
	const remaining = new SvelteMap(Object.entries(values));
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
			if (fitsToolSchema(schema, value) && controlAccepts(input, value, field.value)) {
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
export function exposeForm(
	source: FormToolSource,
	config: { readonly options: WebMCPOptions | null }
): () => void {
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

	return $effect.root(() => {
		let handle: WebMCPToolHandle | null = null;
		$effect(() => {
			const tool = { ...buildTool(source), execute: run };
			const own = typeof source.tool === 'object' ? source.tool : {};
			const exposedTo = own.exposedTo ?? config.options?.exposedTo;
			if (handle) handle.update(tool, { exposedTo });
			else {
				const dialog = source.root?.closest('[aria-modal="true"]');
				handle = registerWebMCPTool(tool, {
					exposedTo,
					modal: dialog ? dialog.id || true : undefined
				});
			}
		});
		$effect(() => () => {
			exposed = false;
			handle?.remove();
		});
	});
}
