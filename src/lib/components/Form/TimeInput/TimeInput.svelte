<script lang="ts">
	import Field from '../Field/Field.svelte';
	import Popover from '../../Popover/Popover.svelte';
	import TimeInputPicker from './TimeInputPicker.svelte';
	import TimeInputTrigger from './TimeInputTrigger.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TimeInputProps } from './timeInput.props.js';
	import { useTimeInputTheme } from './timeInput.theme.js';
	import {
		HOUR_IN_MILLISECONDS,
		MINUTE_IN_MILLISECONDS,
		createTimeOptions,
		denormalizeTimeValue,
		getActiveTimeOption,
		normalizeTimeValue
	} from './timeInputValue.js';
	import { Maskito } from '@maskito/core';
	import {
		maskitoTimeOptionsGenerator,
		type MaskitoTimeParams,
		maskitoStringifyTime,
		maskitoParseTime
	} from '@maskito/kit';
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		as = 'millisecondSinceMidnight',
		format = 'HH:MM',
		maxValues,
		minValues,
		placeholder = format,
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		visible,
		onValueChange,
		...rest
	}: TimeInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	let pickerOpen = $state(false);

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
		onValidate: (value) => {
			const string = maskitoStringifyTime(normalizeTimeValue(value, as), params);
			const parsed = maskitoParseTime(string, params);
			if (parsed === 0) {
				return true;
			}
			return onValidate?.(value) || false;
		},
		get visible() {
			return visible;
		},
		type: 'time'
	});

	const normalizedValue = $derived(
		value === null || value === undefined ? null : normalizeTimeValue(value, as)
	);

	const selectedHour = $derived(
		normalizedValue === null ? null : Math.floor(normalizedValue / HOUR_IN_MILLISECONDS)
	);

	const selectedMinute = $derived(
		normalizedValue === null
			? null
			: Math.floor((normalizedValue % HOUR_IN_MILLISECONDS) / MINUTE_IN_MILLISECONDS)
	);

	const classes = $derived(useTimeInputTheme(theme));

	const params = $derived({
		timeSegmentMaxValues: maxValues,
		timeSegmentMinValues: minValues,
		mode: format
	} satisfies MaskitoTimeParams);

	const hourOptions = $derived(createTimeOptions(minValues?.hours ?? 0, maxValues?.hours ?? 23));

	const minuteOptions = $derived(
		createTimeOptions(minValues?.minutes ?? 0, maxValues?.minutes ?? 59)
	);

	const setPickerValue = (hour: number, minute: number) => {
		const subMinuteMilliseconds = (normalizedValue ?? 0) % MINUTE_IN_MILLISECONDS;
		const nextMilliseconds =
			hour * HOUR_IN_MILLISECONDS + minute * MINUTE_IN_MILLISECONDS + subMinuteMilliseconds;
		const nextDisplayValue = maskitoStringifyTime(nextMilliseconds, params);
		const input = field.node instanceof HTMLInputElement ? field.node : null;

		if (!input) {
			const parsedValue = maskitoParseTime(nextDisplayValue, params);
			field.value = denormalizeTimeValue(parsedValue, as);
			return;
		}

		input.value = nextDisplayValue;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.focus();
	};

	const selectHour = (hour: number) => {
		setPickerValue(hour, getActiveTimeOption(minuteOptions, selectedMinute));
	};

	const selectMinute = (minute: number) => {
		setPickerValue(getActiveTimeOption(hourOptions, selectedHour), minute);
	};

	const maskAction = (input: HTMLInputElement) => {
		untrack(() => {
			const mask = maskitoTimeOptionsGenerator(params);
			const maskedElement = new Maskito(input, mask);

			if (value !== null && value !== undefined && typeof value === 'number') {
				input.value = maskitoStringifyTime(normalizeTimeValue(value, as), params);
			}
			const off = on(input, 'input', () => {
				const parsed = maskitoParseTime(input.value, params);
				field.value = denormalizeTimeValue(parsed, as);
			});

			return () => {
				maskedElement.destroy();
				off();
			};
		});
	};
</script>

<Popover
	id={`${id}-time-popover`}
	bind:open={pickerOpen}
	position="bottom-start"
	size="small"
	class={classes.popover({ class: theme?.popover?.base })}
>
	<TimeInputPicker
		id={`${id}-time-picker`}
		{hourOptions}
		{minuteOptions}
		{selectedHour}
		{selectedMinute}
		size={rest.size}
		{theme}
		onSelectHour={selectHour}
		onSelectMinute={selectMinute}
	/>
	{#snippet trigger(popover)}
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
			{@attach popover.reference}
		>
			<input
				data-1p-ignore
				inputmode="decimal"
				{id}
				name={field.name}
				bind:this={field.node}
				bind:focused={field.focused}
				{placeholder}
				class={classes.input({ disabled: field.disabled, size: rest.size })}
				disabled={field.disabled}
				{@attach maskAction}
			/>
			<TimeInputTrigger
				open={pickerOpen}
				disabled={field.disabled}
				controls={`${id}-time-picker`}
				size={rest.size}
				onToggle={popover.toggle}
			/>
		</Field>
	{/snippet}
</Popover>
