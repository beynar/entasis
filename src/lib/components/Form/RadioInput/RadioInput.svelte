<script lang="ts" generics="Option extends RadioOption, Value extends string = Option['value']">
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { RadioOption, RadioInputProps } from './radioInput.props.js';
	import { useRadioInputTheme } from './radioInput.theme.js';
	import Slot from '../../Slot/Slot.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { continueFormFromChoice } from '../CheckboxesInput/choiceEnter.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';

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
		readOnly,
		messages,
		name,
		onValidate,
		visible,
		label,
		onValueChange,
		fieldAttrs,
		size = 'normal',
		...rest
	}: RadioInputProps<Option, Value> = $props();
	if (value === undefined) value = untrack(() => defaultValue) as Value | null;

	const id = $props.id();

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v as Value | null;
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
		onValueChange: (v) => onValueChange?.(v as Value | null),
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

	// Option ids come from field.id, unique per instance, and the index, always a valid id
	// token: name + value collides across instances that share a name and breaks on spaces.
	const optionId = (index: number) => `${field.id}-option-${index}`;
	const isOptionDisabled = (option: RadioOption) => Boolean(field.disabled || option.disabled);

	const checkedIndex = $derived(items.findIndex((option) => option.value === field.value));
	const firstEnabledIndex = $derived(items.findIndex((option) => !isOptionDisabled(option)));
	// The one Tab stop: the checked option, else the first one that can take focus.
	const tabStopIndex = $derived(
		checkedIndex >= 0 && !isOptionDisabled(items[checkedIndex]) ? checkedIndex : firstEnabledIndex
	);

	const select = (index: number) => {
		const option = items[index];
		if (!option || isOptionDisabled(option)) return;
		field.value = option.value;
	};

	const navigation = useNavigation({
		id,
		orientation: 'both',
		loop: true,
		focusableContainer: false,
		enableHoverFocus: false,
		// Enter belongs to the form (see continueFormFromChoice); Space selects.
		enterActivates: false,
		// Escape must reach the Dialog, Popover or Ask the group sits in; the arrows, Home, End and
		// Space are still cancelled by the navigation itself.
		preventKeyboardDefault: false,
		enabled: () => !field.disabled,
		defaultFocusedIndex: () => (tabStopIndex >= 0 ? tabStopIndex : null),
		// Selection follows the keyboard, but only a deliberate key move (an arrow, Home or End)
		// selects: tabbing in, a programmatic focus or a click never changes the value, and Alt,
		// Ctrl or Meta with an arrow is left to the browser. A read-only group moves focus only.
		onKeyboardMove: (index) => select(index)
	});

	// What a native <form> submits: a disabled selected option is left out, as a disabled native
	// radio is, while the field's own value keeps it.
	const submittedValue = $derived(
		checkedIndex >= 0 && !isOptionDisabled(items[checkedIndex]) ? items[checkedIndex].value : null
	);
</script>

<!-- Create own field wrapper (when used standalone) -->
<Field
	as="fieldset"
	fieldAttrs={{
		...fieldAttrs,
		role: 'radiogroup',
		'aria-labelledby': label ? field.labelId : undefined
	}}
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
	{@attach navigation.containerReference}
>
	{#each items as option, index (option.value)}
		{@const checked = checkedIndex === index}
		{@const optionDisabled = isOptionDisabled(option)}
		{@const itemId = optionId(index)}
		<button
			id={itemId}
			type="button"
			role="radio"
			aria-checked={checked}
			aria-labelledby={option.label ? `${itemId}-label` : undefined}
			aria-label={option.label ? undefined : option.value}
			aria-describedby={option.description ? `${itemId}-description` : undefined}
			disabled={optionDisabled}
			tabindex={navigation.focusedIndex === index ||
			(navigation.focusedIndex === null && tabStopIndex === index)
				? 0
				: -1}
			data-readonly={field.readOnly ? '' : undefined}
			class={componentTheme.radiosInputItem({
				mode,
				checked,
				disabled: optionDisabled,
				size,
				readOnly: field.readOnly
			})}
			onclick={() => {
				select(index);
				navigation.focusItem(index);
			}}
			onkeydown={(event) => continueFormFromChoice(event, field)}
			{@attach navigation.itemReference}
		>
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
			<div id="{itemId}-label" class={componentTheme.radiosInputItemLabel({ size })}>
				{#if option.icon}
					<Slot render={option.icon} class={componentTheme.radiosInputItemIcon()} />
				{/if}
				<Slot render={option.label} />
			</div>

			<!-- Description -->
			<Slot
				render={option.description}
				attrs={{ id: `${itemId}-description` }}
				class={componentTheme.radiosInputItemDescription({ mode, checked })}
			/>
		</button>
	{/each}
	<!-- Beside the options (a button may not contain inputs). A required group blocks a native
	     submit while nothing is selected. -->
	<FieldHiddenInputs {field} value={submittedValue} required={field.required && !field.value} />
</Field>
