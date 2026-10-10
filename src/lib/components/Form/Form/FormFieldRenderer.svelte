<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Field from '../Field/Field.svelte';
	import type { FieldLabelPosition, FieldType, FieldValue } from '../Field/field.js';
	import {
		createFieldState,
		type FieldState,
		type FieldValidationResult
	} from '../Field/field.state.svelte.js';
	import type { FormFieldEntry, FormRegisteredInput } from './form.js';
	import { getFormInputDefinition } from './form.registry.js';

	// What the Field wrapper and the field controller consume from an entry; everything else on
	// a registered entry belongs to its component.
	const FIELD_ENTRY_KEYS = new Set([
		'type',
		'visible',
		'class',
		'name',
		'required',
		'disabled',
		'size',
		'density',
		'labelPosition',
		'onValidate',
		'onValueChange',
		'fieldAttrs',
		'theme',
		'value',
		'defaultValue',
		'errors',
		'focused',
		'header',
		'label',
		'actions',
		'description',
		'helper',
		'footer',
		'error',
		'errorsContainer',
		'prefix',
		'suffix'
	]);

	let {
		name,
		input,
		size,
		density,
		labelPosition,
		itemClass
	}: {
		name: string;
		/** A `type: 'field'` entry with its snippet, or an entry of an app-registered type. */
		input: FormFieldEntry | FormRegisteredInput;
		size: Sizes;
		density: Density;
		labelPosition?: FieldLabelPosition;
		itemClass?: string;
	} = $props();

	const id = $props.id();
	const initialInput = untrack(() => input);
	let value = $state<FieldValue<FieldType> | null>(
		(initialInput.value === undefined
			? (initialInput.defaultValue ?? null)
			: initialInput.value) as FieldValue<FieldType> | null
	);
	let errors = $state<string[] | boolean>(initialInput.errors ?? []);
	let focused = $state(initialInput.focused ?? false);

	const field = createFieldState<FieldType>({
		id,
		get type() {
			return input.type === 'field' ? input.fieldType : input.type;
		},
		get name() {
			return name;
		},
		get value() {
			return value;
		},
		set value(nextValue) {
			value = nextValue;
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused) {
			focused = nextFocused;
		},
		get disabled() {
			return input.disabled;
		},
		get required() {
			return input.required;
		},
		get size() {
			return input.size ?? size;
		},
		get density() {
			return input.density ?? density;
		},
		get onValidate() {
			return input.onValidate as
				((value: FieldValue<FieldType>) => FieldValidationResult) | undefined;
		},
		get onValueChange() {
			return input.onValueChange as ((value: FieldValue<FieldType> | null) => void) | undefined;
		},
		visible: true
	});

	const resolvedSize = $derived(input.size ?? size);
	const resolvedLabelPosition = $derived(input.labelPosition ?? labelPosition);
	const className = $derived([input.class, itemClass].filter(Boolean).join(' ') || undefined);
	const controlSnippet = $derived(
		input.type === 'field' ? (input.snippet as Snippet<[field: FieldState<FieldType>]>) : undefined
	);
	const Control = $derived(
		input.type === 'field' ? undefined : getFormInputDefinition(input.type)?.component
	);
	const controlProps = $derived(
		Object.fromEntries(Object.entries(input).filter(([key]) => !FIELD_ENTRY_KEYS.has(key)))
	);
</script>

<Field
	{field}
	size={resolvedSize}
	density={field.density}
	labelPosition={resolvedLabelPosition}
	class={className}
	theme={input.theme}
	fieldAttrs={input.fieldAttrs}
	header={input.header}
	label={input.label}
	actions={input.actions}
	description={input.description}
	helper={input.helper}
	footer={input.footer}
	error={input.error}
	errorsContainer={input.errorsContainer}
	prefix={input.prefix}
	suffix={input.suffix}
>
	{#if controlSnippet}
		{@render controlSnippet(field)}
	{:else if Control}
		<Control {...controlProps} {field} />
	{/if}
</Field>
