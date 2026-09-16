<script lang="ts" generics="Option extends TagGroupOption">
	import Chip from '../../Chip/Chip.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TagGroupOption, TagGroupProps, TagGroupValue } from './tagGroup.props.js';
	import { useTagGroupTheme } from './tagGroup.theme.js';
	import { useDefaultColor } from '../../Theme/theme.state.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		items,
		multiple = false,
		color,
		unselectedColor = 'neutral',
		selectedVariant = 'soft',
		unselectedVariant = 'outline',
		size = 'normal',
		theme,
		chipTheme,
		disabled,
		name,
		label,
		onValidate,
		onValueChange,
		visible,
		fieldAttrs,
		class: className,
		...rest
	}: TagGroupProps<Option> = $props();
	const valueState = createBindableValue<TagGroupValue>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const id = $props.id();
	const resolvedColor = $derived(useDefaultColor(color));

	const toValues = (nextValue: TagGroupValue | undefined) => {
		const values = Array.isArray(nextValue) ? nextValue : nextValue ? [nextValue] : [];
		return [...new Set(values.filter(Boolean))];
	};

	const normalizeValue = (nextValue: TagGroupValue | undefined): TagGroupValue => {
		const values = toValues(nextValue);
		return multiple ? values : (values[0] ?? null);
	};

	const normalizedValue = $derived(normalizeValue(valueState.value));
	const selectedValues = $derived(toValues(normalizedValue));
	const classes = $derived(useTagGroupTheme(theme));

	const field = createFieldState({
		id,
		get value() {
			return normalizedValue;
		},
		set value(nextValue) {
			valueState.value = normalizeValue(nextValue);
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors: string[] | boolean) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused: boolean) {
			focused = nextFocused;
		},
		onValueChange: (nextValue) => {
			onValueChange?.(normalizeValue(nextValue));
		},
		get disabled() {
			return disabled;
		},
		set disabled(nextDisabled: boolean | undefined) {
			disabled = nextDisabled;
		},
		get required() {
			return required;
		},
		onValidate: (nextValue) => onValidate?.(normalizeValue(nextValue)) || false,
		get name() {
			return name;
		},
		set name(nextName: string | undefined) {
			name = nextName;
		},
		get visible() {
			return visible;
		},
		type: 'tag-group'
	});

	const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

	const setSelected = (option: Option) => {
		if (field.disabled || option.disabled) return;
		const selected = isSelected(option.value);
		if (multiple) {
			field.value = selected
				? selectedValues.filter((selectedValue) => selectedValue !== option.value)
				: [...selectedValues, option.value];
		} else {
			field.value = selected ? null : option.value;
		}
	};

	const handleFocusOut = (event: FocusEvent) => {
		const currentTarget = event.currentTarget as HTMLElement;
		const nextTarget = event.relatedTarget;
		if (!(nextTarget instanceof Node) || !currentTarget.contains(nextTarget)) {
			field.focused = false;
		}
	};
</script>

<Field
	fieldAttrs={{
		...fieldAttrs
	}}
	as="fieldset"
	{field}
	{label}
	class={classes.root({ className })}
	theme={{
		...theme,
		inputContainer: {
			...theme?.inputContainer,
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
	{...rest}
>
	<div
		id={`${field.id}-group`}
		role="group"
		aria-disabled={field.disabled}
		class={classes.list({ size })}
		onfocusin={() => (field.focused = true)}
		onfocusout={handleFocusOut}
	>
		{#if multiple}
			{#each selectedValues as selectedValue (selectedValue)}
				<input type="hidden" name={field.name} value={selectedValue} disabled={field.disabled} />
			{/each}
		{:else if selectedValues[0]}
			<input type="hidden" name={field.name} value={selectedValues[0]} disabled={field.disabled} />
		{/if}

		{#each items as option (option.value)}
			{@const selected = isSelected(option.value)}
			{@const itemDisabled = field.disabled || option.disabled}
			<Chip
				{size}
				type="button"
				color={option.color ?? (selected ? resolvedColor : unselectedColor)}
				variant={option.variant ?? (selected ? selectedVariant : unselectedVariant)}
				prefix={option.icon}
				theme={chipTheme}
				{selected}
				class={classes.item({ className: classes.chip() })}
				disabled={itemDisabled}
				onclick={() => setSelected(option)}
			>
				{option.label ?? option.value}
			</Chip>
		{/each}
	</div>
</Field>
