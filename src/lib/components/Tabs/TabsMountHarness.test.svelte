<script lang="ts">
	import Tabs from './Tabs.svelte';
	import type { StepperMount } from '../Stepper/stepper.props.js';

	let {
		items,
		value = $bindable(),
		mount
	}: { items: string[]; value?: string; mount?: StepperMount } = $props();
</script>

<Tabs {items} bind:value {mount}>
	{#snippet children({ item })}
		<div>Panel {item}</div>
	{/snippet}
</Tabs>
