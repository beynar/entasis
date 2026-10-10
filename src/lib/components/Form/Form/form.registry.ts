import type { Component } from 'svelte';
import * as v from 'valibot';
import type { RegisteredInputType } from '../Field/field.js';
import type { FieldValidationResult } from '../Field/field.state.svelte.js';
import { schemas } from '../Field/schemas.js';
import type { FormInputDefinition, FormRegisteredInput, FormRenderableInput } from './form.js';

/** The definitions `registerFormInputs` takes: one per `FormInputRegistry` key, all optional. */
export type FormInputDefinitions = { [T in RegisteredInputType]?: FormInputDefinition<T> };

/** A definition with its value type erased, as the registry stores and Form renders it. */
export type RegisteredFormInputDefinition = {
	component: Component<Record<string, unknown>>;
	isEmpty: (value: unknown) => boolean;
	validate?: (value: unknown) => FieldValidationResult;
};

type ErasedDefinition = {
	component: unknown;
	isEmpty?: (value: unknown) => boolean;
	validate?: (value: unknown) => FieldValidationResult;
};

// Form's own entry kinds; the built-in input types are rejected through the schema table.
const ENTRY_KINDS = new Set(['field', 'custom', 'action', 'group']);
const definitions = new Map<string, RegisteredFormInputDefinition>();

const isEmptyValue = (value: unknown) =>
	value === null ||
	value === undefined ||
	value === '' ||
	(Array.isArray(value) && value.length === 0);

/**
 * Registers the components behind the app's `FormInputRegistry` types, so entries such as
 * `{ type: 'money', label: 'Price' }` render in every Form and ask() dialog. Call it at the top
 * level of a module the server and the browser both load before a form renders, such as one the
 * root layout imports. Registering a type again replaces it, so hot reloads keep working.
 *
 * Returns a function that removes these registrations.
 */
export function registerFormInputs(inputs: FormInputDefinitions): () => void {
	const added: [string, RegisteredFormInputDefinition][] = [];
	// Erased: inside the library the registry is empty, so each definition's own type is `never`.
	const entries = Object.entries(inputs as Record<string, ErasedDefinition | undefined>);
	for (const [type, definition] of entries) {
		if (!definition) continue;
		if (ENTRY_KINDS.has(type) || Object.hasOwn(schemas.required, type)) {
			throw new Error(`[Form] "${type}" is a built-in input type and cannot be registered.`);
		}
		added.push([
			type,
			{
				// The registry erases each definition's value type; Form hands the component the
				// field it registered for that type, which restores it.
				component: definition.component as RegisteredFormInputDefinition['component'],
				isEmpty: definition.isEmpty ?? isEmptyValue,
				validate: definition.validate
			}
		]);
	}
	for (const [type, definition] of added) definitions.set(type, definition);
	return () => {
		for (const [type, definition] of added) {
			if (definitions.get(type) === definition) definitions.delete(type);
		}
	};
}

export const getFormInputDefinition = (type: string) => definitions.get(type);

export const isRegisteredFormInput = (input: FormRenderableInput): input is FormRegisteredInput =>
	definitions.has(input.type);

const registeredSchemas = new WeakMap<
	RegisteredFormInputDefinition,
	{ required: v.GenericSchema; optional: v.GenericSchema }
>();

/** The `required`/optional check a registered type gets, in the built-in schemas' terms. */
export function getRegisteredInputSchema(
	definition: RegisteredFormInputDefinition,
	required: boolean
): v.GenericSchema {
	let entry = registeredSchemas.get(definition);
	if (!entry) {
		entry = {
			required: v.pipe(
				v.unknown(),
				v.check((value) => !definition.isEmpty(value))
			),
			optional: v.unknown()
		};
		registeredSchemas.set(definition, entry);
	}
	return required ? entry.required : entry.optional;
}
