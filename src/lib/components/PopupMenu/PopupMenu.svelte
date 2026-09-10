<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Popover from '../Popover/Popover.svelte';
	import Menu from '../Menu/Menu.svelte';
	import type { PopupMenuProps } from './popupMenu.props.js';
	import { on } from 'svelte/events';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import { hasSubmenuItems } from '../Menu/menuTree.js';

	let {
		menu,
		closeOnItemClick = true,
		defaultOpen = false,
		open = $bindable(),
		onOpenChange,
		closeOnEscape = true,
		mobileSheet,
		mobileSheetSizeTransition,
		class: className,
		...popoverProps
	}: PopupMenuProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	// A menu-appropriate min-width so short-label menus (e.g. context menus) don't collapse to their
	// content. Overridable — a consumer `class` wins via tailwind-merge.
	const panelClass = $derived(['min-w-44', className].filter(Boolean).join(' '));
	const menuSubmenuMode = $derived(menu.submenuMode ?? 'auto');
	const usesStackedSubmenus = $derived(
		hasSubmenuItems(menu.items) &&
			(menuSubmenuMode === 'stack' || (menuSubmenuMode === 'auto' && !!mobileSheet))
	);
	const resolvedMobileSheetSizeTransition = $derived(
		usesStackedSubmenus ? false : mobileSheetSizeTransition
	);

	const setOpen = (nextOpen: boolean) => {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	};

	const closeOnClick = (popover: PopoverState) => (node: HTMLElement) => {
		if (closeOnItemClick) {
			return on(node, 'click', (e) => {
				const path = e.composedPath();
				const buttonOrLink = path.find(
					(node) => node instanceof HTMLButtonElement || node instanceof HTMLAnchorElement
				);
				const shouldKeepOpen = path.some(
					(node) =>
						node instanceof HTMLElement && node.getAttribute('data-menu-keep-open') === 'true'
				);

				if (buttonOrLink && !shouldKeepOpen) {
					popover?.close();
				}
			});
		}
	};
</script>

<Popover
	open={openState.value}
	onOpenChange={setOpen}
	size="small"
	{closeOnEscape}
	{mobileSheet}
	mobileSheetSizeTransition={resolvedMobileSheetSizeTransition}
	class={panelClass}
	{...popoverProps}
>
	{#snippet children(popover)}
		<Menu focusOnMount="container" {...menu} {@attach closeOnClick(popover)} />
	{/snippet}
</Popover>
