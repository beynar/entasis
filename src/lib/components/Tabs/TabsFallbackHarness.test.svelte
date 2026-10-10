<script lang="ts">
	import Tabs from './Tabs.svelte';
	import type { TabItem } from '../Tabbar/tabbar.props.js';
	import type { TabsValueChangePayload } from './tabs.props.js';

	let {
		items,
		initialValue,
		defaultValue,
		externalValue,
		onValueChange
	}: {
		items: TabItem[];
		initialValue?: string;
		defaultValue?: string;
		externalValue?: string;
		onValueChange?: (payload: TabsValueChangePayload) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);
</script>

<button onclick={() => (value = externalValue)}>Set external value</button>
<Tabs {items} bind:value {defaultValue} {onValueChange}>
	{#snippet children({ index, api })}
		<p>Panel {index}</p>
		{#each items.keys() as target (target)}
			<button onclick={() => api.goTo(target)}>Go to {target}</button>
		{/each}
	{/snippet}
</Tabs>
<output>{value ?? ''}</output>
