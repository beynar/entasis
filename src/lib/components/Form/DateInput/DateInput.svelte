<script lang="ts">
	import { untrack } from 'svelte';
	import { Maskito } from '@maskito/core';
	import { maskitoDateOptionsGenerator } from '@maskito/kit';
	import DateSelector from '../DateSelector/DateSelector.svelte';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import { calendarBlankIcon } from '../../Icons/calendarBlank.js';
	import type { PopoverState } from '../../Popover/popover.state.svelte.js';
	import type { DateInputProps } from './dateInput.props.js';
	import { useDateInputTheme } from './dateInput.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		format = 'dd/mm/yyyy',
		placeholder = format,
		locale,
		separator,
		presets = [],
		disabledDates = [],
		minDate,
		maxDate,
		calendarView = 'single',
		mobileSheet = false,
		closeOnSelect = false,
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		onSelect,
		visible,
		type = 'date',
		...rest
	}: DateInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const dateSeparator = $derived(separator || '/');
	let isCalendarOpen = $state(false);

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
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		get type() {
			return type;
		}
	});

	const classes = $derived(useDateInputTheme(theme));

	const formatDate = (date: Date | null) => {
		if (!date) return '';
		const segments = {
			dd: String(date.getDate()).padStart(2, '0'),
			mm: String(date.getMonth() + 1).padStart(2, '0'),
			yy: String(date.getFullYear()).slice(-2),
			yyyy: String(date.getFullYear())
		};

		return format
			.split('/')
			.map((part) => segments[part as keyof typeof segments])
			.join(dateSeparator);
	};

	const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	const extractDate = (inputValue: string) => {
		const buildRegex = (mask: string) => {
			const parts = mask.split('/');
			const regexParts = parts.map((part) => {
				switch (part) {
					case 'dd':
					case 'mm':
						return '(\\d{2})';
					case 'yyyy':
						return '(\\d{4})';
					case 'yy':
						return '(\\d{2})';
					default:
						return '\\' + part;
				}
			});
			return new RegExp('^' + regexParts.join(escapeRegex(dateSeparator)) + '$');
		};
		const match = inputValue.match(buildRegex(format));

		if (!match) return null;

		const parts = format.split('/');
		let year: string | undefined;
		let month: string | undefined;
		let day: string | undefined;
		parts.forEach((part, index) => {
			const segmentValue = match[index + 1];
			switch (part) {
				case 'dd':
					day = segmentValue;
					break;
				case 'mm':
					month = segmentValue;
					break;
				case 'yyyy':
					year = segmentValue;
					break;
				case 'yy':
					year = '20' + segmentValue;
					break;
			}
		});

		year = year || new Date().getFullYear().toString();
		month = month || '01';
		day = day || '01';

		const yearNumber = Number(year);
		const monthNumber = Number(month);
		const dayNumber = Number(day);
		const date = new Date(yearNumber, monthNumber - 1, dayNumber);

		if (
			date.getFullYear() !== yearNumber ||
			date.getMonth() !== monthNumber - 1 ||
			date.getDate() !== dayNumber
		) {
			return null;
		}

		return date;
	};

	const syncInputValue = (date: Date | null) => {
		if (field.node instanceof HTMLInputElement) {
			field.node.value = formatDate(date);
		}
	};

	const maskAction = (input: HTMLInputElement) => {
		const mask = maskitoDateOptionsGenerator({ mode: format, separator: dateSeparator });
		const maskedElement = new Maskito(input, mask);

		if (value) {
			input.value = formatDate(value);
		}
		return () => {
			maskedElement.destroy();
		};
	};

	const handleInput = (e: Event) => {
		const currentValue = (e.currentTarget as HTMLInputElement).value;
		if (!currentValue) {
			field.value = null;
			return;
		}

		const date = extractDate(currentValue);
		if (date) {
			field.value = date;
		}
	};

	const handleCalendarChange = (date: Date | null) => {
		field.value = date;
		onSelect?.(date);
		field.focused = false;
		syncInputValue(date);
	};

	$effect(() => {
		if (!field.focused) {
			syncInputValue(value ?? null);
		}
	});
</script>

<DateSelector
	id={`${id}-calendar-popover`}
	bind:open={isCalendarOpen}
	position="bottom-start"
	mode="date"
	value={field.value}
	{presets}
	{disabledDates}
	{minDate}
	{maxDate}
	view={calendarView}
	{mobileSheet}
	{closeOnSelect}
	{locale}
	disabled={field.disabled}
	calendarLabel={`${t.choose} ${t.date}`}
	onValueChange={handleCalendarChange}
	class={classes.popover({ class: theme?.popover?.base })}
>
	{#snippet trigger(popover: PopoverState)}
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
				type="text"
				inputmode="decimal"
				{id}
				name={field.name}
				bind:this={field.node}
				{placeholder}
				disabled={field.disabled}
				class={classes.input({ disabled: field.disabled, size: rest.size })}
				{@attach maskAction}
				oninput={handleInput}
				onfocus={() => {
					field.focused = true;
				}}
				onclick={() => {
					if (!field.disabled) isCalendarOpen = true;
				}}
				onkeydown={(event) => {
					// Keyboard users open the calendar deliberately; tabbing through never pops it.
					if ((event.key === 'ArrowDown' || event.altKey) && !field.disabled && !isCalendarOpen) {
						if (event.key === 'ArrowDown') {
							event.preventDefault();
							isCalendarOpen = true;
						}
					}
				}}
				onblur={() => {
					field.focused = false;
				}}
			/>
			<FieldActionButton
				active={isCalendarOpen}
				size={rest.size}
				label={`${t.choose} ${t.date}`}
				haspopup="dialog"
				expanded={isCalendarOpen}
				controls={isCalendarOpen ? `${id}-calendar-popover` : undefined}
				disabled={field.disabled}
				prefix={calendarBlankIcon}
				onclick={() => {
					if (!field.disabled) {
						popover.toggle();
					}
				}}
			/>
		</Field>
	{/snippet}
</DateSelector>
