<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import CheckboxLine from '../CheckboxesInput/CheckboxLine.svelte';
	import { useCheckboxesInputTheme } from '../CheckboxesInput/checkboxesInput.theme.js';
	import type { CheckboxProps } from './checkbox.props.js';

	let {
		defaultValue = false,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		mode = 'normal',
		indeterminate = false,
		theme,
		disabled,
		name,
		onValidate,
		visible,
		onValueChange,
		label,
		description,
		labelPosition,
		size = 'normal',
		...rest
	}: CheckboxProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		},
		get errors() {
			return errors;
		},
		set errors(v: string[] | boolean) {
			errors = v;
		},
		get focused() {
			return focused;
		},
		set focused(v: boolean) {
			focused = v;
		},
		onValueChange: (checked) => {
			onValueChange?.(checked);
		},
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
		},
		get required() {
			return required;
		},
		onValidate: (checked) => {
			if (required && !checked) return true;
			return onValidate?.(checked) || false;
		},
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		get visible() {
			return visible;
		},
		type: 'checkbox'
	});

	const componentTheme = $derived(useCheckboxesInputTheme(theme));

	const setChecked = (checked: boolean) => {
		if (field.disabled) return;
		field.value = checked;
	};
</script>

<Field
	{field}
	{labelPosition}
	label={labelPosition ? label : undefined}
	description={labelPosition ? description : undefined}
	class={componentTheme.root({ mode })}
	{size}
	theme={{
		...theme,
		inputContainer: {
			...theme?.inputContainer,
			base: componentTheme.checkboxesInputContainer({
				mode,
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
	{...rest}
>
	<CheckboxLine
		bind:ref={field.node}
		id={field.id}
		name={field.name}
		inputValue="true"
		checked={!!field.value}
		{indeterminate}
		disabled={field.disabled}
		{mode}
		{size}
		label={labelPosition ? undefined : label}
		description={labelPosition ? undefined : description}
		classes={componentTheme}
		onCheckedChange={setChecked}
		onFocus={() => (field.focused = true)}
		onBlur={() => (field.focused = false)}
	/>
</Field>
