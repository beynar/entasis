<script lang="ts">
	import { disclosurePanel } from '$lib/attachments/disclosurePanel.svelte.js';
	import { openStateAttributes } from '$lib/utils/stateAttributes.js';
	import type { DisclosureIndicator } from '$lib/types/theme.js';
	import type {
		SidebarActiveVariant,
		SidebarApi,
		SidebarDensity,
		SidebarGroup,
		SidebarMenuActionDescriptor,
		SidebarSize,
		SidebarTooltipMode
	} from './sidebar.props.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import SidebarMenuList from './SidebarMenuList.svelte';
	import SidebarTreeNode from './SidebarTreeNode.svelte';
	import { useSidebarMotion, useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		group,
		api,
		collapseIcon,
		tooltips,
		size,
		activeVariant,
		density,
		theme
	}: {
		group: SidebarGroup;
		api: SidebarApi;
		collapseIcon: DisclosureIndicator;
		tooltips: SidebarTooltipMode;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	// One descriptor or several: the group pins a row of affordances, each in its own box.
	const actions = $derived<
		(SidebarMenuActionDescriptor | import('svelte').Snippet<[SidebarApi]>)[]
	>(group.action == null ? [] : Array.isArray(group.action) ? group.action : [group.action]);
	const actionSize = (action: (typeof actions)[number]) =>
		typeof action === 'function' ? size : (action.size ?? size);

	let open = $state<boolean | undefined>();
	let labelRef = $state<HTMLButtonElement | null>(null);
	let actionRef = $state<HTMLElement | null>(null);
	let contentRef = $state<HTMLElement | null>(null);
	const classes = $derived(useSidebarTheme(theme));
	// Motion preset from `sidebarTheme.motion`, through the override ladder
	// (registry → `setSidebarTheme` → the instance `theme.motion` slot).
	const resolveMotion = useSidebarMotion();
	const collapseMotion = $derived(resolveMotion(undefined, { motion: theme?.motion }));
	const isOpen = $derived(open ?? group.defaultOpen ?? true);
	// A hover peek renders the collapsed panel at full width, so icon-mode behaviour has to
	// stop with it: labels, badges, and inline submenus must match the width on screen.
	const isIconCollapsed = $derived(
		api.displayState === 'collapsed' && !api.isMobile && !api.isPeeking
	);
	const showGroupContent = $derived(!group.collapsible || isIconCollapsed || isOpen);
	const uid = $props.id();
	const contentId = `${uid}-content`;
	// The group's `hidden` state and its height animation, reversible mid-way, come from the
	// shared disclosure panel, as Collapsible's and Accordion's do.
	const content = disclosurePanel({ open: () => showGroupContent, motion: () => collapseMotion });

	function focusFirstMenuRow() {
		const fallback = Array.from(
			contentRef?.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]') ?? []
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
	}

	$effect(() => {
		const activeElement = document.activeElement;
		if (!(activeElement instanceof HTMLElement)) return;

		if (isIconCollapsed && (activeElement === labelRef || actionRef?.contains(activeElement))) {
			focusFirstMenuRow();
			return;
		}

		if (!showGroupContent && contentRef?.contains(activeElement)) {
			labelRef?.focus();
		}
	});
</script>

{#snippet groupMenu()}
	<div
		bind:this={contentRef}
		id={contentId}
		data-slot="sidebar-group-content"
		data-sidebar="group-content"
		{...content.attributes}
		inert={content.open ? undefined : true}
		aria-hidden={content.open ? undefined : 'true'}
		class={classes.groupContent({ size })}
		{@attach content.attach}
	>
		{#if group.tree}
			<ul data-slot="sidebar-menu" data-sidebar="menu" class={classes.menu({ density })}>
				{#each group.tree as node, index (node.label + index)}
					<SidebarTreeNode {node} {api} {tooltips} {size} {activeVariant} {density} {theme} />
				{/each}
			</ul>
		{:else}
			<SidebarMenuList
				items={group.items ?? []}
				{api}
				{collapseIcon}
				{tooltips}
				{size}
				{activeVariant}
				{density}
				{theme}
			/>
		{/if}
	</div>
{/snippet}

{#if group.collapsible}
	<div
		data-slot="sidebar-group"
		data-sidebar="group"
		class={classes.group({ density, className: group.class })}
	>
		<button
			bind:this={labelRef}
			type="button"
			class={classes.groupLabel({ interactive: true, size, density })}
			disabled={isIconCollapsed || undefined}
			inert={isIconCollapsed ? true : undefined}
			aria-hidden={isIconCollapsed ? 'true' : undefined}
			aria-expanded={isOpen}
			aria-controls={content.rendered ? contentId : undefined}
			{...openStateAttributes(isOpen)}
			onclick={() => (open = !isOpen)}
		>
			<span>{group.label}</span>
			<SidebarIcon
				icon={caretRightIcon}
				class="ms-auto transition-transform {isOpen ? 'rotate-90' : 'rtl:-scale-x-100'}"
			/>
		</button>
		{#if actions.length}
			<div
				bind:this={actionRef}
				data-slot="sidebar-group-action"
				data-sidebar="group-action"
				inert={isIconCollapsed ? true : undefined}
				aria-hidden={isIconCollapsed ? 'true' : undefined}
				class={classes.groupAction({
					size,
					density,
					hasToggle: true
				})}
			>
				{#each actions as action, index (index)}
					<div class={classes.actionSlot({ size: actionSize(action) })}>
						<SidebarAction {action} {api} size={actionSize(action)} {theme} />
					</div>
				{/each}
			</div>
		{/if}
		{#if content.rendered}
			{@render groupMenu()}
		{/if}
	</div>
{:else}
	<div
		data-slot="sidebar-group"
		data-sidebar="group"
		class={classes.group({ density, className: group.class })}
	>
		{#if group.label}
			<div
				data-slot="sidebar-group-label"
				data-sidebar="group-label"
				aria-hidden={isIconCollapsed ? 'true' : undefined}
				class={classes.groupLabel({ size, density })}
			>
				{group.label}
			</div>
		{/if}
		{#if actions.length}
			<div
				bind:this={actionRef}
				data-slot="sidebar-group-action"
				data-sidebar="group-action"
				inert={isIconCollapsed ? true : undefined}
				aria-hidden={isIconCollapsed ? 'true' : undefined}
				class={classes.groupAction({ size, density, hasToggle: false })}
			>
				{#each actions as action, index (index)}
					<div class={classes.actionSlot({ size: actionSize(action) })}>
						<SidebarAction {action} {api} size={actionSize(action)} {theme} />
					</div>
				{/each}
			</div>
		{/if}
		{@render groupMenu()}
	</div>
{/if}
