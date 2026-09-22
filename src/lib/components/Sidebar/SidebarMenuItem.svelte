<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { DisclosureIndicator } from '$lib/types/theme.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarMenuEntry,
		SidebarSize,
		SidebarTooltipMode
	} from './sidebar.props.js';
	import { getSidebarMenuPosition } from './sidebar-position.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarMenuSubItem from './SidebarMenuSubItem.svelte';
	import { slide } from '$lib/transitions/transition.js';
	import { useSidebarMotion, useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		item,
		api,
		collapseIcon,
		tooltips,
		size,
		activeVariant,
		density,
		theme
	}: {
		item: SidebarMenuEntry;
		api: SidebarApi;
		collapseIcon: DisclosureIndicator;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	let open = $state<boolean | undefined>();
	let rowRef = $state<HTMLElement | null>(null);
	let submenuTriggerRef = $state<HTMLButtonElement | null>(null);
	let submenuRef = $state<HTMLUListElement | null>(null);
	let actionRef = $state<HTMLElement | null>(null);
	const classes = $derived(useSidebarTheme(theme));
	// Motion preset from `sidebarTheme.motion`, through the override ladder
	// (registry → `setSidebarTheme` → the instance `theme.motion` slot). `slide` is a
	// factory: it must be created during init, because it reads the theme context.
	const resolveMotion = useSidebarMotion();
	const slideTransition = slide();
	const collapseMotion = $derived(resolveMotion(undefined, { motion: theme?.motion }));
	const t = $derived(useI18n());
	const isOpen = $derived(open ?? item.defaultOpen ?? false);
	// A hover peek renders the collapsed panel at full width, so icon-mode behaviour has to
	// stop with it: labels, badges, and inline submenus must match the width on screen.
	const isIconCollapsed = $derived(
		api.displayState === 'collapsed' && !api.isMobile && !api.isPeeking
	);
	const showTooltip = $derived((tooltips === 'always' || isIconCollapsed) && !api.isMobile);
	const tooltipContent = $derived(showTooltip ? (item.tooltip ?? item.label) : undefined);
	const hasSubmenu = $derived(!!item.items?.length);
	// A bare glyph stays bare: the wrapper only appears when the entry asks for a role tint or a
	// tile, so an untinted row never inherits the ambient `data-color`.
	const hasIconSurface = $derived(!!item.icon && (item.iconVariant === 'tile' || !!item.iconColor));
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
	{#if hasIconSurface}
		<span
			data-slot="sidebar-menu-icon"
			data-color={item.iconColor}
			class={classes.menuIcon({ variant: item.iconVariant ?? 'bare', size })}
		>
			<SidebarIcon icon={item.icon} />
		</span>
	{:else}
		<SidebarIcon icon={item.icon} />
	{/if}
	<span class={classes.menuLabel()}>{item.label}</span>
{/snippet}

{#snippet indicator()}
	{#if collapseIcon === 'none'}
		<!-- No disclosure indicator. -->
	{:else if collapseIcon === 'plus-minus'}
		<SidebarIcon icon={isOpen ? minusIcon : plusIcon} class={classes.menuTrailing({ size })} />
	{:else}
		<SidebarIcon
			icon={caretRightIcon}
			class={classes.menuTrailing({
				size,
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
			data-active-variant={activeVariant}
			aria-current={item.isActive ? 'page' : undefined}
			aria-disabled={item.disabled || undefined}
			tabindex={item.disabled ? -1 : undefined}
			class={classes.menuButton({
				variant: item.variant,
				activeVariant,
				size,
				density,
				itemSize: item.size,
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
			data-active-variant={activeVariant}
			aria-current={item.isActive ? 'page' : undefined}
			disabled={item.disabled || undefined}
			class={classes.menuButton({
				variant: item.variant,
				activeVariant,
				size,
				density,
				itemSize: item.size,
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
				data-active-variant={activeVariant}
				disabled={item.disabled || undefined}
				class={classes.menuButton({
					variant: item.variant,
					activeVariant,
					size,
					density,
					itemSize: item.size,
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
				<SidebarIcon icon={dotsThreeIcon} class={classes.menuTrailing({ size })} />
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
		in:slideTransition={collapseMotion.in}
		out:slideTransition={collapseMotion.out}
	>
		{#each item.items ?? [] as sub, index (sub.label + index)}
			<SidebarMenuSubItem {sub} {size} {activeVariant} {density} {theme} />
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
						size,
						density,
						className: 'bg-neutral-muted right-auto left-1 data-[open=true]:rotate-90'
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
					data-active-variant={activeVariant}
					disabled={item.disabled || undefined}
					class={classes.menuButton({
						variant: item.variant,
						activeVariant,
						size,
						density,
						itemSize: item.size,
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
				class={classes.badge({ size, density })}
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
				class={classes.menuAction({ size, density })}
			>
				<SidebarAction action={item.action} {api} {size} {theme} />
			</div>
		{/if}
	</div>

	{#if showSubmenu}
		{@render submenu()}
	{/if}
</li>
