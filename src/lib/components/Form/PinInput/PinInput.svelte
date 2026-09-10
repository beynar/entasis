<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
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
		mask = false,
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		onComplete,
		visible,
		label,
		description,
		...rest
	}: PinInputProps = $props();
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
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		onValidate: (currentValue) => {
			if (required && typeof currentValue === 'string' && currentValue.length < resolvedLength()) {
				return true;
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
		onComplete: () => onComplete,
		disabled: () => field.disabled
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
	<div
		data-slot="pin-input"
		data-focused={state.isFocused}
		data-disabled={field.disabled}
		class={classes.root({ size: rest.size, disabled: field.disabled })}
	>
		<input
			bind:this={field.node}
			{@attach state.inputAttachment}
			data-slot="pin-input-input"
			type="text"
			{id}
			name={field.name}
			value={state.value}
			maxlength={state.length}
			inputmode={inputMode}
			{autocomplete}
			disabled={field.disabled}
			aria-label={label ? undefined : 'One-time code'}
			class={classes.input()}
			data-pin-input-input
			data-pin-input-input-mss={state.selectionStart}
			data-pin-input-input-mse={state.selectionEnd}
			onpointerdown={state.handlePointerDown}
			onkeydown={state.handleKeydown}
			oninput={state.handleInput}
			onpaste={state.handlePaste}
			onfocus={state.handleFocus}
			onblur={state.handleBlur}
			onselect={state.normalizeSelection}
			onkeyup={state.normalizeSelection}
			onclick={state.normalizeSelection}
		/>
		<PinInputCells {state} {classes} size={rest.size} disabled={field.disabled} {mask} />
	</div>
</Field>
