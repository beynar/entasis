<script lang="ts">
	import BlockShowcase from '../BlockShowcase.svelte';
	import Block from './Block.svelte';
	import source from './Block.svelte?raw';
</script>

<BlockShowcase
	title="Login and password recovery"
	description="A responsive account access workflow with sign-in, password recovery, and confirmation states."
	{source}
>
	<Block />
</BlockShowcase>
