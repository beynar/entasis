<script lang="ts" module>
	export type HarnessItem = {
		id: string;
		label: string;
		/** `native` sets `disabled`, `aria` sets `aria-disabled="true"`, `data` sets `data-disabled`. */
		disabled?: 'native' | 'aria' | 'data';
		/** Text the type-ahead matches instead of the label. */
		textValue?: string;
		/** `input` renders a text field as the item (a search field in a toolbar). */
		kind?: 'button' | 'input';
		value?: string;
	};
</script>

<script lang="ts">
	// Harness for `useNavigation.svelte.test.ts`: a bare list driven by useNavigation, keyed by item
	// id so tests can insert, remove and reorder items around the focused one.
	import { useNavigation } from './useNavigation.svelte.js';

	type Options = NonNullable<Parameters<typeof useNavigation>[0]>;

	let {
		items,
		options = {},
		header,
		dir = 'ltr',
		onActivate,
		onReady
	}: {
		items: HarnessItem[];
		options?: Options;
		/** Content inside the list that is no item, before the items. */
		header?: 'input' | 'button';
		dir?: 'ltr' | 'rtl';
		onActivate?: (id: string) => void;
		onReady?: (navigation: ReturnType<typeof useNavigation>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const navigation = useNavigation(options);
	// svelte-ignore state_referenced_locally
	onReady?.(navigation);
</script>

<button type="button">Before</button>
<div
	role="toolbar"
	aria-label="List"
	data-testid="list"
	{dir}
	{@attach navigation.containerReference}
>
	{#if header === 'input'}
		<input aria-label="Filter" />
	{:else if header === 'button'}
		<button type="button">Header action</button>
	{/if}
	{#each items as item (item.id)}
		{#if item.kind === 'input'}
			<input
				aria-label={item.label}
				value={item.value ?? ''}
				data-typeahead={item.textValue}
				{@attach navigation.itemReference}
			/>
		{:else}
			<button
				type="button"
				disabled={item.disabled === 'native' || undefined}
				aria-disabled={item.disabled === 'aria' || undefined}
				data-disabled={item.disabled === 'data' || undefined}
				data-typeahead={item.textValue}
				onclick={() => onActivate?.(item.id)}
				{@attach navigation.itemReference}>{item.label}</button
			>
		{/if}
	{/each}
</div>
<button type="button">After</button>
