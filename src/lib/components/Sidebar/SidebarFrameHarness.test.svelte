<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarActivityBar, SidebarDisplayState, SidebarVariant } from './sidebar.props.js';

	let {
		variant,
		displayState,
		withActivityBar
	}: { variant: SidebarVariant; displayState: SidebarDisplayState; withActivityBar: boolean } =
		$props();

	const activityBar: SidebarActivityBar = { items: [{ label: 'Home', icon: 'H' }] };
</script>

<Theme>
	<Sidebar
		{variant}
		{displayState}
		collapsible="offcanvas"
		frame="contained"
		activityBar={withActivityBar ? activityBar : undefined}
		items={[{ items: [{ label: 'Inbox', icon: 'I', href: '#inbox' }] }]}
	>
		<p>page</p>
	</Sidebar>
</Theme>
