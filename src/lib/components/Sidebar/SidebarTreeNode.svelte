<script lang="ts">
	import MenuOption from '$lib/components/MenuOption/MenuOption.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { fileIcon } from '$lib/components/Icons/file.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarSize,
		SidebarTooltipMode,
		SidebarTreeNode
	} from './sidebar.props.js';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarTreeNodeComponent from './SidebarTreeNode.svelte';
	import { slide } from '$lib/transitions/transition.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import { useSidebarMotion, useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		node,
		api,
		tooltips,
		size,
		activeVariant,
		density,
		depth = 0,
		theme
	}: {
		node: SidebarTreeNode;
		api: SidebarApi;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		depth?: number;
		theme?: SidebarThemeProps;
	} = $props();

	let open = $state<boolean | undefined>();
	let popupOpen = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let childrenRef = $state<HTMLUListElement | null>(null);
	const classes = $derived(useSidebarTheme(theme));
	// Motion preset from `sidebarTheme.motion`, through the override ladder
	// (registry → `setSidebarTheme` → the instance `theme.motion` slot). `slide` is a
	// factory: it must be created during init, because it reads the theme context.
	const resolveMotion = useSidebarMotion();
	const slideTransition = slide();
	const collapseMotion = $derived(resolveMotion(undefined, { motion: theme?.motion }));
	const isOpen = $derived(open ?? node.defaultOpen ?? false);
	const hasChildren = $derived(!!node.children?.length);
	// A hover peek renders the collapsed panel at full width, so icon-mode behaviour has to
	// stop with it: labels, badges, and inline submenus must match the width on screen.
	const isIconCollapsed = $derived(
		api.displayState === 'collapsed' && !api.isMobile && !api.isPeeking
	);
	const isSubNode = $derived(depth > 0);
	const showChildren = $derived(hasChildren && isOpen && !isIconCollapsed);
	const showTooltip = $derived((tooltips === 'always' || isIconCollapsed) && !api.isMobile);
	const tooltipContent = $derived(showTooltip ? node.label : undefined);
	const rowClass = $derived(
		isSubNode
			? classes.subButton({ size, activeVariant, density })
			: classes.menuButton({ size, activeVariant, density })
	);
	const rowSlot = $derived(isSubNode ? 'sidebar-menu-sub-button' : 'sidebar-menu-button');
	const rowData = $derived(isSubNode ? 'menu-sub-button' : 'menu-button');
	const popupPosition = $derived(api.side === 'right' ? 'left-start' : 'right-start');

	$effect(() => {
		if (!isIconCollapsed) popupOpen = false;
	});

	$effect(() => {
		if (showChildren || !childrenRef?.contains(document.activeElement)) return;
		triggerRef?.focus();
	});
</script>

{#snippet flyoutLevel(nodes: SidebarTreeNode[], group?: string)}
	<ul
		aria-label={group}
		class="gap-micro m-0 flex list-none flex-col p-0 {group !== undefined ? 'ps-md' : ''}"
	>
		{#each nodes as child, index (child.label + index)}
			<li>
				{#if child.children?.length}
					<span aria-hidden="true" class="px-md py-xs text-neutral/70 block text-xs font-medium">
						{child.label}
					</span>
					{@render flyoutLevel(child.children, child.label)}
				{:else}
					<!-- The node's own handler runs first; `event.preventDefault()` skips the explicit
					     close of the flyout. -->
					<MenuOption
						href={child.href}
						title={child.label}
						prefix={child.icon ?? fileIcon}
						{size}
						{density}
						active={child.isActive}
						attrs={child.isActive ? { 'aria-current': 'page' } : undefined}
						onclick={composeHandlers(child.onclick, () => {
							popupOpen = false;
						})}
					/>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<li
	data-slot={isSubNode ? 'sidebar-menu-sub-item' : 'sidebar-menu-item'}
	data-sidebar={isSubNode ? 'menu-sub-item' : 'menu-item'}
	class={isSubNode ? 'group/menu-sub-item relative' : classes.menuItem()}
>
	{#if hasChildren}
		{#if isIconCollapsed && !isSubNode}
			<!-- A flyout of links is a disclosure, not a menu: the trigger reports aria-expanded and
			     aria-controls, and the panel is a named nav of links (nested folders become named
			     sub-lists), so Tab walks it and every row is announced as the link it is. -->
			<Popover
				bind:open={popupOpen}
				position={popupPosition}
				fitTrigger={false}
				size="small"
				label={node.label}
			>
				{#snippet trigger(popover)}
					<button
						bind:this={triggerRef}
						type="button"
						data-slot={rowSlot}
						data-sidebar={rowData}
						class={rowClass}
						aria-expanded={popover.isOpen}
						aria-controls={popover.isOpen ? popover.id : undefined}
						{@attach tooltipContent
							? tooltip({ content: tooltipContent, position: 'right' })
							: undefined}
						{@attach popover.reference}
						onclick={() => popover.toggle()}
					>
						<SidebarIcon icon={node.icon ?? folderIcon} />
						<span class={classes.menuLabel()}>{node.label}</span>
					</button>
				{/snippet}
				<nav aria-label={node.label} data-slot="sidebar-flyout" class="min-w-48">
					{@render flyoutLevel(node.children ?? [])}
				</nav>
			</Popover>
		{:else}
			<button
				bind:this={triggerRef}
				type="button"
				data-slot={rowSlot}
				data-sidebar={rowData}
				class={rowClass}
				aria-expanded={showChildren}
				{@attach tooltipContent
					? tooltip({ content: tooltipContent, position: 'right' })
					: undefined}
				onclick={() => (open = !isOpen)}
			>
				<SidebarIcon
					icon={caretRightIcon}
					class="transition-transform {isOpen ? 'rotate-90' : ''}"
				/>
				<SidebarIcon icon={node.icon ?? folderIcon} />
				<span class={isSubNode ? undefined : classes.menuLabel()}>{node.label}</span>
			</button>
		{/if}
		{#if showChildren}
			<ul
				bind:this={childrenRef}
				data-slot="sidebar-menu-sub"
				data-sidebar="menu-sub"
				inert={showChildren ? undefined : true}
				aria-hidden={showChildren ? undefined : 'true'}
				class={classes.treeSubMenu({ density })}
				in:slideTransition={collapseMotion.in}
				out:slideTransition={collapseMotion.out}
			>
				{#each node.children ?? [] as child, index (child.label + index)}
					<SidebarTreeNodeComponent
						node={child}
						{api}
						{tooltips}
						{size}
						{activeVariant}
						{density}
						depth={depth + 1}
						{theme}
					/>
				{/each}
			</ul>
		{/if}
	{:else if node.href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			href={node.href}
			data-slot={rowSlot}
			data-sidebar={rowData}
			data-active={node.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			aria-current={node.isActive ? 'page' : undefined}
			class={rowClass}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={node.onclick}
		>
			<SidebarIcon icon={node.icon ?? fileIcon} />
			<span class={isSubNode ? undefined : classes.menuLabel()}>{node.label}</span>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			data-slot={rowSlot}
			data-sidebar={rowData}
			data-active={node.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			class={rowClass}
			{@attach tooltipContent ? tooltip({ content: tooltipContent, position: 'right' }) : undefined}
			onclick={node.onclick}
		>
			<SidebarIcon icon={node.icon ?? fileIcon} />
			<span class={isSubNode ? undefined : classes.menuLabel()}>{node.label}</span>
		</button>
	{/if}
</li>
