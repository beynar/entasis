<script lang="ts">
	import type { Snippet } from 'svelte';

	// An icon that points along the reading direction (the submenu caret, the back arrow) and so
	// flips in right-to-left text. `rtl:` follows the `dir` the menu panel carries.
	let { icon }: { icon: Snippet } = $props();
</script>

<span class="inline-flex rtl:-scale-x-100">{@render icon()}</span>
