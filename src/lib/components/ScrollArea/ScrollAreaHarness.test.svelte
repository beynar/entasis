<script lang="ts">
	// Harness for `scrollArea.svelte.test.ts`: a ScrollArea with plain text content.
	import ScrollArea from './ScrollArea.svelte';
	import type { ScrollAreaProps } from './scrollArea.props.js';

	let props: Omit<ScrollAreaProps, 'children'> = $props();
</script>

<ScrollArea class="h-10" {...props}>
	<p>Long article</p>
</ScrollArea>
