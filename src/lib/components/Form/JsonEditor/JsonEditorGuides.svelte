<script lang="ts">
	// The indentation of a row: one line per level above it. The lines run the row's full height, so
	// they stay unbroken past tall rows, descriptions and errors. A list's grip sits in the last slot,
	// on the line of the row that holds the list.
	import type { Snippet } from 'svelte';
	import { useJsonEditor } from './jsonEditor.state.svelte.js';

	let { depth, handle }: { depth: number; handle?: Snippet } = $props();

	const editor = useJsonEditor();
	const classes = $derived(editor.classes);
	const size = $derived(editor.size);
</script>

{#each { length: depth }, level}
	{@const last = level === depth - 1}
	<!-- The rows of a root list have nothing above them: their first slot only holds the grip. -->
	<span
		class={classes.guide({
			size,
			line: !(editor.rootIsList && level === 0),
			handle: last && Boolean(handle)
		})}
		aria-hidden={last && handle ? undefined : 'true'}
	>
		{#if last}{@render handle?.()}{/if}
	</span>
{/each}
