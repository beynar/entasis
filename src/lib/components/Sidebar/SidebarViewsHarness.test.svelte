<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarView } from './sidebar.props.js';

	let {
		views,
		view = $bindable(),
		onViewChange
	}: {
		views: Record<string, SidebarView>;
		view?: string;
		onViewChange?: (view: string) => void;
	} = $props();
</script>

<Theme>
	<Sidebar
		mode="panel"
		{views}
		bind:view
		{onViewChange}
		headerButton={{ icon: 'A', title: 'Acme' }}
		footerButton={{ icon: 'U', title: 'Account' }}
	/>
</Theme>
