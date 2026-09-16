<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarCollapsible, SidebarGroup, SidebarResizable } from './sidebar.props.js';

	let {
		collapsible = 'offcanvas',
		resizable = true,
		rail = false
	}: {
		collapsible?: SidebarCollapsible;
		resizable?: SidebarResizable;
		rail?: boolean;
	} = $props();

	const items: SidebarGroup[] = [
		{ label: 'Workspace', items: [{ label: 'Inbox', href: '#inbox', icon: 'I' }] }
	];
</script>

<Theme>
	<Sidebar {items} {collapsible} {resizable} {rail} defaultOpen frame="contained">
		<p>Page content</p>
	</Sidebar>
</Theme>
