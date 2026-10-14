<script lang="ts">
	// Harness for the Select tests: a Select inside <Theme> (overlay context) and a native <form>,
	// with the bound value and open state printed for assertions, a button that changes the value
	// from outside, and an optional external <label for>.
	import { untrack } from 'svelte';
	import Theme from '../../Theme/Theme.svelte';
	import Select from './Select.svelte';
	import type { SelectProps } from './select.props.js';

	let {
		defaultValue,
		open: openProp,
		externalLabelFor,
		externalValue,
		...props
	}: {
		/** Renders `<label for>` pointing at this id before the Select. */
		externalLabelFor?: string;
		/** The value the "External change" button writes. */
		externalValue?: string | string[] | null;
	} & Omit<SelectProps<boolean>, 'value' | 'defaultValue' | 'open'> & {
			defaultValue?: string | readonly string[] | null;
			open?: boolean;
		} = $props();

	// One bound value for both kinds of Select: a string or null, or a list.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let value = $state<any>(
		untrack(() => defaultValue) ?? (untrack(() => props.multiple) ? [] : null)
	);
	let open = $state<boolean | undefined>(untrack(() => openProp));
</script>

<Theme>
	<form data-testid="form">
		{#if externalLabelFor}
			<label for={externalLabelFor}>External label</label>
		{/if}
		<Select {...props} bind:value bind:open />
		<button type="button" onclick={() => (value = externalValue ?? null)}>External change</button>
		<button type="button" onclick={() => (open = true)}>External open</button>
		<button type="reset">Reset</button>
	</form>
	<output data-testid="value">{JSON.stringify(value)}</output>
	<output data-testid="open">{String(open)}</output>
</Theme>
