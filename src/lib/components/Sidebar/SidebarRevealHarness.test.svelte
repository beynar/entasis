<script lang="ts">
	// A hidden offcanvas sidebar beside an activity bar, in a sized contained frame, so an edge
	// reveal slides a full-height panel past the bar.
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarActivityBar, SidebarVariant } from './sidebar.props.js';

	let { variant }: { variant: SidebarVariant } = $props();

	const activityBar: SidebarActivityBar = {
		items: [
			{ label: 'Home', icon: 'H', isActive: true },
			{ label: 'Search', icon: 'S' }
		]
	};
</script>

<Theme>
	<div style="position: relative; width: 900px; height: 500px;">
		<Sidebar
			{variant}
			displayState="hidden"
			collapsible="offcanvas"
			frame="contained"
			{activityBar}
			items={[
				{
					label: 'Pages',
					items: [
						{ label: 'Inbox', icon: 'I', href: '#inbox' },
						{ label: 'Projects', icon: 'P', href: '#projects' },
						{ label: 'Archive', icon: 'A', href: '#archive' }
					]
				}
			]}
		>
			<p>page</p>
		</Sidebar>
	</div>
</Theme>
