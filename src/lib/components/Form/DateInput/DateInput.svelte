<script lang="ts">
	import { untrack } from 'svelte';
	import { boundDefault } from '$lib/utils/state.svelte.js';
	import { focusIntoPopup } from '../Field/focusIntoPopup.js';
	import { Maskito } from '@maskito/core';
	import { maskitoDateOptionsGenerator, maskitoDateTime } from '@maskito/kit';
	import DateSelector from '../DateSelector/DateSelector.svelte';
	import Field from '../Field/Field.svelte';
	import { resolveControlId } from '../Field/field.aria.js';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import { calendarBlankIcon } from '../../Icons/calendarBlank.js';
	import type { PopoverApi } from '../../Popover/popover.api.js';
	import type { DateInputProps } from './dateInput.props.js';
	import { useDateInputTheme } from './dateInput.theme.js';
	import { useI18n, useI18nLocale } from '$lib/i18n/context.svelte.js';
	import { getPeriodStart, getWeekNumber } from '../Calendar/calendar.periods.js';
	import {
		defaultGranularityFormat,
		formatDateValue,
		fromPickedDay,
		fromZonedParts,
		parseDateValue,
		splitFormat,
		toLocalWallClock,
		zonedParts,
		type DateFormat
	} from './dateInput.format.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		format: formatProp,
		placeholder: placeholderProp,
		timeZone,
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
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		onSelect,
		visible,
		type = 'date',
		granularity = 'day',
		weekStartsOnMonday = true,
		id: idProp,
		...rest
	}: DateInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => boundDefault(defaultValue));

	const generatedId = $props.id();
	const id = untrack(() => resolveControlId(idProp, undefined, generatedId));
	const dateSeparator = $derived(separator || '/');
	const resolvedLocale = $derived(locale ?? useI18nLocale());
	const weekStartsOn = $derived(weekStartsOnMonday ? 1 : 0);
	// `datetime` edits the day and the hour unless a format or a coarser granularity says otherwise.
	const format = $derived<DateFormat>(
		formatProp ??
			(granularity !== 'day'
				? defaultGranularityFormat(granularity, resolvedLocale)
				: type === 'datetime'
					? 'dd/mm/yyyy HH:MM'
					: 'dd/mm/yyyy')
	);
	const placeholder = $derived(placeholderProp ?? format);
	const mask = $derived(splitFormat(format));
	// A date-only edit of a datetime keeps the hour it had; a week, month or year has none.
	const keepsTime = $derived(type === 'datetime' && granularity === 'day');
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
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
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

	/** Midnight (in `timeZone`) of the first day of the period holding `date`. */
	const toPeriodStart = (date: Date) => {
		if (granularity === 'day') return date;
		const parts = zonedParts(date, timeZone);
		const start = getPeriodStart(
			new Date(parts.year, parts.month - 1, parts.day, 12),
			granularity,
			weekStartsOn
		);
		return fromZonedParts(
			{
				year: start.getFullYear(),
				month: start.getMonth() + 1,
				day: start.getDate(),
				hour: 0,
				minute: 0
			},
			timeZone
		);
	};

	const formatDate = (date: Date | null) =>
		formatDateValue(date ? toPeriodStart(date) : null, format, dateSeparator, timeZone);

	// The ISO week number shown beside a week's first day.
	const weekBadge = $derived.by(() => {
		if (granularity !== 'week' || !(value instanceof Date)) return '';
		const local = toLocalWallClock(value, timeZone)!;
		return t.calendarWeekShort(getWeekNumber(local, weekStartsOn).week);
	});

	const extractDate = (inputValue: string) =>
		parseDateValue(
			inputValue,
			format,
			dateSeparator,
			timeZone,
			keepsTime ? (field.value as Date | null) : null
		);

	const syncInputValue = (date: Date | null) => {
		if (field.node instanceof HTMLInputElement) {
			field.node.value = formatDate(date);
		}
	};

	const maskAction = (input: HTMLInputElement) => {
		const options = mask.time
			? maskitoDateTime({
					dateMode: mask.date as 'dd/mm/yyyy',
					timeMode: 'HH:MM',
					// Explicitly off: left undefined, Maskito's arrow-key stepping still runs, with no
					// step, and ArrowDown (which opens the calendar) wrote NaN minutes into the text.
					timeStep: 0,
					dateSeparator,
					dateTimeSeparator: ' '
				})
			: maskitoDateOptionsGenerator({ mode: mask.date, separator: dateSeparator });
		const maskedElement = new Maskito(input, options);

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
			field.value = toPeriodStart(date);
		}
	};

	const handleCalendarChange = (picked: Date | null) => {
		const date = picked
			? toPeriodStart(
					fromPickedDay(picked, keepsTime ? (field.value as Date | null) : null, timeZone)
				)
			: null;
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
	focusOnClose={() => field.node ?? true}
	position="bottom-start"
	mode="date"
	{granularity}
	{weekStartsOnMonday}
	value={toLocalWallClock(field.value as Date | null, timeZone)}
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
	{#snippet trigger(popover: PopoverApi)}
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
			anchor={popover.reference}
		>
			<input
				data-1p-ignore
				{...field.ariaAttrs({ role: 'textbox', native: 'text' })}
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
					// ArrowDown opens it and moves focus onto the selected day (the calendar button
					// is out of the Tab order, so this is the keyboard's way in).
					if (event.key !== 'ArrowDown' || event.defaultPrevented || field.disabled) return;
					event.preventDefault();
					isCalendarOpen = true;
					focusIntoPopup(
						() => document.getElementById(`${id}-calendar-popover`),
						'[data-date][tabindex="0"]'
					);
				}}
				onblur={() => {
					field.focused = false;
				}}
			/>
			{#if weekBadge}
				<span class={classes.period({ size: rest.size })} data-week-number>{weekBadge}</span>
			{/if}
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
