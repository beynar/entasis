<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import SidebarMobileDrawer from './SidebarMobileDrawer.svelte';

	let { close }: { close: () => void } = $props();
</script>

<Theme>
	<SidebarMobileDrawer
		open
		{close}
		side="left"
		widthMobile="18rem"
		size="normal"
		density="normal"
		label="Navigation"
	>
		{#snippet rail()}
			<a href="#section">Section</a>
		{/snippet}
		<a href="#page">Page</a>
		<a href="#new-tab" target="_blank">New tab</a>
		<a href="#routed" onclick={(event) => event.preventDefault()}>Routed</a>
		<button type="button">Expand</button>
	</SidebarMobileDrawer>
</Theme>
