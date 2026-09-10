<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Command palette"
	description="A searchable, keyboard-first overlay for navigation and application actions."
	{source}
>
	<Block />
</BlockShowcase>
