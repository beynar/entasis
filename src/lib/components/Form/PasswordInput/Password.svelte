<script lang="ts">
	import { untrack } from 'svelte';
	import { tick } from 'svelte';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { PasswordInputProps } from './passwordInput.props.js';
	import { usePasswordInputTheme } from './passwordInput.theme.js';
	import { eyeClosedIcon } from '$lib/components/Icons/eyeClosed.js';
	import { eyeIcon } from '$lib/components/Icons/eye.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

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
		onValueChange,
		visible,
		...rest
	}: PasswordInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => defaultValue);

	let showPassword = $state(false);
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
		type: 'password'
	});

	const classes = $derived(usePasswordInputTheme(theme));

	const togglePasswordVisibility = async () => {
		const input = field.node instanceof HTMLInputElement ? field.node : null;
		const selectionStart = input?.selectionStart;
		const selectionEnd = input?.selectionEnd;
		const selectionDirection = input?.selectionDirection ?? 'none';

		showPassword = !showPassword;
		await tick();

		if (input && selectionStart != null && selectionEnd != null) {
			input.focus({ preventScroll: true });
			input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
		}
	};
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
		data-1p-ignore
		type={showPassword ? 'text' : 'password'}
		{id}
		name={field.name}
		bind:value={field.value}
		bind:this={field.node}
		{placeholder}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
		disabled={field.disabled}
	/>
	<FieldActionButton
		active={showPassword}
		size={rest.size}
		label={showPassword ? `${t.hide} ${t.password}` : `${t.show} ${t.password}`}
		pressed={showPassword}
		disabled={field.disabled}
		prefix={showPassword ? eyeIcon : eyeClosedIcon}
		onclick={togglePasswordVisibility}
	/>
</Field>
