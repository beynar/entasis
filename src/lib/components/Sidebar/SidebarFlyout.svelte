<script module lang="ts">
	import type { SidebarIcon as SidebarIconValue } from './sidebar.props.js';

	/** One row of a collapsed row's flyout: a link, a button, or a named folder of more rows. */
	export type SidebarFlyoutLink = {
		label: string;
		href?: string;
		onclick?: (event: MouseEvent) => void;
		icon?: SidebarIconValue;
		isActive?: boolean;
		disabled?: boolean;
		children?: SidebarFlyoutLink[];
	};

	/** What the trigger snippet needs from the flyout's popover. */
	export type SidebarFlyoutTrigger = {
		readonly isOpen: boolean;
		readonly id: string;
		reference: (node: HTMLElement) => unknown;
		toggle: () => void;
	};
</script>

<script lang="ts">
	// A row collapsed to its icon keeps its links one press away, with NavigationMenu's disclosure
	// semantics rather than a menu's: the trigger reports `aria-expanded` and `aria-controls`, the
	// panel is a named `<nav>` of links (folders become named sub-lists), Tab walks into it from the
	// open trigger and out past its last link, Escape and any row press close it, and it opens
	// toward the page from whichever edge the sidebar sits on.
	import type { Snippet } from 'svelte';
	import MenuOption from '$lib/components/MenuOption/MenuOption.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import { fileIcon } from '$lib/components/Icons/file.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import type { SidebarDensity, SidebarSide, SidebarSize } from './sidebar.props.js';
	import { sidebarInwardSide } from './sidebar-position.js';

	let {
		label,
		links,
		side,
		size,
		density,
		trigger
	}: {
		/** Names the flyout and its nav: the collapsed row's label. */
		label: string;
		links: SidebarFlyoutLink[];
		side: SidebarSide;
		size: SidebarSize;
		density: SidebarDensity;
		trigger: Snippet<[SidebarFlyoutTrigger]>;
	} = $props();

	let open = $state(false);
	const position = $derived(`${sidebarInwardSide(side)}-start` as const);
</script>

{#snippet level(rows: SidebarFlyoutLink[], group?: string)}
	<ul
		aria-label={group}
		class="gap-micro m-0 flex list-none flex-col p-0 {group !== undefined ? 'ps-md' : ''}"
	>
		{#each rows as row, index (row.label + index)}
			<li>
				{#if row.children?.length}
					<span aria-hidden="true" class="px-md py-xs text-neutral/70 block text-xs font-medium">
						{row.label}
					</span>
					{@render level(row.children, row.label)}
				{:else}
					<!-- The row's own handler runs first; `event.preventDefault()` skips the explicit
					     close of the flyout. -->
					<MenuOption
						href={row.disabled ? undefined : row.href}
						title={row.label}
						prefix={row.icon ?? fileIcon}
						{size}
						{density}
						active={row.isActive}
						disabled={row.disabled}
						attrs={row.isActive ? { 'aria-current': 'page' } : undefined}
						onclick={composeHandlers(row.onclick, () => {
							open = false;
						})}
					/>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<Popover bind:open {position} fitTrigger={false} size="small" {label} {trigger}>
	<nav aria-label={label} data-slot="sidebar-flyout" class="min-w-48">
		{@render level(links)}
	</nav>
</Popover>
