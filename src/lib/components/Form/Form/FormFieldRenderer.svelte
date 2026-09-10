<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Field from '../Field/Field.svelte';
	import type { FieldLabelPosition, FieldValue, InputType } from '../Field/field.js';
	import {
		createFieldState,
		type FieldState,
		type FieldValidationResult
	} from '../Field/field.state.svelte.js';
	import type { FormFieldEntry } from './form.js';

	let {
		name,
		input,
		size,
		density,
		labelPosition,
		itemClass
	}: {
		name: string;
		input: FormFieldEntry;
		size: Sizes;
		density: Density;
		labelPosition?: FieldLabelPosition;
		itemClass?: string;
	} = $props();

	const id = $props.id();
	const initialInput = untrack(() => input);
	let value = $state<FieldValue<InputType> | null>(
		(initialInput.value === undefined
			? (initialInput.defaultValue ?? null)
			: initialInput.value) as FieldValue<InputType> | null
	);
	let errors = $state<string[] | boolean>(initialInput.errors ?? []);
	let focused = $state(initialInput.focused ?? false);

	const field = createFieldState<InputType>({
		id,
		get type() {
			return input.fieldType;
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
				((value: FieldValue<InputType>) => FieldValidationResult) | undefined;
		},
		get onValueChange() {
			return input.onValueChange as ((value: FieldValue<InputType> | null) => void) | undefined;
		},
		visible: true
	});

	const resolvedSize = $derived(input.size ?? size);
	const resolvedLabelPosition = $derived(input.labelPosition ?? labelPosition);
	const className = $derived([input.class, itemClass].filter(Boolean).join(' ') || undefined);
	const controlSnippet = $derived(input.snippet as Snippet<[field: FieldState<InputType>]>);
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
	{@render controlSnippet(field)}
</Field>
