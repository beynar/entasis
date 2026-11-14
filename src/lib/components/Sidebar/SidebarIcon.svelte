<script lang="ts">
	import Slot from '$lib/components/Slot/Slot.svelte';
	// Aliased: the declaration emitted for this component declares `SidebarIcon`, and an
	// import of the same name would conflict with it in a consumer that type-checks the package.
	import type { SidebarIcon as SidebarIconSource } from './sidebar.props.js';

	let { icon, class: className }: { icon?: SidebarIconSource; class?: string } = $props();
</script>

{#if typeof icon === 'string'}
	<span class={className}>{icon}</span>
{:else if icon}
	<Slot render={icon} class={className} />
{/if}
