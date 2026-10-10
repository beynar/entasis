<script lang="ts">
	import {
		closeMenuTree,
		providePopupMenuPanelSize,
		providePopupMenuRoot,
		usePopupMenuRoot,
		type PopupMenuRoot
	} from './popupMenu.context.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Popover from '../Popover/Popover.svelte';
	import Menu from '../Menu/Menu.svelte';
	import type { PopupMenuProps } from './popupMenu.props.js';
	import { usePopupMenuTheme } from './popupMenu.theme.js';
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
		theme,
		size = 'small',
		...popoverProps
	}: PopupMenuProps = $props();
	const classes = $derived(usePopupMenuTheme(theme));
	// Submenus rendered by the Menu below open in a panel of this same size.
	providePopupMenuPanelSize(() => size);
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	// The panel slot carries the menu-appropriate min-width so short-label menus (e.g. context
	// menus) don't collapse to their content. Overridable — Popover runs this through `cx`
	// (the cn merge engine), where the consumer `class` comes last and wins.
	const panelClass = $derived(classes.panel({ className }));
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

	// The popover this PopupMenu renders, known once its menu mounts.
	let popoverState: PopoverState | null = null;
	// A submenu is a PopupMenu nested in another one's menu: it joins the tree of the outermost
	// PopupMenu, whose `closeOnItemClick` then decides for every level, and an item press anywhere
	// closes the whole tree once. Only the outermost PopupMenu provides the tree.
	const parentRoot = usePopupMenuRoot();
	const root: PopupMenuRoot = parentRoot ?? {
		closeOnItemClick: () => closeOnItemClick,
		close: () => {
			if (popoverState) closeMenuTree(popoverState);
			else setOpen(false);
		}
	};
	if (!parentRoot) providePopupMenuRoot(root);

	const closeOnClick = (popover: PopoverState) => (node: HTMLElement) => {
		popoverState = popover;
		const off = on(node, 'click', (e) => {
			if (!root.closeOnItemClick()) return;
			const path = e.composedPath();
			const buttonOrLink = path.find(
				(node) => node instanceof HTMLButtonElement || node instanceof HTMLAnchorElement
			);
			const shouldKeepOpen = path.some(
				(node) => node instanceof HTMLElement && node.getAttribute('data-menu-keep-open') === 'true'
			);

			if (buttonOrLink && !shouldKeepOpen) root.close();
		});
		return () => {
			off();
			if (popoverState === popover) popoverState = null;
		};
	};
</script>

<Popover
	open={openState.value}
	onOpenChange={setOpen}
	haspopup="menu"
	{size}
	{closeOnEscape}
	{mobileSheet}
	mobileSheetSizeTransition={resolvedMobileSheetSizeTransition}
	class={panelClass}
	{theme}
	{...popoverProps}
>
	{#snippet children(popover)}
		<Menu focusOnMount="container" {...menu} {@attach closeOnClick(popover)} />
	{/snippet}
</Popover>
