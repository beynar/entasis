<script lang="ts">
	import { untrack } from 'svelte';

	let { onPass }: { onPass: () => void } = $props();
	untrack(() => onPass());
</script>
