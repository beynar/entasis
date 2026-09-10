<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Destructive confirmation"
	description="A guarded destructive action that makes scope and consequences explicit before the final confirmation."
	{source}
>
	<Block />
</BlockShowcase>
