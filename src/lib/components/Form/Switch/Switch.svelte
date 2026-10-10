<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Field from '../Field/Field.svelte';
	import { useFieldTheme } from '../Field/field.theme.js';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { SwitchProps } from './switch.props.js';
	import { useSwitchTheme } from './switch.theme.js';
	import Slot from '$lib/components/Slot/Slot.svelte';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		visible,
		size = 'normal',
		label,
		labelPosition,
		onValueChange,
		inputValue = 'true',
		...rest
	}: SwitchProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	// Field falls back to a generated name so Form wiring stays unique. Only a name the app gave,
	// directly or through Form, is submitted: an unnamed switch submits nothing, like a checkbox.
	let generatedName: string | undefined;

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
			return name || generatedName;
		},
		set name(v: string | undefined) {
			generatedName = v;
		},
		// Required means the switch must be on, as for Checkbox: an off switch is not an answer.
		onValidate: (checked) => {
			if (required && !checked) return true;
			return onValidate?.(checked) || false;
		},
		get visible() {
			return visible;
		},
		type: 'switch'
	});

	const classes = $derived(useSwitchTheme(theme));
	const fieldClasses = $derived(useFieldTheme(theme));
	const onclick = () => {
		if (disabled) return;
		field.value = !field.value;
	};

	// A blocked native submit (or reportValidity) focuses the first invalid control. When that is
	// this switch's hidden input, the report belongs to the visible switch: it shows its own error
	// and takes focus. Firefox hides its bubble when the reported input loses focus, which only
	// works once its focus has settled, so the hand-off waits a task. A silent checkValidity()
	// focuses nothing, so it changes nothing here.
	const onHiddenInputFocus = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		field.validate();
		setTimeout(() => {
			if (input.ownerDocument.activeElement === input) field.node?.focus();
		});
	};

	// While a required switch is off, its hidden input also carries a blank custom error. Chromium
	// and WebKit trim the message before showing their bubble, so a blank one shows nothing over
	// the switch's own error, and the constraint never lapses: every submit stays blocked, even
	// ones sent back to back.
	const blankNativeReport: Attachment<HTMLInputElement> = (input) => {
		input.setCustomValidity(field.required && !field.value ? ' ' : '');
	};

	const onKeydown = (e: KeyboardEvent) => {
		if (disabled) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			field.value = !field.value;
		}
	};
</script>

<Field
	{field}
	{labelPosition}
	labelFor={false}
	label={labelPosition ? label : undefined}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				size,
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
	{...rest}
>
	<!-- Visually hidden rather than `hidden`, so the browser can still report it invalid. -->
	<input
		onchange={onclick}
		onfocus={onHiddenInputFocus}
		name={name || undefined}
		id={'input-' + field.id}
		value={inputValue}
		checked={!!field.value}
		required={field.required}
		disabled={field.disabled}
		type="checkbox"
		tabindex={-1}
		aria-hidden="true"
		class="sr-only"
		{@attach blankNativeReport}
	/>
	<div
		bind:this={field.node}
		id={field.id}
		data-checked={!!value}
		aria-checked={!!value}
		aria-labelledby={label ? field.labelId : undefined}
		aria-required={field.required || undefined}
		aria-disabled={field.disabled || undefined}
		role="switch"
		tabindex={field.disabled ? -1 : 0}
		class={classes.toggle({ checked: !!value, size, disabled })}
		{onclick}
		onkeydown={onKeydown}
		onfocus={() => (field.focused = true)}
		onblur={() => (field.focused = false)}
	>
		<span class={classes.thumb({ checked: !!value, size })} data-checked={!!value}></span>
	</div>
	{#snippet suffix()}
		{#if !labelPosition}
			<Slot
				as="span"
				attrs={{ id: field.labelId }}
				render={label}
				class={fieldClasses.label({ required: field.required })}
			/>
		{/if}
	{/snippet}
</Field>
