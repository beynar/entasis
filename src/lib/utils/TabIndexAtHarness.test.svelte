<script lang="ts">
	// Harness for `useNavigation.tabStop.svelte.test.ts`: items that spread `tabIndexAt` with a
	// prop the test changes, so the template renders the tabindex again with nothing else moving.
	import { useNavigation } from './useNavigation.svelte.js';

	let { tone = 'a' }: { tone?: string } = $props();
	const labels = ['A', 'B', 'C'];
	const navigation = useNavigation({
		defaultFocusedIndex: () => 1,
		renderedItems: () => ({ count: labels.length })
	});
</script>

<div role="toolbar" aria-label="Tools" {@attach navigation.containerReference}>
	{#each labels as label, index (label)}
		<button
			type="button"
			{...{ class: tone, tabindex: navigation.tabIndexAt(index) }}
			{@attach navigation.itemReference}>{label}</button
		>
	{/each}
</div>
