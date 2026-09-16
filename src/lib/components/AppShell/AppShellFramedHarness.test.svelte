<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import AppShell from './AppShell.svelte';
	import type { SidebarVariant } from '../Sidebar/sidebar.props.js';

	let { variant = 'framed' }: { variant?: SidebarVariant } = $props();
</script>

<Theme>
	<AppShell
		{variant}
		title="Dashboard"
		sidebar={{
			items: [{ label: 'Workspace', items: [{ label: 'Inbox', href: '#inbox', icon: 'I' }] }]
		}}
	>
		<p>Page content</p>
	</AppShell>
</Theme>
