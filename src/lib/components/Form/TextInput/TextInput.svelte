<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TextInputProps } from './textInput.props.js';
	import { useTextInputTheme } from './textInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		placeholder = '',
		theme,
		disabled,
		name,
		onValidate,
		visible,
		onValueChange,
		type = 'text',
		inputAttrs,
		...rest
	}: TextInputProps = $props();
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
		onValueChange: (v) => {
			onValueChange?.(v);
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
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		get type() {
			return type;
		}
	});

	const classes = $derived(useTextInputTheme(theme));
</script>

<Field
	{field}
	size={rest.size}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: field.disabled,
				size: rest.size
			})
		}
	}}
	{...rest}
>
	<input
		{...inputAttrs}
		disabled={field.disabled}
		required={field.required}
		data-1p-ignore
		{type}
		{id}
		name={field.name}
		value={field.value ?? ''}
		oninput={(event) => {
			field.value = event.currentTarget.value;
			inputAttrs?.oninput?.(event);
		}}
		bind:this={field.node}
		onfocus={(event) => {
			field.focused = true;
			inputAttrs?.onfocus?.(event);
		}}
		onblur={(event) => {
			field.focused = false;
			inputAttrs?.onblur?.(event);
		}}
		{placeholder}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
	/>
</Field>
