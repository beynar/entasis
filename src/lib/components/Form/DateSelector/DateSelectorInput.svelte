<script lang="ts" generics="Mode extends DateSelectorInputMode">
	import { untrack } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { FieldValue } from '../Field/field.js';
	import DateSelector from './DateSelector.svelte';
	import type {
		DateSelectorInputMode,
		DateSelectorInputProps,
		DateSelectorValue
	} from './dateSelector.props.js';

	type FieldType = Mode extends 'date' ? 'date' : 'calendar-range';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		defaultOpen = false,
		open = $bindable(),
		onOpenChange,
		mode = 'date' as Mode,
		required = false,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		theme,
		closeOnSelect,
		presets,
		trigger,
		position,
		offset,
		mobileSheet,
		view,
		weekStartsOnMonday,
		weekdayLength,
		locale,
		minDate,
		maxDate,
		disabledDates,
		calendarLabel,
		id: selectorId,
		calendarTheme,
		size,
		...rest
	}: DateSelectorInputProps<Mode> = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const openState = createBindableValue(
		() => open,
		(nextOpen) => {
			open = nextOpen;
		},
		() => defaultOpen
	);

	const id = $props.id();

	const field = createFieldState<FieldType>({
		id,
		get value() {
			return value as unknown as FieldValue<FieldType> | null;
		},
		set value(nextValue) {
			value = nextValue as typeof value;
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
		set focused(v: boolean) {
			focused = v;
		},
		onValueChange: (nextValue) => {
			onValueChange?.(nextValue as Parameters<NonNullable<typeof onValueChange>>[0]);
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
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		get type() {
			return (mode === 'date' ? 'date' : 'calendar-range') as FieldType;
		}
	});

	// The selector panel is portaled, so focus moving into it looks like a focus
	// loss from here. Treat "popover open" as focused alongside real focus-within.
	let focusWithin = $state(false);
	$effect(() => {
		field.focused = focusWithin || openState.value;
	});
</script>

<Field as="fieldset" {field} {size} theme={theme?.field} {...rest}>
	<!-- display:contents wrapper: zero layout impact, catches bubbled focus on the trigger. -->
	<div
		class="contents"
		onfocusin={() => (focusWithin = true)}
		onfocusout={(e) => {
			if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
				focusWithin = false;
			}
		}}
	>
		<DateSelector
			{mode}
			value={field.value as unknown as DateSelectorValue<Mode>}
			onValueChange={(nextValue: DateSelectorValue<Mode>) => {
				field.value = nextValue as unknown as FieldValue<FieldType>;
			}}
			bind:open={openState.value}
			{onOpenChange}
			{closeOnSelect}
			{presets}
			{trigger}
			{position}
			{offset}
			{mobileSheet}
			{view}
			{weekStartsOnMonday}
			{weekdayLength}
			{locale}
			{minDate}
			{maxDate}
			{disabledDates}
			{calendarLabel}
			id={selectorId}
			disabled={field.disabled}
			theme={theme?.selector}
			{calendarTheme}
		/>
	</div>
</Field>
