<script lang="ts">
	// A custom control composed from the public pieces: createFieldState, Field and
	// FieldHiddenInputs. `checked` is a boolean toggle, `values` a multi-value chooser and
	// `autofill` a single choice the browser can autofill.
	import { untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import FieldHiddenInputs from './FieldHiddenInputs.svelte';
	import { createFieldState } from './field.state.svelte.js';
	import type { FieldHiddenInputOption } from './fieldHiddenInputs.props.js';

	type Mode = 'checked' | 'values' | 'autofill';
	type Value = boolean | string | string[] | null;

	let {
		mode = 'checked',
		label = 'Control',
		name,
		value = $bindable(),
		required = false,
		disabled = false,
		readOnly,
		form,
		hiddenForm,
		autocomplete,
		options,
		onAutofill,
		onValueChange,
		insideButton = false,
		/** Values the multi-value control adds, one per click. */
		choices = ['red', 'green', 'blue']
	}: {
		mode?: Mode;
		label?: string;
		name?: string;
		value?: Value;
		required?: boolean;
		disabled?: boolean;
		readOnly?: boolean;
		form?: string;
		hiddenForm?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		options?: FieldHiddenInputOption[];
		onAutofill?: (value: string) => void;
		onValueChange?: (value: Value) => void;
		insideButton?: boolean;
		choices?: string[];
	} = $props();

	const id = $props.id();
	const type = untrack(() =>
		mode === 'checked' ? 'checkbox' : mode === 'values' ? 'checkboxes' : 'select'
	);

	const field = createFieldState({
		id,
		type,
		get value() {
			return value as never;
		},
		set value(next) {
			value = next as Value;
		},
		errors: [],
		focused: false,
		get name() {
			return name;
		},
		set name(next: string | undefined) {
			name = next;
		},
		get required() {
			return required;
		},
		get disabled() {
			return disabled;
		},
		onValidate: (current: unknown) =>
			required && (current === false || (Array.isArray(current) && current.length === 0)),
		onValueChange: (next) => onValueChange?.(next as Value)
	});

	const toggle = () => {
		if (mode === 'checked') field.setValue(!field.value as never);
		else if (mode === 'values') {
			const current = (field.value as string[] | null) ?? [];
			const next = choices.find((choice) => !current.includes(choice));
			field.setValue((next ? [...current, next] : []) as never);
		}
	};
	const checked = $derived(mode === 'checked' ? Boolean(field.value) : undefined);
	const submitted = $derived(
		mode === 'checked' ? 'yes' : (field.value as string | string[] | null | undefined)
	);
</script>

<Field {field} {form} {label} labelFor={false}>
	{#if insideButton}
		<button type="button" bind:this={field.node} onclick={toggle}>
			{label} control
			<FieldHiddenInputs {field} {checked} value={submitted} />
		</button>
	{:else}
		<button
			type="button"
			data-testid="control"
			bind:this={field.node}
			aria-pressed={mode === 'checked' ? Boolean(field.value) : undefined}
			disabled={field.disabled}
			onclick={toggle}
		>
			{label} control
		</button>
		<FieldHiddenInputs
			{field}
			{checked}
			value={submitted}
			form={hiddenForm}
			{autocomplete}
			{options}
			{onAutofill}
			{readOnly}
		/>
	{/if}
</Field>
