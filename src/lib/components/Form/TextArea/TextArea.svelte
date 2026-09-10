<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TextAreaProps } from './textArea.props.js';
	import { useTextAreaTheme } from './textArea.theme.js';
	import { autosize } from './autosize.svelte.js';

	let {
		defaultValue = '',
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
		rows = 3,
		maxLength,
		onPressEnter,
		textareaAttrs,
		...rest
	}: TextAreaProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v: string | null | undefined) {
			value = v || '';
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
		onValueChange: (v) => onValueChange?.(v ?? ''),
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
		type: 'textarea'
	});

	const classes = $derived(useTextAreaTheme(theme));
	const textareaAutosize = autosize(() => ({ value: field.value }));
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
	<textarea
		{...textareaAttrs}
		maxlength={maxLength}
		disabled={field.disabled}
		{rows}
		data-1p-ignore
		{@attach textareaAutosize}
		bind:this={field.node}
		{placeholder}
		bind:value={field.value}
		onkeydown={(e) => {
			textareaAttrs?.onkeydown?.(e);
			if (e.defaultPrevented) return;
			if (e.key === 'Enter' && !e.shiftKey && onPressEnter) {
				e.preventDefault();
				onPressEnter?.(field);
			}
		}}
		name={field.name}
		id={field.id}
		required={field.required}
		class={classes.input({ disabled: field.disabled, size: rest.size })}></textarea>
</Field>
