<script lang="ts" generics="T extends 'calendar' | 'calendar-range'">
	import { untrack } from 'svelte';
	import type { CalendarInputProps } from './calendarInput.props.js';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { FieldValue } from '../Field/field.js';
	import CalendarPrimitive from './CalendarPrimitive.svelte';
	import type { CalendarValue } from './useCalendar.svelte.js';

	let {
		defaultValue = null as CalendarInputProps<T>['value'],
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		type = 'calendar' as T,
		required = false,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		theme,
		disabledDates = [],
		view,
		weekStartsOnMonday,
		weekStartsOn,
		today,
		weekdayLength,
		locale,
		ariaLabel,
		minDate,
		maxDate,
		cell,
		buttons,
		header,
		todayBadge,
		onViewChange,
		...rest
	}: CalendarInputProps<T> = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	type CalendarFieldValue = FieldValue<T>;

	const field = createFieldState<T>({
		id,
		get value() {
			return value as CalendarFieldValue | null;
		},
		set value(nextValue: CalendarFieldValue | null | undefined) {
			value = nextValue as typeof value;
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
			onValueChange?.(v as unknown as CalendarValue<T>);
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
			return (type || 'calendar') as T;
		}
	});
</script>

<Field as="fieldset" {field} theme={theme?.field} {...rest}>
	<!-- display:contents wrapper: zero layout impact, catches bubbled focus so
	     bind:focused works like on the text inputs. -->
	<div
		class="contents"
		onfocusin={() => (field.focused = true)}
		onfocusout={(e) => {
			if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
				field.focused = false;
			}
		}}
	>
		<CalendarPrimitive
			onValueChange={(nextValue: CalendarValue<T>) => {
				field.value = nextValue as unknown as CalendarFieldValue;
			}}
			theme={theme?.calendar}
			value={field.value as unknown as CalendarValue<T>}
			type={type || 'calendar'}
			{disabledDates}
			{minDate}
			{maxDate}
			{view}
			{weekStartsOnMonday}
			{weekStartsOn}
			{today}
			{weekdayLength}
			{locale}
			{ariaLabel}
			disabled={field.disabled}
			{cell}
			{buttons}
			{header}
			{todayBadge}
			{onViewChange}
		/>
	</div>
</Field>
