<script lang="ts">
	import type { Snippet } from 'svelte';

	let { icon }: { icon: Snippet<[{ size?: number | string }]> } = $props();
</script>

{@render icon({ size: 40 })}
