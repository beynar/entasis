<script lang="ts">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
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
		readOnly,
		messages,
		name,
		onValidate,
		visible,
		size = 'normal',
		label,
		labelPosition,
		onValueChange,
		inputValue = 'true',
		inputAttrs,
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
	// A read-only or disabled switch refuses the edit inside setValue.
	const toggle = () => {
		field.value = !field.value;
	};
</script>

<Field
	{field}
	{labelPosition}
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
	<!-- A native button: Enter and Space toggle once (Space on release), a disabled switch takes no
	     focus, and the labels below are <label for>, so a click on one toggles it. The name comes
	     from the label, or from an `aria-label` in inputAttrs. -->
	<button
		{...inputAttrs}
		bind:this={field.node}
		id={field.id}
		type="button"
		role="switch"
		aria-checked={!!field.value}
		disabled={field.disabled}
		data-checked={!!field.value}
		data-readonly={field.readOnly ? '' : undefined}
		class={classes.toggle({
			checked: !!field.value,
			size,
			disabled: field.disabled,
			readOnly: field.readOnly
		})}
		onclick={(event) => {
			inputAttrs?.onclick?.(event);
			if (!event.defaultPrevented) toggle();
		}}
		onfocus={(event) => {
			inputAttrs?.onfocus?.(event);
			field.focused = true;
		}}
		onblur={(event) => {
			inputAttrs?.onblur?.(event);
			field.focused = false;
		}}
	>
		<span class={classes.thumb({ checked: !!field.value, size })} data-checked={!!field.value}
		></span>
	</button>
	<!-- Beside the button, not inside it: a button may not contain interactive content. -->
	<FieldHiddenInputs {field} checked={!!field.value} value={inputValue} />
	{#snippet suffix()}
		{#if !labelPosition}
			<Slot
				as="label"
				attrs={{ id: field.labelId, for: field.id }}
				render={label}
				class={fieldClasses.label({ required: field.required, disabled: field.disabled })}
			/>
		{/if}
	{/snippet}
</Field>
