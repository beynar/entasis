<script lang="ts">
	import Tabbar from './Tabbar.svelte';
	import type { TabItem } from './tabbar.props.js';

	let {
		items,
		initialValue,
		defaultValue,
		externalValue,
		mirrorItems,
		onValueChange
	}: {
		items: TabItem[];
		initialValue?: string;
		defaultValue?: string;
		externalValue?: string;
		/** Renders a second tab list bound to the same value, as a responsive layout would. */
		mirrorItems?: TabItem[];
		onValueChange?: (value: string) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);
</script>

<button onclick={() => (value = externalValue)}>Set external value</button>
<div data-testid="tabbar">
	<Tabbar {items} bind:value {defaultValue} {onValueChange} />
</div>
{#if mirrorItems}
	<div data-testid="mirror">
		<Tabbar items={mirrorItems} bind:value />
	</div>
{/if}
<output>{value ?? ''}</output>
