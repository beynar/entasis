<script lang="ts">
	import { setPageShell } from './pageShell.state.svelte.js';

	// A page that brings its own tab bar, as a route would, and takes it away when it leaves.
	setPageShell({ subheader: pageTabs });
</script>

{#snippet pageTabs()}
	<nav data-testid="page-tabs" style="height: 36px">Page tabs</nav>
{/snippet}
