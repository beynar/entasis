<script lang="ts">
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type {
		SidebarApi,
		SidebarCollapseIcon,
		SidebarGroup,
		SidebarMenuButtonItem,
		SidebarMenuEntry,
		SidebarSearch,
		SidebarDensity,
		SidebarSize,
		SidebarTooltipMode
	} from './sidebar.props.js';
	import SidebarGroupComponent from './SidebarGroup.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarMenuButton from './SidebarMenuButton.svelte';
	import SidebarMenuList from './SidebarMenuList.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		api,
		items,
		headerButton,
		search,
		headerMenu,
		header,
		content,
		footerButton,
		footerMenu,
		footer,
		collapseIcon,
		tooltips,
		size,
		density,
		theme
	}: {
		api: SidebarApi;
		items?: SidebarGroup[];
		headerButton?: SidebarMenuButtonItem;
		search?: SidebarSearch;
		headerMenu?: SidebarMenuEntry[];
		header?: import('svelte').Snippet<[SidebarApi]>;
		content?: import('svelte').Snippet<[SidebarApi]>;
		footerButton?: SidebarMenuButtonItem;
		footerMenu?: SidebarMenuEntry[];
		footer?: import('svelte').Snippet<[SidebarApi]>;
		collapseIcon: SidebarCollapseIcon;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const t = $derived(useI18n());
	const collapsed = $derived(api.displayState === 'collapsed' && !api.isMobile);
	let searchRef = $state<HTMLFormElement | null>(null);

	$effect(() => {
		if (!collapsed || !searchRef?.contains(document.activeElement)) return;

		const panel = searchRef.closest<HTMLElement>('[data-sidebar="sidebar"]');
		const fallback = Array.from(
			panel?.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]') ?? []
		).find(
			(element) =>
				!element.hasAttribute('disabled') &&
				element.getAttribute('aria-disabled') !== 'true' &&
				!element.closest('[inert]')
		);
		if (fallback) {
			fallback.focus();
			return;
		}
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
	});
</script>

{#if headerButton || search || headerMenu || header}
	<div data-slot="sidebar-header" data-sidebar="header" class={classes.header({ density })}>
		{#if headerButton}
			<SidebarMenuButton
				{...headerButton}
				isMobile={api.isMobile}
				defaultAlign="start"
				{size}
				{density}
				{theme}
			/>
		{/if}
		{#if search}
			<form
				bind:this={searchRef}
				data-slot="sidebar-search"
				class={classes.searchContainer({ componentSize: size, collapsed })}
				inert={collapsed ? true : undefined}
				aria-hidden={collapsed ? 'true' : undefined}
				onsubmit={(event) => event.preventDefault()}
			>
				<input
					placeholder={search.placeholder}
					aria-label={search.label ?? t.search}
					value={search.value}
					oninput={search.oninput}
					class={classes.search({ componentSize: size, density, className: search.class })}
				/>
				<SidebarIcon
					icon={magnifyingGlassIcon}
					class={classes.searchIcon({ componentSize: size, density })}
				/>
			</form>
		{/if}
		{#if headerMenu}
			<SidebarMenuList
				items={headerMenu}
				{api}
				{collapseIcon}
				{tooltips}
				{size}
				{density}
				{theme}
			/>
		{/if}
		{#if header}
			{@render header(api)}
		{/if}
	</div>
{/if}

<div data-slot="sidebar-nav" data-sidebar="nav" class={classes.nav({ density })}>
	{#if content}
		{@render content(api)}
	{:else if items}
		{#each items as group, index (group.label ?? `group-${index}`)}
			{#if group.separator && index > 0}
				<div
					data-slot="sidebar-separator"
					data-sidebar="separator"
					class={classes.separator({ density })}
				></div>
			{/if}
			<SidebarGroupComponent {group} {api} {collapseIcon} {tooltips} {size} {density} {theme} />
		{/each}
	{/if}
</div>

{#if footerButton || footerMenu || footer}
	<div data-slot="sidebar-footer" data-sidebar="footer" class={classes.footer({ density })}>
		{#if footerButton}
			<SidebarMenuButton
				{...footerButton}
				isMobile={api.isMobile}
				defaultAlign="end"
				{size}
				{density}
				{theme}
			/>
		{/if}
		{#if footerMenu}
			<SidebarMenuList
				items={footerMenu}
				{api}
				{collapseIcon}
				{tooltips}
				{size}
				{density}
				{theme}
			/>
		{/if}
		{#if footer}
			{@render footer(api)}
		{/if}
	</div>
{/if}
