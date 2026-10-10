<script lang="ts">
	// PopupMenus a consumer nests inside another menu, which are not submenus: one in the outer
	// menu's header, one in the outer menu's trigger. Each is the root of its own menu tree.
	import PopupMenu from './PopupMenu.svelte';

	let {
		placement,
		outerCloseOnItemClick = true,
		onInnerItem,
		onInnerOpenChange
	}: {
		placement: 'header' | 'trigger';
		outerCloseOnItemClick?: boolean;
		onInnerItem?: () => void;
		onInnerOpenChange?: (open: boolean) => void;
	} = $props();
</script>

{#snippet inner()}
	<PopupMenu
		trigger={{ content: 'More' }}
		onOpenChange={onInnerOpenChange}
		menu={{ items: [{ type: 'option', title: 'Archive', onclick: onInnerItem }] }}
	/>
{/snippet}

{#if placement === 'header'}
	<PopupMenu
		trigger={{ content: 'Columns' }}
		closeOnItemClick={outerCloseOnItemClick}
		menu={{ header: inner, items: [{ type: 'option', title: 'Name' }] }}
	/>
{:else}
	<PopupMenu menu={{ items: [{ type: 'option', title: 'Open card' }] }}>
		{#snippet trigger(popover)}
			<div>
				<button type="button" {@attach popover.trigger}>Card</button>
				{@render inner()}
			</div>
		{/snippet}
	</PopupMenu>
{/if}
