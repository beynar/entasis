<script lang="ts">
	import { untrack } from 'svelte';
	import { tick } from 'svelte';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { check, pipe, safeParse } from 'valibot';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import { schemas } from '../Field/schemas.js';
	import type { PasswordInputProps } from './passwordInput.props.js';
	import { usePasswordInputTheme } from './passwordInput.theme.js';
	import { eyeClosedIcon } from '$lib/components/Icons/eyeClosed.js';
	import { eyeIcon } from '$lib/components/Icons/eye.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	const DEFAULT_MIN_LENGTH = 6;

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
		autocomplete,
		minLength,
		inputAttrs,
		...rest
	}: PasswordInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => defaultValue);

	// A sign-in field must accept whatever password the account already has, so the default
	// minimum is skipped for `current-password`. An explicit `minLength` always applies.
	const resolvedMinLength = $derived(
		minLength ?? (autocomplete === 'current-password' ? 0 : DEFAULT_MIN_LENGTH)
	);

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

	// The built-in `password` schema keeps its 6-character minimum for custom password controls and
	// `fieldSchemas`. This field checks presence with the text rule and applies its own minimum, so
	// `isValid`, `validate()` and Form submission agree. An empty value reports presence alone, and
	// `onValidate` runs only once the length passes.
	const passwordSchema = $derived(
		pipe(
			schemas[field.required ? 'required' : 'optional'].text,
			check(
				(password) =>
					typeof password !== 'string' ||
					password.length === 0 ||
					password.length >= resolvedMinLength,
				t.passwordTooShort(resolvedMinLength)
			)
		)
	);
	field.checkSchema = (password) => safeParse(passwordSchema, password);

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
		{...inputAttrs}
		type={showPassword ? 'text' : 'password'}
		{id}
		name={field.name}
		{autocomplete}
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
