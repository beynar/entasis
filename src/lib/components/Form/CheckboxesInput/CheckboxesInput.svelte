<script lang="ts" generics="Option extends CheckboxOption, Value extends string = Option['value']">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { CheckboxOption, CheckboxesInputProps } from './checkboxesInput.props.js';
	import { useCheckboxesInputTheme } from './checkboxesInput.theme.js';
	import CheckboxLine from './CheckboxLine.svelte';
	import { continueFormFromChoice } from './choiceEnter.js';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		defaultValue = [] as Value[],
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		items,
		mode = 'normal',
		theme,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		visible,
		onValueChange,
		label,
		size = 'normal',
		selectAll = false,
		selectAllLabel,
		...rest
	}: CheckboxesInputProps<Option, Value> = $props();
	if (value === undefined) value = untrack(() => defaultValue) as Value[];

	const id = $props.id();

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v as Value[];
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
		onValueChange: (v) => onValueChange?.((v ?? []) as Value[]),
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
		onValidate: (value) => {
			if (required) {
				if (value.length === 0) {
					return true;
				}
			}
			return onValidate?.(value) || false;
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
		type: 'checkboxes'
	});

	const componentTheme = $derived(useCheckboxesInputTheme(theme));
	const t = $derived(useI18n());

	// Option ids come from field.id, unique per instance, and the index, always a valid id
	// token: name + value collides across instances that share a name and breaks on spaces.
	const optionId = (index: number) => `${field.id}-option-${index}`;
	const isOptionDisabled = (option: CheckboxOption) => Boolean(field.disabled || option.disabled);
	type Item = Option & CheckboxOption<Value>;
	const selectedValues = $derived(field.value ?? []);

	const setOption = (option: Item, checked: boolean) => {
		if (isOptionDisabled(option)) return;
		const current = field.value ?? [];
		if (current.includes(option.value) === checked) return;
		field.value = checked
			? [...current, option.value]
			: current.filter((entry) => entry !== option.value);
	};

	// What a native <form> submits. A disabled option is left out, as a disabled native checkbox
	// is, while the field's own value keeps it (a disabled but selected option stays selected).
	const submittedValues = $derived(
		items
			.filter((option) => selectedValues.includes(option.value) && !isOptionDisabled(option))
			.map((option) => option.value)
	);

	// Select all: the parent row acts on the enabled options only; disabled ones keep their state.
	const enabledOptions = $derived(items.filter((option) => !isOptionDisabled(option)));
	const enabledSelectedCount = $derived(
		enabledOptions.filter((option) => selectedValues.includes(option.value)).length
	);
	const allSelected = $derived(
		enabledOptions.length > 0 && enabledSelectedCount === enabledOptions.length
	);
	const someSelected = $derived(enabledSelectedCount > 0 && !allSelected);

	// The selection the user had when the row first took it to "all", so the cycle can give it back.
	// `produced` is the value the row left behind: any other edit since ends the cycle.
	let cycle: { snapshot: string[]; produced: string } | null = null;
	const keyOf = (values: readonly string[]) => JSON.stringify([...values].sort());

	const cycleSelectAll = () => {
		if (field.disabled || enabledOptions.length === 0) return;
		const current = field.value ?? [];
		if (cycle && keyOf(current) !== cycle.produced) cycle = null;
		const enabled = new Set<string>(enabledOptions.map((option) => option.value));
		const kept = (option: Item) => !enabled.has(option.value) && current.includes(option.value);
		const build = (include: (option: Item) => boolean) =>
			items.filter((option) => kept(option) || (enabled.has(option.value) && include(option)));
		let next: Item[];
		if (someSelected) {
			next = build(() => true);
			cycle = { snapshot: current.filter((value) => enabled.has(value)), produced: '' };
		} else if (allSelected) {
			next = build(() => false);
		} else if (cycle) {
			const snapshot = cycle.snapshot;
			next = build((option) => snapshot.includes(option.value));
			cycle = null;
		} else {
			next = build(() => true);
		}
		const nextValue = next.map((option) => option.value);
		if (cycle) cycle.produced = keyOf(nextValue);
		field.value = nextValue;
	};
</script>

<!-- Create own field wrapper (when used standalone) -->
<Field
	as="fieldset"
	{field}
	{label}
	class={componentTheme.root({ mode })}
	{size}
	theme={{
		...theme,
		inputContainer: {
			...theme?.inputContainer,
			base: componentTheme.checkboxesInputContainer({
				mode,
				class: theme?.inputContainer?.base,
				disabled: field.disabled
			})
		}
	}}
	{...rest}
>
	{#if selectAll}
		<CheckboxLine
			id={`${field.id}-select-all`}
			checked={allSelected}
			indeterminate={someSelected}
			disabled={field.disabled || enabledOptions.length === 0}
			readOnly={field.readOnly}
			{mode}
			{size}
			label={selectAllLabel ?? t.selectAll}
			classes={componentTheme}
			controls={items.map((_, index) => optionId(index)).join(' ')}
			onCheckedChange={cycleSelectAll}
			onEnter={(event) => continueFormFromChoice(event, field)}
		/>
	{/if}
	{#each items as option, index (option.value)}
		<CheckboxLine
			id={optionId(index)}
			checked={selectedValues.includes(option.value)}
			disabled={isOptionDisabled(option)}
			readOnly={field.readOnly}
			{mode}
			{size}
			label={option.label}
			description={option.description}
			classes={componentTheme}
			onCheckedChange={(checked) => setOption(option, checked)}
			onEnter={(event) => continueFormFromChoice(event, field)}
		/>
	{/each}
	<!-- One input per submitted value, beside the options (a button may not contain inputs). A
	     required group blocks a native submit while its value is empty. -->
	<FieldHiddenInputs
		{field}
		value={submittedValues}
		required={field.required && selectedValues.length === 0}
	/>
</Field>
