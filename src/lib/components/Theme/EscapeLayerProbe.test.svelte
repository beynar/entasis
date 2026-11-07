<script lang="ts">
	// Test-only: what an app's own layer reads, as its Escape listener runs before entasis's.
	import { useHasOpenLayer } from './theme.state.svelte.js';

	let { onEscape }: { onEscape: (open: boolean) => void } = $props();
	const hasOpenLayer = useHasOpenLayer();
</script>

<svelte:window
	onkeydowncapture={(event) => {
		if (event.key === 'Escape') onEscape(hasOpenLayer());
	}}
/>
<output data-testid="layer-open">{hasOpenLayer() ? 'open' : 'none'}</output>
