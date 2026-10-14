<script lang="ts">
	// Harness for `theme.platform.svelte.test.ts`: the app-shell shape where the portal container
	// is bound inside the Theme's own children and handed over as a function over `$state`.
	import Theme from './Theme.svelte';

	let host = $state<HTMLElement>();
</script>

<Theme portalContainer={() => host}>
	<div data-testid="host" bind:this={host}></div>
</Theme>
