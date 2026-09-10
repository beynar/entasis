<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.svelte.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { slide } from 'svelte/transition';
	import type {
		SidebarApi,
		SidebarCollapseIcon,
		SidebarDensity,
		SidebarMenuEntry,
		SidebarSize,
		SidebarTooltipMode
	} from './sidebar.props.js';
	import { getSidebarMenuPosition } from './sidebar-position.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarMenuSubItem from './SidebarMenuSubItem.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		item,
		api,
		collapseIcon,
		tooltips,
		size,
		density,
		theme
	}: {
		item: SidebarMenuEntry;
		api: SidebarApi;
		collapseIcon: SidebarCollapseIcon;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	let open = $state<boolean | undefined>();
	let rowRef = $state<HTMLElement | null>(null);
	let submenuTriggerRef = $state<HTMLButtonElement | null>(null);
	let submenuRef = $state<HTMLUListElement | null>(null);
	let actionRef = $state<HTMLElement | null>(null);
	const classes = $derived(useSidebarTheme(theme));
	const menuSize = $derived(
		item.size ? ({ small: 'sm', normal: 'default', large: 'lg' } as const)[item.size] : undefined
	);
	const t = $derived(useI18n());
	const isOpen = $derived(open ?? item.defaultOpen ?? false);
	const isIconCollapsed = $derived(api.displayState === 'collapsed' && !api.isMobile);
	const showTooltip = $derived((tooltips === 'always' || isIconCollapsed) && !api.isMobile);
	const tooltipContent = $derived(showTooltip ? (item.tooltip ?? item.label) : undefined);
	const hasSubmenu = $derived(!!item.items?.length);
	const showSubmenu = $derived(
		hasSubmenu && !isIconCollapsed && (item.collapsible === false || isOpen)
	);

	$effect(() => {
		const activeElement = document.activeElement;
		if (!(activeElement instanceof HTMLElement)) return;

		if (!showSubmenu && submenuRef?.contains(activeElement)) {
			(submenuTriggerRef ?? rowRef)?.focus();
			return;
		}

		if (isIconCollapsed && actionRef?.contains(activeElement)) {
			(submenuTriggerRef ?? rowRef)?.focus();
		}
	});

	function toggleSubmenu() {
		if (item.disabled) return;
		open = !isOpen;
	}

	function handleClick(event: MouseEvent) {
		if (item.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		item.onclick?.(event);
	}
</script>

{#snippet entryContent()}
	<SidebarIcon icon={item.icon} />
	<span class={classes.menuLabel()}>{item.label}</span>
{/snippet}

{#snippet indicator()}
	{#if collapseIcon === 'plus-minus'}
		<SidebarIcon
			icon={isOpen ? minusIcon : plusIcon}
			class={classes.menuTrailing({ componentSize: size })}
		/>
	{:else}
		<SidebarIcon
			icon={caretRightIcon}
			class={classes.menuTrailing({
				componentSize: size,
				className: ['transition-transform', isOpen && 'rotate-90']
			})}
		/>
	{/if}
{/snippet}

{#snippet leafButton()}
	{#if item.href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			bind:this={rowRef}
			href={item.disabled ? undefined : item.href}
			role={item.disabled ? 'link' : undefined}
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={item.size ?? 'normal'}
			data-active={item.isActive ? 'true' : undefined}
			aria-current={item.isActive ? 'page' : undefined}
			aria-disabled={item.disabled || undefined}
			tabindex={item.disabled ? -1 : undefined}
			class={classes.menuButton({
				variant: item.variant,
				componentSize: size,
				density,
				size: menuSize,
				className: item.class
			})}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			bind:this={rowRef}
			type="button"
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={item.size ?? 'normal'}
			data-active={item.isActive ? 'true' : undefined}
			aria-current={item.isActive ? 'page' : undefined}
			disabled={item.disabled || undefined}
			class={classes.menuButton({
				variant: item.variant,
				componentSize: size,
				density,
				size: menuSize,
				className: item.class
			})}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
		</button>
	{/if}
{/snippet}

{#snippet dropdownButton()}
	<PopupMenu
		menu={{ items: item.menu ?? [] }}
		position={getSidebarMenuPosition(item.menuSide, item.menuAlign, api.isMobile)}
		class={item.menuClass}
		fitTrigger
	>
		{#snippet trigger(popover)}
			<button
				type="button"
				data-slot="sidebar-menu-button"
				data-sidebar="menu-button"
				data-size={item.size ?? 'normal'}
				disabled={item.disabled || undefined}
				class={classes.menuButton({
					variant: item.variant,
					componentSize: size,
					density,
					size: menuSize,
					className: ['aria-expanded:bg-neutral-muted', item.class]
				})}
				aria-expanded={popover.isOpen}
				aria-haspopup="menu"
				aria-controls={popover.isOpen ? popover.id : undefined}
				{@attach tooltipContent
					? tooltip({ content: tooltipContent, position: 'right' })
					: undefined}
				{@attach popover.reference}
				onclick={() => popover.toggle()}
			>
				{@render entryContent()}
				<SidebarIcon icon={dotsThreeIcon} class={classes.menuTrailing({ componentSize: size })} />
			</button>
		{/snippet}
	</PopupMenu>
{/snippet}

{#snippet submenu()}
	<ul
		bind:this={submenuRef}
		data-slot="sidebar-menu-sub"
		data-sidebar="menu-sub"
		inert={showSubmenu ? undefined : true}
		aria-hidden={showSubmenu ? undefined : 'true'}
		class={classes.subMenu({ density, className: item.subClass })}
		transition:slide={{ duration: 180 }}
	>
		{#each item.items ?? [] as sub, index (sub.label + index)}
			<SidebarMenuSubItem {sub} {size} {density} {theme} />
		{/each}
	</ul>
{/snippet}

<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class={classes.menuItem()}>
	<div class="group/menu-row relative">
		{#if item.menu}
			{@render dropdownButton()}
		{:else if hasSubmenu && item.collapsible === false}
			{@render leafButton()}
		{:else if hasSubmenu}
			{#if item.href}
				{@render leafButton()}
				<button
					bind:this={submenuTriggerRef}
					type="button"
					class={classes.menuAction({
						componentSize: size,
						density,
						className: 'left-1 right-auto bg-neutral-muted data-[open=true]:rotate-90'
					})}
					data-open={isOpen ? 'true' : undefined}
					aria-label={`${t.toggle} ${t.submenu}`}
					aria-expanded={showSubmenu}
					disabled={item.disabled || undefined}
					onclick={toggleSubmenu}
				>
					<SidebarIcon icon={caretRightIcon} />
				</button>
			{:else}
				<button
					bind:this={submenuTriggerRef}
					type="button"
					data-slot="sidebar-menu-button"
					data-sidebar="menu-button"
					data-size={item.size ?? 'normal'}
					data-active={item.isActive ? 'true' : undefined}
					disabled={item.disabled || undefined}
					class={classes.menuButton({
						variant: item.variant,
						componentSize: size,
						density,
						size: menuSize,
						className: item.class
					})}
					aria-expanded={showSubmenu}
					{@attach tooltipContent
						? tooltip({ content: tooltipContent, position: 'right' })
						: undefined}
					onclick={toggleSubmenu}
				>
					{@render entryContent()}
					{@render indicator()}
				</button>
			{/if}
		{:else}
			{@render leafButton()}
		{/if}

		{#if item.badge != null && !isIconCollapsed}
			<div
				data-slot="sidebar-menu-badge"
				data-sidebar="menu-badge"
				class={classes.badge({ componentSize: size, density })}
			>
				{item.badge}
			</div>
		{/if}
		{#if item.action}
			<div
				bind:this={actionRef}
				data-slot="sidebar-menu-action"
				data-sidebar="menu-action"
				inert={isIconCollapsed ? true : undefined}
				aria-hidden={isIconCollapsed ? 'true' : undefined}
				class={classes.menuAction({ componentSize: size, density })}
			>
				<SidebarAction action={item.action} {api} {size} {theme} />
			</div>
		{/if}
	</div>

	{#if showSubmenu}
		{@render submenu()}
	{/if}
</li>
