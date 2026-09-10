<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Settings"
	description="Grouped account, notification, and appearance preferences with validation and save actions."
	{source}
>
	<Block />
</BlockShowcase>
