<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Collapsible from './Collapsible.svelte';
	import type { CollapsibleProps } from './collapsible.props.js';

	let props: CollapsibleProps = $props();
</script>

<Theme>
	{#snippet body()}
		<p id="closed-secret">Closed secret</p>
		<a href="#secret">Secret link</a>
		<input aria-label="Secret field" />
		<div style="height: 300px"></div>
		<a href="#far">Far link</a>
	{/snippet}
	{#snippet label()}
		Details
	{/snippet}
	<Collapsible {...props} trigger={label} children={body} />
</Theme>
