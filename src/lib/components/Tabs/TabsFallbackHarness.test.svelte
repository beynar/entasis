<script lang="ts">
	import Tabs from './Tabs.svelte';
	import Tabbar from '../Tabbar/Tabbar.svelte';
	import type { TabItem } from '../Tabbar/tabbar.props.js';
	import type { TabsApi, TabsValueChangePayload } from './tabs.props.js';

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
		onValueChange?: (payload: TabsValueChangePayload) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);
	let api = $state<TabsApi>();
</script>

<button onclick={() => (value = externalValue)}>Set external value</button>
<button onclick={() => api?.goTo(0)}>Api go to 0</button>
<button onclick={() => api?.next()}>Api next</button>
<button onclick={() => api?.previous()}>Api previous</button>
<div data-testid="tabs">
	<Tabs {items} bind:value bind:api {defaultValue} {onValueChange}>
		{#snippet children({ index, api })}
			<p>Panel {index}</p>
			{#each items.keys() as target (target)}
				<button onclick={() => api.goTo(target)}>Go to {target}</button>
			{/each}
		{/snippet}
	</Tabs>
</div>
{#if mirrorItems}
	<div data-testid="mirror">
		<Tabbar items={mirrorItems} bind:value />
	</div>
{/if}
<output>{value ?? ''}</output>
