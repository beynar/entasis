<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState, type FieldValidatorResult } from '../Field/field.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import PinInputCells from './PinInputCells.svelte';
	import type { PinInputProps } from './pinInput.props.js';
	import { PIN_INPUT_DIGITS_PATTERN, PinInputState } from './pinInput.state.svelte.js';
	import { usePinInputTheme } from './pinInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		length = 6,
		pattern = PIN_INPUT_DIGITS_PATTERN,
		inputMode = 'numeric',
		autocomplete = 'one-time-code',
		pasteTransformer,
		normalizeValue,
		onRejectInput,
		submitOnComplete = false,
		groups,
		mask = false,
		theme,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		onComplete,
		visible,
		label,
		description,
		...rest
	}: PinInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const resolvedLength = () => (Number.isFinite(length) ? Math.max(1, Math.floor(length)) : 6);

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
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
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
		onValidate: (currentValue): FieldValidatorResult => {
			if (required && typeof currentValue === 'string' && currentValue.length < resolvedLength()) {
				return field.messages.incomplete(resolvedLength());
			}
			return onValidate?.(currentValue) || false;
		},
		get visible() {
			return visible;
		},
		type: 'pin'
	});

	const state = new PinInputState({
		value: () => field.value,
		setValue: (nextValue) => {
			field.value = nextValue;
		},
		setFocused: (nextFocused) => {
			field.focused = nextFocused;
		},
		length: resolvedLength,
		pattern: () => pattern,
		pasteTransformer: () => pasteTransformer,
		normalizeValue: () => normalizeValue,
		onRejectInput: () => onRejectInput,
		onComplete: () => onComplete,
		// Inside a Form it validates first and keeps focus on an earlier invalid field; the code
		// input never takes focus back. Outside one, the native form submits.
		submit: () => () => {
			if (field.form) void field.form.submit();
			else (field.node as HTMLInputElement | null)?.form?.requestSubmit();
		},
		submitOnComplete: () => submitOnComplete,
		disabled: () => field.disabled,
		readOnly: () => field.readOnly
	});

	const classes = $derived(usePinInputTheme(theme));
</script>

<Field
	{field}
	{label}
	{description}
	size={rest.size}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
	{...rest}
>
	<!-- Digits and codes read left to right in every document direction, so the cells and the
	     native caret over the transparent input agree. -->
	<div
		dir="ltr"
		data-slot="pin-input"
		data-focused={state.isFocused}
		data-disabled={field.disabled}
		data-readonly={field.readOnly || undefined}
		class={classes.root({ size: rest.size, disabled: field.disabled })}
	>
		<input
			bind:this={field.node}
			{@attach state.inputAttachment}
			data-slot="pin-input-input"
			type="text"
			dir="ltr"
			{id}
			name={field.name}
			value={state.value}
			maxlength={state.length}
			inputmode={inputMode}
			{autocomplete}
			disabled={field.disabled}
			aria-label={label ? undefined : t.oneTimeCode}
			class={classes.input({ composing: state.isComposing })}
			data-pin-input-input
			data-pin-input-input-mss={state.selectionStart}
			data-pin-input-input-mse={state.selectionEnd}
			onpointerdown={state.handlePointerDown}
			onkeydown={state.handleKeydown}
			oninput={state.handleInput}
			oncompositionstart={state.handleCompositionStart}
			oncompositionend={state.handleCompositionEnd}
			onpaste={state.handlePaste}
			onfocus={state.handleFocus}
			onblur={state.handleBlur}
			onselect={state.normalizeSelection}
			onkeyup={state.normalizeSelection}
			onclick={state.normalizeSelection}
		/>
		<PinInputCells {state} {classes} size={rest.size} disabled={field.disabled} {mask} {groups} />
	</div>
</Field>
