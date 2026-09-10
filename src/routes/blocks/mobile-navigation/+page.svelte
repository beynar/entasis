<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Mobile navigation"
	description="A responsive application surface with compact navigation, focused content, and a clear primary action."
	{source}
>
	<Block />
</BlockShowcase>
