<script lang="ts">
	import { usePopoverContext } from '../Popover/popover.state.svelte.js';
	import MenuFloating from './MenuFloating.svelte';
	import MenuStacked from './MenuStacked.svelte';
	import type { MenuProps } from './menu.props.js';

	let { submenuMode = 'auto', search = $bindable(), ...menuProps }: MenuProps = $props();

	const parentPopover = usePopoverContext();
	const resolvedSubmenuMode = $derived(
		submenuMode === 'auto' ? (parentPopover?.isMobileSheet ? 'stack' : 'popover') : submenuMode
	);
</script>

{#if resolvedSubmenuMode === 'stack'}
	<MenuStacked {...menuProps} bind:search />
{:else}
	<MenuFloating {...menuProps} bind:search />
{/if}
