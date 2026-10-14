<script lang="ts">
	// A tree root on its own in a Sidebar collapsed to icons: the state a full Sidebar reaches only
	// after a collapse, with the api reduced to what the node reads.
	import Theme from '../Theme/Theme.svelte';
	import type { SidebarApi, SidebarTreeNode } from './sidebar.props.js';
	import SidebarTreeNodeRow from './SidebarTreeNode.svelte';

	let { node, side = 'left' }: { node: SidebarTreeNode; side?: 'left' | 'right' } = $props();
	const api = $derived({
		displayState: 'collapsed',
		isMobile: false,
		isPeeking: false,
		side
	} as SidebarApi);
</script>

<Theme>
	<ul>
		<SidebarTreeNodeRow
			{node}
			{api}
			tooltips="auto"
			size="normal"
			activeVariant="soft"
			density="normal"
		/>
	</ul>
	<p>Elsewhere</p>
</Theme>
