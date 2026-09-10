<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Combobox from './Combobox/Combobox.svelte';
	import Select from './Select/Select.svelte';
	import DateSelector from './DateSelector/DateSelector.svelte';
	import type { ComboboxProps } from './Combobox/combobox.props.js';
	import type { SelectProps } from './Select/select.props.js';
	import type { DateSelectorProps } from './DateSelector/dateSelector.props.js';

	let {
		combobox,
		select,
		dateSelector
	}: {
		combobox?: ComboboxProps;
		select?: SelectProps;
		dateSelector?: DateSelectorProps;
	} = $props();
</script>

<Theme>
	{#if combobox}
		<Combobox {...combobox} />
	{:else if select}
		<Select {...select} />
	{:else if dateSelector}
		<DateSelector {...dateSelector} />
	{/if}
</Theme>
