<script lang="ts">
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { cx } from '$lib/utils/cva/index.js';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import type {
		SidebarActivityBar,
		SidebarActivityBarItem,
		SidebarDensity,
		SidebarSide,
		SidebarSize,
		SidebarVariant
	} from './sidebar.props.js';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	let {
		activityBar,
		side,
		size,
		density,
		variant = 'admin',
		placement = 'positioned',
		orientation = 'vertical',
		label,
		class: className,
		theme
	}: {
		activityBar: SidebarActivityBar;
		side: SidebarSide;
		size: SidebarSize;
		density: SidebarDensity;
		/** The Sidebar variant whose panel surface the rail wears beside the panel. */
		variant?: SidebarVariant;
		/** `static` when there is no desktop container to hold its gutters (`collapsible="none"`). */
		placement?: 'positioned' | 'static';
		/** Vertical along the sidebar edge on desktop; horizontal at the top of the mobile drawer. */
		orientation?: 'vertical' | 'horizontal';
		/** Fallback accessible name when the activity bar sets no label. */
		label: string;
		class?: string;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const resolvedColor = $derived(useDefaultColor());
	// The rail is pinned to the outer screen edge, so the only on-screen direction is inward:
	// tooltips point at the page (and overlap the panel), never off screen.
	const tooltipPosition = $derived(
		orientation === 'horizontal' ? 'bottom' : side === 'right' ? 'left' : 'right'
	);

	type Entry = { item: SidebarActivityBarItem; index: number; pinned: boolean };
	// One flat list keeps a single roving tab stop, so ArrowDown walks from the primary
	// items straight into the pinned ones instead of stopping at a list boundary.
	const entries = $derived.by<Entry[]>(() => {
		const items = activityBar.items ?? [];
		const footerItems = activityBar.footerItems ?? [];
		return [
			...items.map((item, index) => ({ item, index, pinned: false })),
			...footerItems.map((item, index) => ({
				item,
				index: items.length + index,
				pinned: index === 0
			}))
		];
	});
	const activeIndex = $derived(entries.findIndex((entry) => entry.item.isActive));

	const navigation = useNavigation({
		orientation: () => orientation,
		loop: true,
		enableHoverFocus: false,
		defaultFocusedIndex: () => (activeIndex === -1 ? null : activeIndex)
	});

	function tooltipContent(item: SidebarActivityBarItem) {
		if (item.tooltip === false) return undefined;
		return item.tooltip ?? item.label;
	}

	// An empty badge string is the "unread dot" form; anything else renders as a count/label.
	function isDot(badge: SidebarActivityBarItem['badge']) {
		return badge === '';
	}

	// The square shows no text, so the badge would be lost to assistive tech: a countable badge
	// joins the accessible name instead. A dot carries no text and a Snippet cannot be read here,
	// so those stay decorative and callers put the meaning in `label`.
	function accessibleName(item: SidebarActivityBarItem) {
		const badge = item.badge;
		if (typeof badge !== 'string' && typeof badge !== 'number') return item.label;
		return isDot(badge) ? item.label : `${item.label}, ${badge}`;
	}

	function handleClick(event: MouseEvent, entry: Entry) {
		if (entry.item.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		entry.item.onclick?.(event);
		activityBar.onSelect?.({ item: entry.item, index: entry.index });
	}
</script>

{#snippet control(entry: Entry)}
	{@const item = entry.item}
	{@const content = tooltipContent(item)}
	{#snippet inner()}
		<SidebarIcon icon={item.icon} />
		{#if item.badge != null}
			<span
				data-slot="sidebar-activity-bar-badge"
				data-color={resolvedColor}
				aria-hidden="true"
				class={classes.activityBarBadge({ size, dot: isDot(item.badge) })}
			>
				{#if typeof item.badge === 'number'}
					{item.badge}
				{:else if !isDot(item.badge)}
					<Slot render={item.badge} />
				{/if}
			</span>
		{/if}
	{/snippet}
	{#if item.href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			href={item.disabled ? undefined : item.href}
			target={item.target}
			rel={item.rel}
			role={item.disabled ? 'link' : undefined}
			data-slot="sidebar-activity-bar-item"
			data-sidebar="activity-bar-item"
			data-color={resolvedColor}
			data-active={item.isActive ? 'true' : undefined}
			data-disabled={item.disabled ? 'true' : undefined}
			aria-current={item.isActive ? 'page' : undefined}
			aria-label={accessibleName(item)}
			aria-disabled={item.disabled || undefined}
			class={classes.activityBarItem({
				size,
				density,
				active: !!item.isActive,
				disabled: !!item.disabled
			})}
			{@attach navigation.itemReference}
			{@attach content ? tooltip({ content, position: tooltipPosition }) : undefined}
			onclick={(event) => handleClick(event, entry)}
		>
			{@render inner()}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			data-slot="sidebar-activity-bar-item"
			data-sidebar="activity-bar-item"
			data-color={resolvedColor}
			data-active={item.isActive ? 'true' : undefined}
			data-disabled={item.disabled ? 'true' : undefined}
			aria-current={item.isActive ? 'page' : undefined}
			aria-label={accessibleName(item)}
			disabled={item.disabled || undefined}
			class={classes.activityBarItem({
				size,
				density,
				active: !!item.isActive,
				disabled: !!item.disabled
			})}
			{@attach navigation.itemReference}
			{@attach content ? tooltip({ content, position: tooltipPosition }) : undefined}
			onclick={(event) => handleClick(event, entry)}
		>
			{@render inner()}
		</button>
	{/if}
{/snippet}

<nav
	data-slot="sidebar-activity-bar"
	data-sidebar="activity-bar"
	data-color={resolvedColor}
	data-side={side}
	data-orientation={orientation}
	aria-label={activityBar.label ?? label}
	class={classes.activityBar({ orientation, variant, placement, density, className })}
>
	{#if activityBar.header}
		<div
			data-slot="sidebar-activity-bar-header"
			class={classes.activityBarHeader({ orientation, density })}
		>
			{@render activityBar.header()}
		</div>
	{/if}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul
		tabindex={-1}
		data-slot="sidebar-activity-bar-list"
		data-sidebar="activity-bar-list"
		class={classes.activityBarList({ orientation, density })}
		{@attach navigation.containerReference}
	>
		{#each entries as entry (entry.item.id ?? `${entry.item.label}-${entry.index}`)}
			<li
				data-slot="sidebar-activity-bar-entry"
				data-pinned={entry.pinned ? 'true' : undefined}
				class={cx(
					'flex shrink-0',
					entry.pinned && (orientation === 'horizontal' ? 'ms-auto' : 'mt-auto')
				)}
			>
				{@render control(entry)}
			</li>
		{/each}
	</ul>
	{#if activityBar.footer}
		<div
			data-slot="sidebar-activity-bar-footer"
			class={classes.activityBarFooter({ orientation, density })}
		>
			{@render activityBar.footer()}
		</div>
	{/if}
</nav>
