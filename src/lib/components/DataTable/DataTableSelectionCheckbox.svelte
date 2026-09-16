<script lang="ts">
	import Checkbox from '../Form/Checkbox/Checkbox.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';

	let {
		value,
		indeterminate = false,
		disabled = false,
		label,
		onValueChange,
		classes
	}: {
		value: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		label: string;
		onValueChange: (checked: boolean) => void;
		classes: DataTableClasses;
	} = $props();

	const theme = $derived({
		root: { base: classes.selectionCheckboxRoot() },
		checkboxesInputContainer: { base: classes.selectionCheckboxContainer() },
		checkboxesInputItem: { base: classes.selectionCheckboxControl() },
		checkboxesInputItemTrack: { base: classes.selectionCheckboxIndicator() },
		checkboxesInputItemThumb: { base: classes.selectionCheckboxIndicator() }
	});
</script>

<Checkbox
	mode="control"
	{label}
	{value}
	{indeterminate}
	{disabled}
	onValueChange={(checked) => onValueChange(checked ?? false)}
	{theme}
/>
