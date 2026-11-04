<script lang="ts">
	// A ContextMenu around a target, its props from the test.
	import ContextMenu from '$lib/components/ContextMenu/ContextMenu.svelte';
	import type { ContextMenuProps } from '$lib/components/ContextMenu/contextMenu.props.js';

	let props: Omit<ContextMenuProps, 'children'> = $props();
</script>

<ContextMenu {...props}>
	<div>Target</div>
</ContextMenu>
