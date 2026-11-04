<script lang="ts">
	// Two PopupMenus, their props from the test.
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import type { PopupMenuProps } from '$lib/components/PopupMenu/popupMenu.props.js';

	let { first, second }: { first: PopupMenuProps; second: PopupMenuProps } = $props();
</script>

<PopupMenu {...first} />
<PopupMenu {...second} />
