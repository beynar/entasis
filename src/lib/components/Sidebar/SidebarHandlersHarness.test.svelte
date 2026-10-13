<script lang="ts">
	// Harness for `sidebar-handlers.svelte.test.ts`: an activity bar whose item handler may
	// call `event.preventDefault()`.
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarActivityBar } from './sidebar.props.js';

	let {
		onItemClick,
		onSelect
	}: {
		onItemClick?: (event: MouseEvent) => void;
		onSelect?: (label: string) => void;
	} = $props();

	const activityBar: SidebarActivityBar = {
		label: 'Workspaces',
		items: [
			{ label: 'Files', icon: 'F', onclick: (event) => onItemClick?.(event) },
			{ label: 'Search', icon: 'S' }
		],
		onSelect: ({ item }) => onSelect?.(item.label)
	};
</script>

<Theme>
	<Sidebar items={[]} defaultOpen={false} frame="contained" {activityBar}>
		<p>Page content</p>
	</Sidebar>
</Theme>
