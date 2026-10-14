<script lang="ts">
	import { disclosurePanel } from '$lib/attachments/disclosurePanel.svelte.js';
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
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import { sidebarInwardPhysicalSide } from './sidebar-position.js';
	import SidebarFlyout from './SidebarFlyout.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarTreeNodeComponent from './SidebarTreeNode.svelte';
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
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let childrenRef = $state<HTMLUListElement | null>(null);
	const classes = $derived(useSidebarTheme(theme));
	// Motion preset from `sidebarTheme.motion`, through the override ladder
	// (registry → `setSidebarTheme` → the instance `theme.motion` slot).
	const resolveMotion = useSidebarMotion();
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
	let itemRef = $state<HTMLLIElement | null>(null);
	const direction = useDirection(() => itemRef);
	// Toward the page, whichever edge the sidebar sits on and whichever way the text reads.
	const tooltipPosition = $derived(sidebarInwardPhysicalSide(api.side, direction()));
	const uid = $props.id();
	const childrenId = `${uid}-children`;
	// The branch's `hidden` state and its height animation, reversible mid-way, come from the
	// shared disclosure panel, as Collapsible's and Accordion's do.
	const branch = disclosurePanel({ open: () => showChildren, motion: () => collapseMotion });

	$effect(() => {
		if (showChildren || !childrenRef?.contains(document.activeElement)) return;
		triggerRef?.focus();
	});
</script>

<li
	bind:this={itemRef}
	data-slot={isSubNode ? 'sidebar-menu-sub-item' : 'sidebar-menu-item'}
	data-sidebar={isSubNode ? 'menu-sub-item' : 'menu-item'}
	class={isSubNode ? 'group/menu-sub-item relative' : classes.menuItem()}
>
	{#if hasChildren}
		{#if isIconCollapsed && !isSubNode}
			<SidebarFlyout
				label={node.label}
				links={node.children ?? []}
				side={api.side}
				{size}
				{density}
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
							? tooltip({ content: tooltipContent, position: tooltipPosition })
							: undefined}
						{@attach popover.reference}
						onclick={() => popover.toggle()}
					>
						<SidebarIcon icon={node.icon ?? folderIcon} />
						<span class={classes.menuLabel()}>{node.label}</span>
					</button>
				{/snippet}
			</SidebarFlyout>
		{:else}
			<button
				bind:this={triggerRef}
				type="button"
				data-slot={rowSlot}
				data-sidebar={rowData}
				class={rowClass}
				aria-expanded={showChildren}
				aria-controls={branch.rendered ? childrenId : undefined}
				{@attach tooltipContent
					? tooltip({ content: tooltipContent, position: tooltipPosition })
					: undefined}
				onclick={() => (open = !isOpen)}
			>
				<SidebarIcon
					icon={caretRightIcon}
					class="transition-transform {isOpen ? 'rotate-90' : 'rtl:-scale-x-100'}"
				/>
				<SidebarIcon icon={node.icon ?? folderIcon} />
				<span class={isSubNode ? undefined : classes.menuLabel()}>{node.label}</span>
			</button>
		{/if}
		{#if branch.rendered}
			<ul
				bind:this={childrenRef}
				id={childrenId}
				data-slot="sidebar-menu-sub"
				data-sidebar="menu-sub"
				{...branch.attributes}
				inert={branch.open ? undefined : true}
				aria-hidden={branch.open ? undefined : 'true'}
				class={classes.treeSubMenu({ density })}
				{@attach branch.attach}
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
			{@attach tooltipContent
				? tooltip({ content: tooltipContent, position: tooltipPosition })
				: undefined}
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
			{@attach tooltipContent
				? tooltip({ content: tooltipContent, position: tooltipPosition })
				: undefined}
			onclick={node.onclick}
		>
			<SidebarIcon icon={node.icon ?? fileIcon} />
			<span class={isSubNode ? undefined : classes.menuLabel()}>{node.label}</span>
		</button>
	{/if}
</li>
