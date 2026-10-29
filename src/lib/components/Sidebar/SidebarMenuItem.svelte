<script lang="ts">
	import { disclosurePanel } from '$lib/attachments/disclosurePanel.svelte.js';
	import { openStateAttributes } from '$lib/utils/stateAttributes.js';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import type { DisclosureIndicator } from '$lib/types/theme.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarMenuEntry,
		SidebarSize,
		SidebarTooltipMode
	} from './sidebar.props.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import {
		getSidebarMenuPosition,
		sidebarInwardPhysicalSide,
		sidebarTooltip
	} from './sidebar-position.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarFlyout from './SidebarFlyout.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarMenuSubItem from './SidebarMenuSubItem.svelte';
	import { useSidebarSuffixWidth } from './sidebar.suffix.svelte.js';
	import { useSidebarMotion, useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		item,
		api,
		collapseIcon,
		tooltips,
		size,
		activeVariant,
		density,
		back = false,
		ariaLabel,
		theme
	}: {
		item: SidebarMenuEntry;
		api: SidebarApi;
		collapseIcon: DisclosureIndicator;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		/** The row a nested view opens on, back to its parent: a leading back arrow, no chevron. */
		back?: boolean;
		/** Accessible name when the visible label alone does not say what the row does. */
		ariaLabel?: string;
		theme?: SidebarThemeProps;
	} = $props();

	let open = $state<boolean | undefined>();
	let rowRef = $state<HTMLElement | null>(null);
	let submenuTriggerRef = $state<HTMLButtonElement | null>(null);
	let submenuRef = $state<HTMLUListElement | null>(null);
	let actionRef = $state<HTMLElement | null>(null);
	let suffixRef = $state<HTMLElement | null>(null);
	const suffixWidth = useSidebarSuffixWidth();
	const classes = $derived(useSidebarTheme(theme));
	// Motion preset from `sidebarTheme.motion`, through the override ladder
	// (registry → `setSidebarTheme` → the instance `theme.motion` slot).
	const resolveMotion = useSidebarMotion();
	const collapseMotion = $derived(resolveMotion(undefined, { motion: theme?.motion }));
	const t = $derived(useI18n());
	const isOpen = $derived(open ?? item.defaultOpen ?? false);
	// A hover peek renders the collapsed panel at full width, so icon-mode behaviour has to
	// stop with it: labels, badges, and inline submenus must match the width on screen.
	const isIconCollapsed = $derived(
		api.displayState === 'collapsed' && !api.isMobile && !api.isPeeking
	);
	const showTooltip = $derived((tooltips === 'always' || isIconCollapsed) && !api.isMobile);
	const tooltipContent = $derived(
		showTooltip ? (item.tooltip ?? ariaLabel ?? item.label) : undefined
	);
	const hasSubmenu = $derived(!!item.items?.length);
	const showBadge = $derived(item.badge != null && !isIconCollapsed);
	// An in-flow chevron or dots after the badge: the row then keeps its action's room at every
	// width, since the action would otherwise cover that glyph when it shows.
	const hasTrailingGlyph = $derived(
		!!item.menu ||
			(item.view !== undefined && !back) ||
			(hasSubmenu && !item.href && item.collapsible !== false && collapseIcon !== 'none')
	);
	// A suffix sits beside the row and stays visible before the action, so a row with one reserves
	// the suffix's width and the action's box at every width, and its badge never steps aside.
	const endReserve = $derived(
		item.suffix
			? item.action
				? 'suffixAction'
				: 'suffix'
			: !item.action
				? 'none'
				: showBadge && !hasTrailingGlyph
					? 'actionBelowMd'
					: 'action'
	);
	const badgeAction = $derived(item.action && !item.suffix ? 'row' : 'none');
	// A bare glyph stays bare: the wrapper only appears when the entry asks for a role tint or a
	// tile, so an untinted row never inherits the ambient `data-color`.
	const hasIconSurface = $derived(!!item.icon && (item.iconVariant === 'tile' || !!item.iconColor));
	const showSubmenu = $derived(
		hasSubmenu && !isIconCollapsed && (item.collapsible === false || isOpen)
	);
	// Collapsed to its icon, a row whose own press only reveals its submenu would do nothing: it
	// opens its entries in a flyout instead. A row that navigates, opens a view or owns a menu
	// keeps that press.
	const hasFlyout = $derived(
		isIconCollapsed &&
			hasSubmenu &&
			!item.menu &&
			!item.href &&
			item.view === undefined &&
			!item.disabled
	);
	let itemRef = $state<HTMLLIElement | null>(null);
	const direction = useDirection(() => itemRef);
	// Toward the page, whichever edge the sidebar sits on and whichever way the text reads, read
	// when the tooltip opens so a runtime `dir` change is followed.
	const tooltipPosition = () => sidebarInwardPhysicalSide(api.side, direction());
	const uid = $props.id();
	const submenuId = `${uid}-submenu`;
	const suffixId = `${uid}-suffix`;
	// The row reads with its suffix (« Dossiers, 20 ») while the suffix is on screen.
	const describedBy = $derived(item.suffix && !isIconCollapsed ? suffixId : undefined);
	// The submenu's `hidden` state and its height animation, reversible mid-way, come from the
	// shared disclosure panel, as Collapsible's and Accordion's do.
	const submenuPanel = disclosurePanel({ open: () => showSubmenu, motion: () => collapseMotion });

	$effect(() => {
		const activeElement = document.activeElement;
		if (!(activeElement instanceof HTMLElement)) return;

		if (!showSubmenu && submenuRef?.contains(activeElement)) {
			(submenuTriggerRef ?? rowRef)?.focus();
			return;
		}

		if (
			isIconCollapsed &&
			(actionRef?.contains(activeElement) || suffixRef?.contains(activeElement))
		) {
			(submenuTriggerRef ?? rowRef)?.focus();
		}
	});

	function toggleSubmenu() {
		if (item.disabled) return;
		open = !isOpen;
	}

	// A row whose press reveals its submenu runs its own handler first in either mode, inline or
	// collapsed to its flyout; `event.preventDefault()` keeps the submenu as it was.
	function handleSubmenuRowClick(event: MouseEvent) {
		if (item.disabled) return;
		item.onclick?.(event);
		if (!event.defaultPrevented) toggleSubmenu();
	}

	function handleClick(event: MouseEvent) {
		if (item.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		item.onclick?.(event);
		if (item.view !== undefined && !event.defaultPrevented) api.setView(item.view);
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
		<SidebarIcon icon={item.icon} class={back ? 'rtl:-scale-x-100' : undefined} />
	{/if}
	<span class={classes.menuLabel()}>{item.label}</span>
	{#if showBadge}
		<span
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			class={classes.badge({ size, action: badgeAction })}
		>
			{item.badge}
		</span>
	{/if}
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
				className: ['transition-transform', isOpen ? 'rotate-90' : 'rtl:-scale-x-100']
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
			aria-describedby={describedBy}
			tabindex={item.disabled ? -1 : undefined}
			class={classes.menuButton({
				variant: item.variant,
				activeVariant,
				size,
				density,
				itemSize: item.size,
				endReserve,
				className: item.class
			})}
			{@attach tooltipContent
				? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
				: undefined}
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
			aria-label={ariaLabel}
			aria-describedby={describedBy}
			data-sidebar-view-target={item.view}
			disabled={item.disabled || undefined}
			class={classes.menuButton({
				variant: item.variant,
				activeVariant,
				size,
				density,
				itemSize: item.size,
				endReserve,
				className: item.class
			})}
			{@attach tooltipContent
				? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
				: undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
			{#if item.view !== undefined && !back}
				<SidebarIcon
					icon={caretRightIcon}
					class={classes.menuTrailing({ size, className: 'rtl:-scale-x-100' })}
				/>
			{/if}
		</button>
	{/if}
{/snippet}

{#snippet dropdownButton()}
	<PopupMenu
		menu={{ items: item.menu ?? [], size, density }}
		position={getSidebarMenuPosition(item.menuSide, item.menuAlign, {
			isMobile: api.isMobile,
			side: api.side
		})}
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
					endReserve,
					className: ['aria-expanded:bg-neutral-muted', item.class]
				})}
				aria-expanded={popover.isOpen}
				aria-haspopup="menu"
				aria-controls={popover.isOpen ? popover.id : undefined}
				aria-describedby={describedBy}
				{@attach tooltipContent
					? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
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

{#snippet flyoutButton()}
	<SidebarFlyout label={item.label} links={item.items ?? []} side={api.side} {size} {density}>
		{#snippet trigger(popover)}
			<button
				bind:this={submenuTriggerRef}
				type="button"
				data-slot="sidebar-menu-button"
				data-sidebar="menu-button"
				data-size={item.size ?? 'normal'}
				data-active={item.isActive ? 'true' : undefined}
				data-active-variant={activeVariant}
				class={classes.menuButton({
					variant: item.variant,
					activeVariant,
					size,
					density,
					itemSize: item.size,
					endReserve,
					className: item.class
				})}
				aria-expanded={popover.isOpen}
				aria-controls={popover.isOpen ? popover.id : undefined}
				{@attach tooltipContent
					? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
					: undefined}
				{@attach popover.reference}
				onclick={composeHandlers(item.onclick, () => popover.toggle())}
			>
				{@render entryContent()}
			</button>
		{/snippet}
	</SidebarFlyout>
{/snippet}

{#snippet submenu()}
	<ul
		bind:this={submenuRef}
		id={submenuId}
		data-slot="sidebar-menu-sub"
		data-sidebar="menu-sub"
		{...submenuPanel.attributes}
		inert={submenuPanel.open ? undefined : true}
		aria-hidden={submenuPanel.open ? undefined : 'true'}
		class={classes.subMenu({ density, className: item.subClass })}
		{@attach submenuPanel.attach}
	>
		{#each item.items ?? [] as sub, index (sub.label + index)}
			<SidebarMenuSubItem
				{sub}
				{api}
				{size}
				{activeVariant}
				{density}
				iconCollapsed={isIconCollapsed}
				{theme}
			/>
		{/each}
	</ul>
{/snippet}

<li
	bind:this={itemRef}
	data-slot="sidebar-menu-item"
	data-sidebar="menu-item"
	class={classes.menuItem()}
>
	<div
		class="group/menu-row relative"
		style:--sidebar-suffix-width={item.suffix ? suffixWidth.value : undefined}
	>
		{#if item.menu}
			{@render dropdownButton()}
		{:else if hasFlyout}
			{@render flyoutButton()}
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
						className:
							'bg-neutral-muted start-1 end-auto data-open:rotate-90 rtl:not-data-open:-scale-x-100'
					})}
					{...openStateAttributes(showSubmenu)}
					aria-label={`${t.toggle} ${t.submenu}`}
					aria-expanded={showSubmenu}
					aria-controls={submenuPanel.rendered ? submenuId : undefined}
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
						endReserve,
						className: item.class
					})}
					aria-expanded={showSubmenu}
					aria-controls={submenuPanel.rendered ? submenuId : undefined}
					aria-describedby={describedBy}
					{...openStateAttributes(showSubmenu)}
					{@attach tooltipContent
						? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
						: undefined}
					onclick={handleSubmenuRowClick}
				>
					{@render entryContent()}
					{@render indicator()}
				</button>
			{/if}
		{:else}
			{@render leafButton()}
		{/if}

		{#if item.suffix}
			<!-- Beside the row, never inside it: the suffix may hold its own controls. -->
			<div
				bind:this={suffixRef}
				id={suffixId}
				data-slot="sidebar-menu-suffix"
				data-sidebar="menu-suffix"
				inert={isIconCollapsed ? true : undefined}
				aria-hidden={isIconCollapsed ? 'true' : undefined}
				class={classes.suffix({ size, density, action: item.action ? 'action' : 'none' })}
				{@attach suffixWidth.measure}
			>
				{@render item.suffix(api, item)}
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
				<SidebarAction action={item.action} {api} {size} {density} {theme} />
			</div>
		{/if}
	</div>

	{#if submenuPanel.rendered}
		{@render submenu()}
	{/if}
</li>
