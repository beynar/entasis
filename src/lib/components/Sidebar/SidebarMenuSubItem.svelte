<script lang="ts">
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarMenuSubEntry,
		SidebarSize
	} from './sidebar.props.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import { sidebarInwardPhysicalSide, sidebarTooltip } from './sidebar-position.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarSuffixWidth } from './sidebar.suffix.svelte.js';
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
	const suffixWidth = useSidebarSuffixWidth();
	const uid = $props.id();
	const suffixId = `${uid}-suffix`;
	// The row reads with its suffix (« Dossiers, 20 ») while the suffix is on screen.
	const describedBy = $derived(sub.suffix && !iconCollapsed ? suffixId : undefined);
	// The label is always visible on a submenu row, so the tooltip is extra information: shown
	// whenever one is set, never on mobile, where hover does not exist.
	const tooltipContent = $derived(sub.tooltip && !api.isMobile ? sub.tooltip : undefined);
	let itemRef = $state<HTMLLIElement | null>(null);
	const direction = useDirection(() => itemRef);
	// Toward the page, whichever edge the sidebar sits on and whichever way the text reads, read
	// when the tooltip opens so a runtime `dir` change is followed.
	const tooltipPosition = () => sidebarInwardPhysicalSide(api.side, direction());
	const buttonClass = $derived(
		classes.subButton({
			size: subSize,
			itemSize: sub.size,
			activeVariant,
			density,
			// With a badge last in the row, the badge holds the end column from `md` up and the
			// action takes its place while it shows; below `md` the two sit side by side. A suffix
			// stays visible before the action, so a row with one reserves both at every width.
			endReserve: sub.suffix
				? sub.action
					? 'suffixAction'
					: 'suffix'
				: !sub.action
					? 'none'
					: hasBadge
						? 'actionBelowMd'
						: 'action',
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
	{#if hasBadge}
		<span data-slot="sidebar-menu-sub-label">{sub.label}</span>
		<span
			data-slot="sidebar-menu-sub-badge"
			data-sidebar="menu-sub-badge"
			class={classes.badge({ size: subSize, action: sub.action && !sub.suffix ? 'sub' : 'none' })}
		>
			{sub.badge}
		</span>
	{:else}
		<span>{sub.label}</span>
	{/if}
{/snippet}

<li
	bind:this={itemRef}
	data-slot="sidebar-menu-sub-item"
	data-sidebar="menu-sub-item"
	class="group/menu-sub-item relative"
	style:--sidebar-suffix-width={sub.suffix ? suffixWidth.value : undefined}
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
			aria-describedby={describedBy}
			tabindex={sub.disabled ? -1 : undefined}
			class={buttonClass}
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
			type="button"
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={subSize}
			data-active={sub.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			disabled={sub.disabled || undefined}
			aria-describedby={describedBy}
			class={buttonClass}
			{@attach tooltipContent
				? tooltip(sidebarTooltip(tooltipContent, tooltipPosition))
				: undefined}
			onclick={handleClick}
		>
			{@render entryContent()}
		</button>
	{/if}

	{#if sub.suffix}
		<!-- Beside the row, never inside it: the suffix may hold its own controls. -->
		<div
			id={suffixId}
			data-slot="sidebar-menu-sub-suffix"
			data-sidebar="menu-sub-suffix"
			inert={iconCollapsed ? true : undefined}
			aria-hidden={iconCollapsed ? 'true' : undefined}
			class={classes.suffix({
				size: subSize,
				density,
				action: sub.action ? 'action' : 'none'
			})}
			{@attach suffixWidth.measure}
		>
			{@render sub.suffix(api, sub)}
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
			<SidebarAction action={sub.action} {api} size={subSize} {density} {theme} />
		</div>
	{/if}
</li>
