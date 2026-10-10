<script lang="ts">
	import Tabbar from './Tabbar.svelte';
	import type { TabItem } from './tabbar.props.js';

	let {
		items,
		initialValue,
		onValueChange
	}: {
		items: TabItem[];
		initialValue?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);
</script>

<Tabbar {items} bind:value {onValueChange} />
<output>{value ?? ''}</output>
