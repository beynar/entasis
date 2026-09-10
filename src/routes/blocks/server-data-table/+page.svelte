<script lang="ts">
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
	import BlockShowcase from '../BlockShowcase.svelte';
</script>

<BlockShowcase
	title="Server data table"
	description="A searchable, sortable, paginated customer table with manual server processing, explicit loading feedback, and contextual row actions."
	{source}
>
	<Block />
</BlockShowcase>
