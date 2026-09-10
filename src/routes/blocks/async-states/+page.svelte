<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Loading, empty, and error"
	description="Switch between the loading, empty, and recoverable error states of a remote data workflow."
	{source}
>
	<Block />
</BlockShowcase>
