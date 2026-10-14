<script lang="ts">
	// Harness for the Combobox and TagsInput tests: the control inside <Theme> (overlay context)
	// and a native <form>, with the bound value and search text printed for assertions.
	import { untrack } from 'svelte';
	import Theme from '../../Theme/Theme.svelte';
	import I18n from '$lib/i18n/I18n.svelte';
	import Combobox from './Combobox.svelte';
	import TagsInput from '../TagsInput/TagsInput.svelte';
	import type { ComboboxOption, ComboboxProps } from './combobox.props.js';
	import type { TagsInputProps } from '../TagsInput/tagsInput.props.js';

	let {
		kind = 'combobox',
		externalValue,
		customItem = false,
		rtl = false,
		defaultValue,
		...props
	}: {
		kind?: 'combobox' | 'tags';
		externalValue?: string;
		/** Renders every row through an `item` snippet. */
		customItem?: boolean;
		/** Right-to-left text direction for the control. */
		rtl?: boolean;
		defaultValue?: string | string[] | null;
	} & Omit<Partial<ComboboxProps> & Partial<TagsInputProps>, 'defaultValue' | 'value'> = $props();

	let comboboxValue = $state<string | null>(
		(untrack(() => defaultValue) as string | null | undefined) ?? null
	);
	let tagsValue = $state<string[] | null>(
		(untrack(() => defaultValue) as string[] | null | undefined) ?? null
	);
	let searchValue = $state('');
	let loading = $state(false);
	let open = $state<boolean | undefined>(untrack(() => props.open));
</script>

{#snippet rowItem(option: ComboboxOption)}
	<span data-testid="custom-row">{option.label.toUpperCase()}</span>
{/snippet}

{#snippet content()}
	<form data-testid="form">
		<button type="button">Before</button>
		{#if kind === 'combobox'}
			<Combobox
				label="Fruit"
				{...props as ComboboxProps}
				item={customItem ? rowItem : undefined}
				bind:value={comboboxValue}
				bind:searchValue
				bind:loading
				bind:open
			/>
		{:else}
			<TagsInput
				label="Fruit"
				{...props as TagsInputProps}
				item={customItem ? rowItem : undefined}
				bind:value={tagsValue}
				bind:searchValue
				bind:loading
				bind:open
			/>
		{/if}
		<button type="button">After</button>
		<button type="reset">Reset</button>
		<button type="button" onclick={() => (comboboxValue = externalValue ?? null)}>
			External change
		</button>
	</form>
{/snippet}

<Theme>
	{#if rtl}
		<I18n dir="rtl" manageDocument={false}>{@render content()}</I18n>
	{:else}
		{@render content()}
	{/if}
	<output data-testid="value"
		>{JSON.stringify(kind === 'combobox' ? comboboxValue : tagsValue)}</output
	>
	<output data-testid="search">{searchValue}</output>
	<output data-testid="loading">{String(loading)}</output>
	<output data-testid="open">{String(open)}</output>
</Theme>
