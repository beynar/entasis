<script lang="ts" module>
	// One native validation pass fires `invalid` on every rejected control at once. Like the
	// browser, only the first rejected switch of a form takes focus.
	const reportingForms = new WeakSet<HTMLFormElement>();
</script>

<script lang="ts">
	import { untrack } from 'svelte';
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

	// The hidden input is never rendered, so the browser cannot point at it when a native form
	// rejects a required switch that is off: keep that report on the visible switch instead.
	const oninvalid = (event: Event & { currentTarget: HTMLInputElement }) => {
		event.preventDefault();
		field.validate();
		const form = event.currentTarget.form;
		if (form) {
			if (reportingForms.has(form)) return;
			reportingForms.add(form);
			queueMicrotask(() => reportingForms.delete(form));
		}
		field.node?.focus();
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
	<input
		onchange={onclick}
		{oninvalid}
		name={field.name}
		id={'input-' + field.id}
		value={inputValue}
		checked={!!field.value}
		required={field.required}
		hidden
		disabled={field.disabled}
		type="checkbox"
	/>
	<div
		bind:this={field.node}
		id={field.id}
		data-checked={!!value}
		aria-checked={!!value}
		aria-labelledby={label ? field.labelId : undefined}
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
			<Slot as="span" attrs={{ id: field.labelId }} render={label} class={fieldClasses.label()} />
		{/if}
	{/snippet}
</Field>
