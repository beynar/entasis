<script lang="ts">
	// Harness for `useListNavigation.browser.test.ts`: an inline list in a scrolling page, driven
	// from a search input, with sequence ids for the options.
	import { useListNavigation } from './useListNavigation.svelte.js';

	let { onReady }: { onReady?: (nav: ReturnType<typeof useListNavigation<string>>) => void } =
		$props();

	const all = Array.from({ length: 60 }, (_, i) => `Item ${i}`);
	let query = $state('');
	const values = $derived(all.filter((value) => value.toLowerCase().includes(query.toLowerCase())));
	let list: HTMLElement | undefined = $state();

	const nav = useListNavigation<string>({
		values: () => values,
		idPrefix: 'hn',
		query: () => query,
		scrollContainer: () => list,
		anchor: () => 'Item 40'
	});
	// svelte-ignore state_referenced_locally
	onReady?.(nav);
</script>

<div data-testid="page" style="height: 300px; overflow: auto;">
	<div style="height: 200px;">Above the list</div>
	<input
		data-testid="search"
		role="combobox"
		aria-expanded="true"
		aria-controls="hn-list"
		aria-activedescendant={nav.activeDescendant}
		bind:value={query}
		onkeydown={nav.onKeydown}
	/>
	<div
		id="hn-list"
		role="listbox"
		data-testid="list"
		bind:this={list}
		style="height: 120px; overflow-y: auto;"
	>
		{#each values as value (value)}
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				role="option"
				id={nav.optionId(value)}
				aria-selected={nav.highlighted === value}
				style="height: 24px;"
				onpointermove={(event) => nav.pointerHighlight(value, event)}
			>
				{value}
			</div>
		{/each}
	</div>
	<div style="height: 600px;">Below the list</div>
</div>
