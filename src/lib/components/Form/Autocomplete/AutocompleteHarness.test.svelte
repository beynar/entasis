<script lang="ts">
	// Harness for the Autocomplete tests: the control inside <Theme> (overlay context) and a
	// native <form>, with the bound value and open state printed for assertions.
	import { untrack } from 'svelte';
	import Theme from '../../Theme/Theme.svelte';
	import Autocomplete from './Autocomplete.svelte';
	import type { AutocompleteProps } from './autocomplete.props.js';
	import type { ComboboxOption } from '../Combobox/combobox.props.js';

	let {
		defaultValue,
		externalValue,
		customItem = false,
		...props
	}: {
		externalValue?: string;
		/** Renders every row through an `item` snippet. */
		customItem?: boolean;
		defaultValue?: string | null;
	} & Omit<Partial<AutocompleteProps>, 'defaultValue' | 'value'> = $props();

	let value = $state<string | null>(untrack(() => defaultValue) ?? null);
	let open = $state<boolean | undefined>(untrack(() => props.open));
	let submitted = $state('');
</script>

{#snippet rowItem(option: ComboboxOption)}
	<span data-testid="custom-row">{option.label.toUpperCase()}</span>
{/snippet}

<Theme>
	<form
		data-testid="form"
		onsubmit={(event) => {
			event.preventDefault();
			submitted = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
		}}
	>
		<button type="button">Before</button>
		<Autocomplete
			label="Fruit"
			{...props as AutocompleteProps}
			item={customItem ? rowItem : undefined}
			bind:value
			bind:open
		/>
		<button type="button">After</button>
		<button type="reset">Reset</button>
		<button type="button" onclick={() => (value = externalValue ?? null)}>External change</button>
	</form>
	<output data-testid="value">{JSON.stringify(value)}</output>
	<output data-testid="submitted">{submitted}</output>
	<output data-testid="open">{String(open)}</output>
</Theme>
