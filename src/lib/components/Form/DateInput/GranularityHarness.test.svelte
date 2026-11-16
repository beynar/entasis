<script lang="ts">
	// Test-only: a DateInput typing a week, a month or a year.
	import Theme from '../../Theme/Theme.svelte';
	import DateInput from './DateInput.svelte';

	let {
		granularity,
		value = null,
		locale = 'en-US',
		timeZone,
		weekStartsOnMonday,
		onValueChange
	}: {
		granularity: 'day' | 'week' | 'month' | 'year';
		value?: Date | null;
		locale?: string;
		timeZone?: string;
		weekStartsOnMonday?: boolean;
		onValueChange?: (value: Date | null) => void;
	} = $props();
</script>

<Theme>
	<DateInput
		label="Period"
		{granularity}
		{value}
		{locale}
		{timeZone}
		{weekStartsOnMonday}
		{onValueChange}
	/>
	<button type="button">Elsewhere</button>
</Theme>
