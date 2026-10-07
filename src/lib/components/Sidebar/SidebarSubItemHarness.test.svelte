<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import type { SidebarApi, SidebarMenuSubEntry } from './sidebar.props.js';
	import SidebarMenuSubItem from './SidebarMenuSubItem.svelte';

	// A sub row on its own, for the states a full Sidebar never reaches (submenus do not render
	// while the panel is collapsed to icons).
	let { sub, iconCollapsed = false }: { sub: SidebarMenuSubEntry; iconCollapsed?: boolean } =
		$props();
	const api = { isMobile: false } as SidebarApi;
</script>

<Theme>
	<ul>
		<SidebarMenuSubItem
			{sub}
			{api}
			{iconCollapsed}
			size="normal"
			activeVariant="soft"
			density="normal"
		/>
	</ul>
</Theme>
