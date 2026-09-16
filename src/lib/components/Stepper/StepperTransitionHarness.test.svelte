<script lang="ts">
	import Stepper from './Stepper.svelte';
	import type { StepperMount } from './stepper.props.js';

	let {
		items,
		value = $bindable(),
		mount
	}: {
		items: string[];
		value?: number;
		mount?: StepperMount;
	} = $props();
</script>

<Stepper {items} bind:value {mount}>
	{#snippet children({ item })}
		<div>Panel {item}</div>
	{/snippet}
</Stepper>
