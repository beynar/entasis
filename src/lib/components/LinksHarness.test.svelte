<script lang="ts">
	// Test-only: any component that draws a link, inside a Theme.
	import type { Component } from 'svelte';
	import Theme from './Theme/Theme.svelte';

	let {
		component: Drawn,
		props
	}: { component: Component<Record<string, unknown>>; props: Record<string, unknown> } = $props();
</script>

<Theme><Drawn {...props} /></Theme>
