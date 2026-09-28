<script lang="ts">
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { DisclosureIndicator } from '$lib/types/theme.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
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
	import SidebarMenuItem from './SidebarMenuItem.svelte';
	import SidebarMenuList from './SidebarMenuList.svelte';
	import SidebarViewStage from './SidebarViewStage.svelte';
	import { arrowLeftIcon } from '$lib/components/Icons/arrowLeft.js';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';
	import { type SidebarSlotValues, type SidebarViewsState } from './sidebar.views.svelte.js';

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
		activeVariant,
		density,
		label,
		views,
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
		collapseIcon: DisclosureIndicator;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		/** Accessible name for the body navigation landmark. */
		label: string;
		/** Named views; when enabled, each region slides between them instead of rendering the props. */
		views?: SidebarViewsState;
		theme?: SidebarThemeProps;
	} = $props();

	const rootSource = $derived<SidebarSlotValues>({
		items,
		content,
		headerButton,
		search,
		headerMenu,
		header,
		footerButton,
		footerMenu,
		footer
	});
	const hasHeader = (source: SidebarSlotValues) =>
		!!(source.headerButton || source.search || source.headerMenu || source.header);
	const hasFooter = (source: SidebarSlotValues) =>
		!!(source.footerButton || source.footerMenu || source.footer);

	const classes = $derived(useSidebarTheme(theme));
	const t = $derived(useI18n());
	// A hover peek renders the collapsed panel at full width, so icon-mode behaviour has to
	// stop with it: labels, badges, and inline submenus must match the width on screen.
	const collapsed = $derived(api.displayState === 'collapsed' && !api.isMobile && !api.isPeeking);
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

{#snippet headerButtonSlot(headerButton: SidebarMenuButtonItem)}
	<SidebarMenuButton
		{...headerButton}
		{api}
		mobile={api.isMobile}
		defaultAlign="start"
		{size}
		{density}
		{theme}
	/>
{/snippet}

{#snippet searchSlot(searchBox: SidebarSearch)}
	<form
		bind:this={searchRef}
		data-slot="sidebar-search"
		class={classes.searchContainer({ size, collapsed })}
		inert={collapsed ? true : undefined}
		aria-hidden={collapsed ? 'true' : undefined}
		onsubmit={(event) => event.preventDefault()}
	>
		<input
			placeholder={searchBox.placeholder}
			aria-label={searchBox.label ?? t.search}
			value={searchBox.value}
			oninput={searchBox.oninput}
			class={classes.search({ size, density, className: searchBox.class })}
		/>
		<SidebarIcon icon={magnifyingGlassIcon} class={classes.searchIcon({ size, density })} />
	</form>
{/snippet}

{#snippet menuSlot(items: SidebarMenuEntry[])}
	<SidebarMenuList
		{items}
		{api}
		{collapseIcon}
		{tooltips}
		{size}
		{activeVariant}
		{density}
		{theme}
	/>
{/snippet}

{#snippet footerButtonSlot(footerButton: SidebarMenuButtonItem)}
	<SidebarMenuButton
		{...footerButton}
		{api}
		mobile={api.isMobile}
		defaultAlign="end"
		{size}
		{density}
		{theme}
	/>
{/snippet}

{#snippet headerRegion(source: SidebarSlotValues)}
	<!--
		The `header` snippet renders first, so a custom workspace card sits above the built-in
		search and menu instead of under them. Consumers never need an order override.
	-->
	{#if source.header}
		{@render source.header(api)}
	{/if}
	{#if source.headerButton}
		{@render headerButtonSlot(source.headerButton)}
	{/if}
	{#if source.search}
		{@render searchSlot(source.search)}
	{/if}
	{#if source.headerMenu}
		{@render menuSlot(source.headerMenu)}
	{/if}
{/snippet}

{#snippet bodyRegion(source: SidebarSlotValues)}
	{#if source.content}
		{@render source.content(api)}
	{:else if source.items}
		{#each source.items as group, index (group.label ?? `group-${index}`)}
			{#if group.separator && index > 0}
				<div
					data-slot="sidebar-separator"
					data-sidebar="separator"
					class={classes.separator({ density })}
				></div>
			{/if}
			<SidebarGroupComponent
				{group}
				{api}
				{collapseIcon}
				{tooltips}
				{size}
				{activeVariant}
				{density}
				{theme}
			/>
		{/each}
	{/if}
{/snippet}

{#snippet footerRegion(source: SidebarSlotValues)}
	{#if source.footerButton}
		{@render footerButtonSlot(source.footerButton)}
	{/if}
	{#if source.footerMenu}
		{@render menuSlot(source.footerMenu)}
	{/if}
	{#if source.footer}
		{@render source.footer(api)}
	{/if}
{/snippet}

{#if views?.enabled}
	<!--
		Views with the same header and footer share one panel layer, so only the menu inside slides;
		a view that changes them slides the whole panel as one page.
	-->
	<SidebarViewStage
		{views}
		kind="panel"
		layers={views.layers('panel')}
		layerClass="flex min-h-0 flex-col"
		{theme}
	>
		{#snippet children(panelLayer)}
			{@const chrome = views.chrome(panelLayer.view)}
			{#if hasHeader(chrome)}
				<div data-slot="sidebar-header" data-sidebar="header" class={classes.header({ density })}>
					{@render headerRegion(chrome)}
				</div>
			{/if}
			<!-- The activity bar is a second nav landmark, so this one needs its own name to tell them apart. -->
			<SidebarViewStage
				{views}
				kind="body"
				layers={panelLayer.role
					? [{ key: panelLayer.view, view: panelLayer.view }]
					: views.layers('body')}
				layerClass={classes.nav({ density })}
				{label}
				{theme}
			>
				{#snippet children(bodyLayer)}
					{@const parent = views.parentOf(bodyLayer.view)}
					{#if parent !== undefined}
						{@const parentLabel = views.labelOf(parent)}
						<!-- A nested view opens on a row back to its parent, named after it like a back button. -->
						<div data-slot="sidebar-group" data-sidebar="group" class={classes.group({ density })}>
							<ul data-slot="sidebar-menu" data-sidebar="menu" class={classes.menu({ density })}>
								<SidebarMenuItem
									item={{ label: parentLabel ?? t.back, icon: arrowLeftIcon, view: parent }}
									back
									ariaLabel={parentLabel ? `${t.back}, ${parentLabel}` : undefined}
									{api}
									{collapseIcon}
									{tooltips}
									{size}
									{activeVariant}
									{density}
									{theme}
								/>
							</ul>
						</div>
					{/if}
					{@render bodyRegion(views.body(bodyLayer.view))}
				{/snippet}
			</SidebarViewStage>
			{#if hasFooter(chrome)}
				<div data-slot="sidebar-footer" data-sidebar="footer" class={classes.footer({ density })}>
					{@render footerRegion(chrome)}
				</div>
			{/if}
		{/snippet}
	</SidebarViewStage>
{:else}
	{#if hasHeader(rootSource)}
		<div data-slot="sidebar-header" data-sidebar="header" class={classes.header({ density })}>
			{@render headerRegion(rootSource)}
		</div>
	{/if}

	<!-- The activity bar is a second nav landmark, so this one needs its own name to tell them apart. -->
	<nav
		data-slot="sidebar-nav"
		data-sidebar="nav"
		aria-label={label}
		class={classes.nav({ density })}
	>
		{@render bodyRegion(rootSource)}
	</nav>

	{#if hasFooter(rootSource)}
		<div data-slot="sidebar-footer" data-sidebar="footer" class={classes.footer({ density })}>
			{@render footerRegion(rootSource)}
		</div>
	{/if}
{/if}
