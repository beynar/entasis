<script lang="ts">
	import Tabs from './Tabs.svelte';
	import type { TabsPlacement } from './tabs.props.js';

	let {
		items,
		value = $bindable(),
		activateOnFocus,
		placement,
		onMounted
	}: {
		items: string[];
		value?: string;
		activateOnFocus?: boolean;
		placement?: TabsPlacement;
		/** Called with the item each time its panel content is created. */
		onMounted?: (item: string) => void;
	} = $props();
</script>

<button onclick={() => (value = items[items.length - 1])}>Jump to last</button>
<button onclick={() => (value = items[0])}>Jump to first</button>
<Tabs {items} bind:value {placement} tabbar={{ activateOnFocus }}>
	{#snippet children({ item })}
		{@const mounted = () => onMounted?.(item)}
		<div {@attach () => mounted()}>Panel {item}</div>
	{/snippet}
</Tabs>
<output>{value ?? ''}</output>
