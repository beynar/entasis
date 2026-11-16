<script lang="ts">
	// Test-only: a calendar inline, or a DateSelector, picking weeks, months or years.
	import { setI18n } from '$lib/i18n/context.svelte.js';
	import { ar } from '$lib/i18n/ar.js';
	import Theme from '../../Theme/Theme.svelte';
	import DateSelector from '../DateSelector/DateSelector.svelte';
	import CalendarPrimitive from './CalendarPrimitive.svelte';
	import type { CalendarGranularity } from './calendar.periods.js';
	import type { CalendarType } from './useCalendar.svelte.js';

	type Mode = 'date' | 'range' | 'multiple';
	let {
		component = 'calendar',
		granularity,
		mode = 'date',
		value,
		today = new Date(2026, 2, 18, 12),
		weekStartsOnMonday = true,
		minDate,
		maxDate,
		disabledDates,
		dir = 'ltr',
		arabic = false,
		onValueChange
	}: {
		component?: 'calendar' | 'selector';
		granularity: CalendarGranularity;
		mode?: Mode;
		value?: unknown;
		today?: Date;
		weekStartsOnMonday?: boolean;
		minDate?: Date;
		maxDate?: Date;
		disabledDates?: (Date | [Date, Date])[];
		dir?: 'ltr' | 'rtl';
		arabic?: boolean;
		onValueChange?: (value: unknown) => void;
	} = $props();
	// svelte-ignore state_referenced_locally
	if (arabic) setI18n(ar);

	const types: Record<Mode, CalendarType> = {
		date: 'calendar',
		range: 'calendar-range',
		multiple: 'calendar-multiple'
	};
	// svelte-ignore state_referenced_locally
	let current = $state<unknown>(value ?? (mode === 'multiple' ? [] : null));
	const change = (next: unknown) => {
		current = next;
		onValueChange?.(next);
	};
</script>

<Theme>
	<div {dir} data-testid="calendar-host" style="width: 22rem">
		{#if component === 'calendar'}
			<CalendarPrimitive
				type={types[mode]}
				{granularity}
				value={current as null}
				{today}
				{weekStartsOnMonday}
				{minDate}
				{maxDate}
				{disabledDates}
				locale={arabic ? 'ar' : 'en-US'}
				onValueChange={change}
			/>
		{:else}
			<DateSelector
				mode={mode as 'date'}
				{granularity}
				value={current as Date | null}
				{weekStartsOnMonday}
				{minDate}
				{maxDate}
				{disabledDates}
				locale="en-US"
				onValueChange={change}
			/>
		{/if}
	</div>
</Theme>
