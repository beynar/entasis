<script lang="ts">
	import { setContext, type Snippet } from 'svelte';

	// Inputs inside are plain controls, not fields of the Form around: they do not register with
	// it, so they never count in its values, its validation, `dirty` or `reset`.
	let {
		children
	}: {
		/** Content whose inputs stay out of the surrounding Form. */
		children: Snippet;
	} = $props();

	setContext('form', null);
</script>

{@render children()}
