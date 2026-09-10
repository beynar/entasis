<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="CRUD editor"
	description="Create and edit a domain record with validation, responsive navigation, and contextual actions."
	{source}
>
	<Block />
</BlockShowcase>
