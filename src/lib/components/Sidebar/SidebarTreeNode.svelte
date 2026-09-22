<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { fileIcon } from '$lib/components/Icons/file.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';
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
	const popupItems = $derived(isSubNode ? [] : toMenuItems(node.children ?? []));

	function toMenuItems(nodes: SidebarTreeNode[]): MenuItem[] {
		return nodes.map((treeNode): MenuItem => {
			const children = treeNode.children ?? [];
			const option = {
				title: treeNode.label,
				prefix: treeNode.icon ?? (children.length ? folderIcon : fileIcon),
				size,
				active: treeNode.isActive,
				attrs: treeNode.isActive ? { 'aria-current': 'page' } : undefined
			};

			if (children.length) {
				return {
					...option,
					type: 'submenu',
					menu: toMenuItems(children)
				};
			}

			return {
				...option,
				type: 'option',
				href: treeNode.href,
				onclick: (event) => {
					treeNode.onclick?.(event);
					popupOpen = false;
				}
			};
		});
	}

	$effect(() => {
		if (!isIconCollapsed) popupOpen = false;
	});

	$effect(() => {
		if (showChildren || !childrenRef?.contains(document.activeElement)) return;
		triggerRef?.focus();
	});
</script>

<li
	data-slot={isSubNode ? 'sidebar-menu-sub-item' : 'sidebar-menu-item'}
	data-sidebar={isSubNode ? 'menu-sub-item' : 'menu-item'}
	class={isSubNode ? 'group/menu-sub-item relative' : classes.menuItem()}
>
	{#if hasChildren}
		{#if isIconCollapsed && !isSubNode}
			<PopupMenu
				bind:open={popupOpen}
				menu={{ items: popupItems, submenuMode: 'popover', density }}
				position={popupPosition}
				fitTrigger={false}
			>
				{#snippet trigger(popover)}
					<button
						bind:this={triggerRef}
						type="button"
						data-slot={rowSlot}
						data-sidebar={rowData}
						class={rowClass}
						aria-expanded={popover.isOpen}
						aria-haspopup="menu"
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
			</PopupMenu>
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
