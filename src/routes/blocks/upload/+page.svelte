<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Upload flow"
	description="A responsive file upload workflow with selection, progress, completion, and rejection feedback."
	{source}
>
	<Block />
</BlockShowcase>
