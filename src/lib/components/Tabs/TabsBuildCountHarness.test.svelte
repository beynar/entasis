<script lang="ts">
	import { untrack } from 'svelte';
	import Tabs from './Tabs.svelte';

	// Mirrors the docs "Manual activation" card: a panel attachment bumps a reactive counter.
	// The bump is untracked because `+=` reads the counter and would otherwise loop.
	let { items }: { items: string[] } = $props();
	let built = $state(0);
	const countBuild = () => {
		untrack(() => (built += 1));
	};
</script>

<Tabs {items} tabbar={{ activateOnFocus: false }}>
	{#snippet children({ item })}
		<section {@attach countBuild}>Panel {item}</section>
	{/snippet}
</Tabs>
<output data-testid="built">{built}</output>
