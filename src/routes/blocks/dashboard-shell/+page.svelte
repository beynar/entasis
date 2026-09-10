<script lang="ts">
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
	import BlockShowcase from '../BlockShowcase.svelte';
</script>

<BlockShowcase
	title="Dashboard shell"
	description="A responsive application shell with workspace navigation, key metrics, recent activity, and focused follow-up actions."
	{source}
>
	<Block />
</BlockShowcase>
