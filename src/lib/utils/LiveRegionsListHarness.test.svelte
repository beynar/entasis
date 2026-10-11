<script lang="ts">
	import { useLiveRegions } from './useLiveAnnouncer.svelte.js';

	let { items = [] }: { items?: string[] } = $props();

	const live = useLiveRegions('results', 'live', { settleDelay: 0, clearAfter: 0 });

	export const announce = (message: string) => live.announce(message);
</script>

<!-- The each block is the host's only child, so Svelte empties the host when the list empties. -->
<ul data-testid="host" {@attach live.host}>
	{#each items as item (item)}
		<li>{item}</li>
	{/each}
</ul>
