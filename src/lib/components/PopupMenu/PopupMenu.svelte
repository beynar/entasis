<script lang="ts">
	import {
		closeMenuTree,
		providePopupMenuPanelSize,
		providePopupMenuRoot,
		type PopupMenuRoot
	} from './popupMenu.context.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Popover from '../Popover/Popover.svelte';
	import Menu from '../Menu/Menu.svelte';
	import type { PopupMenuInternalProps } from './popupMenu.props.js';
	import { usePopupMenuTheme } from './popupMenu.theme.js';
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import { hasSubmenuItems } from '../Menu/menuTree.js';
	import { createOpenChangeDetails, type OpenChangeDetails } from '$lib/utils/openChange.js';

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
		submenuOf,
		...popoverProps
	}: PopupMenuInternalProps = $props();
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

	// The Popover's `onOpenChange`: the details (reason, event, `cancel()`) pass through, so a
	// consumer that cancels keeps the menu as it is.
	const setOpen = (nextOpen: boolean, details: OpenChangeDetails) => {
		if (openState.value === nextOpen) return;
		onOpenChange?.(nextOpen, details);
		if (details.isCanceled) return;
		openState.value = nextOpen;
	};

	// The popover this PopupMenu renders and its Menu element, known once the menu mounts.
	let popoverState: PopoverState | null = null;
	let menuElement: HTMLElement | null = null;
	// Where focus goes when the tree closes, chosen as the root panel's focus scope chooses: the
	// trigger, else the element that had focus when the menu opened (a context menu's target).
	let opener: HTMLElement | null = null;
	// A submenu MenuFloating renders joins the tree it opens from: that root's `closeOnItemClick`
	// decides for every level, and an item press anywhere closes the whole tree once. Every other
	// PopupMenu, one nested in a menu's header, footer or trigger included, roots its own tree.
	// Membership is settled when the menu mounts.
	const tree = untrack(() => submenuOf);
	const root: PopupMenuRoot = tree ?? {
		closeOnItemClick: () => closeOnItemClick,
		close: (event) => {
			const details = { reason: 'item-press', event } as const;
			if (popoverState) {
				closeMenuTree(popoverState, popoverState.triggerReference ?? opener, menuElement, details);
			} else setOpen(false, createOpenChangeDetails(details));
		}
	};
	if (!tree) providePopupMenuRoot(root);

	const closeOnClick = (popover: PopoverState) => (node: HTMLElement) => {
		popoverState = popover;
		menuElement = node;
		const active = document.activeElement;
		opener =
			active instanceof HTMLElement && active !== document.body && !node.contains(active)
				? active
				: null;
		const off = on(node, 'click', (e) => {
			if (!root.closeOnItemClick()) return;
			const path = e.composedPath();
			const buttonOrLink = path.find(
				(node) => node instanceof HTMLButtonElement || node instanceof HTMLAnchorElement
			);
			const shouldKeepOpen = path.some(
				(node) => node instanceof HTMLElement && node.getAttribute('data-menu-keep-open') === 'true'
			);

			if (buttonOrLink && !shouldKeepOpen) root.close(e);
		});
		return () => {
			off();
			if (popoverState === popover) popoverState = null;
			if (menuElement === node) menuElement = null;
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
