<script lang="ts">
	// Harness for the styling-hook, RTL and drag tests: a ScrollArea with a list that can grow, an
	// optional `dir` wrapper, and a field to hold focus while the scrollbars are pressed.
	import ScrollArea from './ScrollArea.svelte';
	import type { ScrollAreaProps } from './scrollArea.props.js';

	let {
		dir,
		items = 3,
		wide = false,
		...props
	}: Omit<ScrollAreaProps, 'children'> & {
		dir?: 'ltr' | 'rtl';
		items?: number;
		/** A 800px-wide list, so the area overflows horizontally. */
		wide?: boolean;
	} = $props();
</script>

{#snippet area()}
	<input aria-label="Field" />
	<ScrollArea class="h-10" {...props}>
		<div data-testid="list" style:width={wide ? '800px' : undefined}>
			{#each Array.from({ length: items }, (_, index) => index) as index (index)}
				<p>Row {index}</p>
			{/each}
		</div>
	</ScrollArea>
{/snippet}

<div {dir}>
	{@render area()}
</div>
