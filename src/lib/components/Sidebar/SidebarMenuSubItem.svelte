<script lang="ts">
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarMenuSubEntry,
		SidebarSize
	} from './sidebar.props.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		sub,
		api,
		size,
		activeVariant,
		density,
		iconCollapsed = false,
		theme
	}: {
		sub: SidebarMenuSubEntry;
		api: SidebarApi;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		/** The Sidebar is collapsed to icons: a pinned action must not be reachable then. */
		iconCollapsed?: boolean;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const subSize = $derived(sub.size ?? size);
	// A bare glyph stays bare: the wrapper only appears when the entry asks for a role tint or a
	// tile, so an untinted row never inherits the ambient `data-color`.
	const hasIconSurface = $derived(!!sub.icon && (sub.iconVariant === 'tile' || !!sub.iconColor));
	const hasBadge = $derived(sub.badge != null);
	// The label is always visible on a submenu row, so the tooltip is extra information: shown
	// whenever one is set, never on mobile, where hover does not exist.
	const tooltipContent = $derived(sub.tooltip && !api.isMobile ? sub.tooltip : undefined);
	const buttonClass = $derived(
		classes.subButton({
			size: subSize,
			itemSize: sub.size,
			activeVariant,
			density,
			reserveEnd: !!sub.action || hasBadge,
			className: sub.class
		})
	);

	function handleClick(event: MouseEvent) {
		if (sub.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		sub.onclick?.(event);
	}
</script>

{#snippet entryContent()}
	{#if hasIconSurface}
		<span
			data-slot="sidebar-menu-icon"
			data-color={sub.iconColor}
			class={classes.menuIcon({
				variant: sub.iconVariant ?? 'bare',
				size: subSize,
				placement: 'sub'
			})}
		>
			<SidebarIcon icon={sub.icon} />
		</span>
	{:else}
		<SidebarIcon icon={sub.icon} />
	{/if}
	<span>{sub.label}</span>
{/snippet}

<li
	data-slot="sidebar-menu-sub-item"
	data-sidebar="menu-sub-item"
	class="group/menu-sub-item relative"
>
	{#if sub.href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			href={sub.disabled ? undefined : sub.href}
			role={sub.disabled ? 'link' : undefined}
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={subSize}
			data-active={sub.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			aria-current={sub.isActive ? 'page' : undefined}
			aria-disabled={sub.disabled || undefined}
			tabindex={sub.disabled ? -1 : undefined}
			class={buttonClass}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={subSize}
			data-active={sub.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			disabled={sub.disabled || undefined}
			class={buttonClass}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
		</button>
	{/if}

	{#if hasBadge}
		<div
			data-slot="sidebar-menu-sub-badge"
			data-sidebar="menu-sub-badge"
			class={classes.badge({ size: subSize, density })}
		>
			{sub.badge}
		</div>
	{/if}
	{#if sub.action}
		<div
			data-slot="sidebar-menu-sub-action"
			data-sidebar="menu-sub-action"
			inert={iconCollapsed ? true : undefined}
			aria-hidden={iconCollapsed ? 'true' : undefined}
			class={classes.subAction({ size: subSize, density })}
		>
			<SidebarAction action={sub.action} {api} size={subSize} {theme} />
		</div>
	{/if}
</li>
