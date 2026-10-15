<script lang="ts">
	// A whole Sidebar in a contained frame, for the row-level behaviour: collapsible groups, inline
	// submenus and tree branches (disclosure panels), menus and flyouts placed toward the page
	// from either screen edge, in either reading direction.
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarDisplayState, SidebarGroup, SidebarSide } from './sidebar.props.js';

	let {
		items,
		side = 'left',
		displayState = 'expanded',
		dir = 'ltr'
	}: {
		items: SidebarGroup[];
		side?: SidebarSide;
		displayState?: SidebarDisplayState;
		dir?: 'ltr' | 'rtl';
	} = $props();
</script>

<Theme>
	<div {dir} style="position: relative; width: 1000px; height: 600px;">
		<Sidebar {items} {side} {displayState} collapsible="icon" frame="contained">
			<button type="button">Page start</button>
			<p>Page content</p>
		</Sidebar>
	</div>
	<button type="button">Outside</button>
</Theme>
