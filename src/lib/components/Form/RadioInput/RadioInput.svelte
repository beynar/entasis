<script lang="ts" generics="Option extends RadioOption">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { RadioOption, RadioInputProps } from './radioInput.props.js';
	import { useRadioInputTheme } from './radioInput.theme.js';
	import Slot from '../../Slot/Slot.svelte';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		items,
		mode = 'normal',
		theme,
		disabled,
		name,
		onValidate,
		visible,
		label,
		onValueChange,
		fieldAttrs,
		size = 'normal',
		...rest
	}: RadioInputProps<Option> = $props();
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
		onValueChange: (v) => onValueChange?.(v),
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
		},
		get required() {
			return required;
		},
		get onValidate() {
			return onValidate;
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
		type: 'radio'
	});

	const componentTheme = $derived(useRadioInputTheme(theme));
</script>

<!-- Create own field wrapper (when used standalone) -->
<Field
	as="fieldset"
	fieldAttrs={{ ...fieldAttrs, role: 'radiogroup', 'aria-labelledby': field.labelId }}
	{field}
	{label}
	class={componentTheme.root({ mode })}
	{size}
	{...rest}
	theme={{
		...theme,
		inputContainer: {
			...theme?.inputContainer,
			base: componentTheme.radiosInputContainer({
				mode,
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
>
	{#each items as option (option.value)}
		{@const checked = field.value === option.value}
		{@const optionId = `${field.name}-${option.value}`}
		{@const optionDisabled = Boolean(field.disabled || option.disabled)}
		<button
			type="button"
			role="radio"
			data-color="primary"
			aria-checked={checked}
			disabled={optionDisabled}
			aria-label={option.label}
			class={componentTheme.radiosInputItem({ mode, checked, disabled: optionDisabled, size })}
			onclick={() => {
				if (optionDisabled) return;
				if (!field.value || field.value !== option.value) {
					field.value = option.value;
				}
			}}
		>
			<input
				hidden
				onchange={() => {
					if (optionDisabled) return;
					field.value = option.value;
				}}
				style="transform: scale(0); opacity: 0; pointer-events: none; margin: -1px; position: absolute;"
				type="radio"
				{checked}
				name={field.name}
				id={optionId}
				value={option.value}
				disabled={optionDisabled}
			/>

			<!-- Radio Button Track -->
			<div
				class={componentTheme.radiosInputItemTrack({
					mode,
					checked,
					disabled: optionDisabled,
					size
				})}
			></div>

			<!-- Radio Button Thumb -->
			<div
				class={componentTheme.radiosInputItemThumb({
					checked,
					mode,
					disabled: optionDisabled,
					size
				})}
			></div>

			<!-- Label Content -->
			<div class={componentTheme.radiosInputItemLabel({ size })}>
				{#if option.icon}
					<Slot render={option.icon} class={componentTheme.radiosInputItemIcon()} />
				{/if}
				<Slot render={option.label} />
			</div>

			<!-- Description -->
			<Slot
				render={option.description}
				class={componentTheme.radiosInputItemDescription({ mode, checked })}
			/>
		</button>
	{/each}
</Field>
