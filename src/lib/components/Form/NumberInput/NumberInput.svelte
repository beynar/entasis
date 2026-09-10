<script lang="ts">
	import { untrack } from 'svelte';
	import { minusIcon } from '../../Icons/minus.js';
	import { plusIcon } from '../../Icons/plus.js';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { NumberInputProps } from './numberInput.props.js';
	import { useNumberInputTheme } from './numberInput.theme.js';

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
		min,
		max,
		step,
		increment,
		showControls = true,
		...rest
	}: NumberInputProps = $props();
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
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		onValidate: (val) => {
			if (typeof val === 'number') {
				if (min !== undefined && val < min) {
					return true;
				}
				if (max !== undefined && val > max) {
					return true;
				}
			}
			return onValidate?.(val) || false;
		},
		get visible() {
			return visible;
		},
		type: 'number'
	});

	const classes = $derived(useNumberInputTheme(theme));

	const configuredIncrement = $derived(increment ?? step ?? 1);
	const buttonIncrement = $derived(
		Number.isFinite(configuredIncrement) && configuredIncrement !== 0
			? Math.abs(configuredIncrement)
			: 1
	);
	const numericValue = $derived(
		typeof field.value === 'number' && Number.isFinite(field.value) ? field.value : null
	);
	const canDecrement = $derived(
		!field.disabled && (numericValue === null || min === undefined || numericValue > min)
	);
	const canIncrement = $derived(
		!field.disabled && (numericValue === null || max === undefined || numericValue < max)
	);

	const countDecimalPlaces = (value: number) => {
		const valueText = String(value);
		if (valueText.includes('e-')) {
			return Number(valueText.split('e-')[1]) || 0;
		}
		return valueText.split('.')[1]?.length ?? 0;
	};

	const clampValue = (nextValue: number) => {
		if (min !== undefined && nextValue < min) return min;
		if (max !== undefined && nextValue > max) return max;
		return nextValue;
	};

	const roundToIncrementPrecision = (baseValue: number, nextValue: number) => {
		const precision = Math.min(
			Math.max(countDecimalPlaces(buttonIncrement), countDecimalPlaces(baseValue)),
			12
		);
		return Number(nextValue.toFixed(precision));
	};

	const getEmptyBaseValue = (direction: 1 | -1) => {
		if (direction > 0 && min !== undefined) return min - buttonIncrement;
		if (direction < 0 && max !== undefined) return max + buttonIncrement;
		return 0;
	};

	const changeValue = (direction: 1 | -1) => {
		if (field.disabled) return;

		const baseValue = numericValue ?? getEmptyBaseValue(direction);
		field.value = clampValue(
			roundToIncrementPrecision(baseValue, baseValue + direction * buttonIncrement)
		);
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
		type="number"
		{id}
		name={field.name}
		bind:value={field.value}
		bind:this={field.node}
		{placeholder}
		{min}
		{max}
		{step}
		disabled={field.disabled}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
	/>
	{#if showControls}
		<div class="flex shrink-0 items-stretch gap-0.5 self-stretch">
			<FieldActionButton
				size={rest.size}
				edge="none"
				label="Decrease value"
				disabled={!canDecrement}
				prefix={minusIcon}
				onclick={() => changeValue(-1)}
			/>
			<FieldActionButton
				size={rest.size}
				label="Increase value"
				disabled={!canIncrement}
				prefix={plusIcon}
				onclick={() => changeValue(1)}
			/>
		</div>
	{/if}
</Field>
