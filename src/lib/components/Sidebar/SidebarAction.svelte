<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import type { SidebarApi, SidebarMenuActionDescriptor, SidebarSize } from './sidebar.props.js';
	import { getSidebarMenuPosition } from './sidebar-position.js';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		action,
		api,
		size,
		theme
	}: {
		action: SidebarMenuActionDescriptor | import('svelte').Snippet<[SidebarApi]>;
		api: SidebarApi;
		size: SidebarSize;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const actionLabel = $derived(typeof action === 'function' ? undefined : (action.label ?? 'More'));
	const actionIcon = $derived(
		typeof action === 'function' ? undefined : (action.icon ?? dotsThreeIcon)
	);
</script>

{#if typeof action === 'function'}
	{@render action(api)}
{:else if action.menu}
	<PopupMenu
		menu={{ items: action.menu }}
		position={getSidebarMenuPosition(action.menuSide, action.menuAlign, api.isMobile)}
		class={action.menuClass}
		fitTrigger={false}
	>
		{#snippet trigger(popover)}
			<button
				type="button"
				class={classes.actionTrigger({ componentSize: size })}
				aria-label={actionLabel}
				aria-expanded={popover.isOpen}
				aria-haspopup="menu"
				aria-controls={popover.isOpen ? popover.id : undefined}
				{@attach popover.reference}
				onclick={() => popover.toggle()}
			>
				<SidebarIcon icon={actionIcon} />
				<span class="sr-only">{actionLabel}</span>
			</button>
		{/snippet}
	</PopupMenu>
{:else}
	<button
		type="button"
		class={classes.actionTrigger({ componentSize: size })}
		aria-label={actionLabel}
		onclick={(event) => action.onclick?.(event, api)}
	>
		<SidebarIcon icon={actionIcon} />
		<span class="sr-only">{actionLabel}</span>
	</button>
{/if}
