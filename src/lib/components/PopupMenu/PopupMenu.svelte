<script lang="ts">
	import {
		closeMenuTree,
		providePopupMenuLevel,
		providePopupMenuPanelSize,
		providePopupMenuRoot,
		type PopupMenuRoot
	} from './popupMenu.context.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Popover from '../Popover/Popover.svelte';
	import Menu from '../Menu/Menu.svelte';
	import type { PopupMenuInternalProps } from './popupMenu.props.js';
	import { usePopupMenuTheme } from './popupMenu.theme.js';
	import { untrack, type Snippet } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import { hasSubmenuItems } from '../Menu/menuTree.js';
	import { createOpenChangeDetails, type OpenChangeDetails } from '$lib/utils/openChange.js';
	import { getTabbableElements } from '$lib/utils/focus.js';
	import { hasShortcutModifier } from '$lib/utils/useKeyDown.svelte.js';
	import { triggerFocusTarget } from '$lib/utils/trigger.js';

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
		isSubmenu = false,
		nativeMenu = true,
		trigger,
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
		if (!nextOpen) arrowOpen = null;
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
	providePopupMenuLevel(untrack(() => !!submenuOf || isSubmenu));

	/** Where focus goes when the tree is left by keyboard: the root trigger, else the opener. */
	const leaveTarget = (): HTMLElement | null => {
		const anchor = popoverState?.triggerReference;
		const trigger = anchor?.isConnected ? triggerFocusTarget(anchor) : null;
		return trigger ?? (opener?.isConnected ? opener : null);
	};

	const root: PopupMenuRoot = tree ?? {
		closeOnItemClick: () => closeOnItemClick,
		nativeMenu: () => nativeMenu,
		close: (event) => {
			const details = { reason: 'item-press', event } as const;
			if (popoverState) {
				closeMenuTree(popoverState, popoverState.triggerReference ?? opener, menuElement, details);
			} else setOpen(false, createOpenChangeDetails(details));
		},
		leave: (event) => {
			const details = { reason: 'focus-out', event, interaction: 'keyboard' } as const;
			if (!popoverState) return;
			// Focus lands on the trigger before the keydown's default action runs: Tab then carries
			// on from the trigger, to the control after it. Shift+Tab stays on the trigger.
			const closed = closeMenuTree(popoverState, leaveTarget(), menuElement, details);
			if (!closed || event.shiftKey) event.preventDefault();
		}
	};
	if (!tree) providePopupMenuRoot(root);

	// Tab or Shift+Tab in a panel leaves the whole tree, unless another tabbable control of the same
	// panel (a field or a link in its header or footer) comes next in that direction. Focus on
	// the menu itself has no row to move on from, so it always leaves.
	const leavesOnTab = (node: HTMLElement, event: KeyboardEvent) => {
		const target = event.target;
		if (!(target instanceof HTMLElement) || target.matches('[role="menu"]')) return true;
		const tabbable = getTabbableElements(node);
		const index = tabbable.indexOf(target);
		if (index === -1) return true;
		return event.shiftKey ? index === 0 : index === tabbable.length - 1;
	};

	const attachTree = (popover: PopoverState) => (node: HTMLElement) => {
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
		// The browser's own menu over a panel hides the one the user is looking at, padding included.
		const offNativeMenu = on(popover.dialogElement ?? node, 'contextmenu', (event) => {
			if (root.nativeMenu?.() === false) event.preventDefault();
		});
		const offKeys = on(node, 'keydown', (event) => {
			// Ctrl+Tab and Cmd+Tab switch the browser's tabs; Alt+Tab is how Safari reaches every control.
			if (event.key !== 'Tab' || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
			if (!leavesOnTab(node, event)) return;
			root.leave?.(event);
		});
		return () => {
			off();
			offKeys();
			offNativeMenu();
			if (popoverState === popover) popoverState = null;
			if (menuElement === node) menuElement = null;
		};
	};

	// A keyboard open (Enter, Space, ArrowDown, ArrowUp, Shift+F10) puts focus on the first row,
	// ArrowUp on the last; a pointer open focuses the menu itself; a hover open leaves focus alone.
	// A menu opened from code keeps `'container'`.
	const initialFocus = (popover: PopoverState) => {
		if (menu.focusOnMount !== undefined) return menu.focusOnMount;
		const reason = popover.openReason;
		if (reason === 'keyboard') {
			const event = popover.lastOpenChange?.event ?? arrowOpen?.event;
			return event instanceof KeyboardEvent && event.key === 'ArrowUp' ? 'last' : true;
		}
		if (reason === 'hover') return false;
		return arrowOpen ? (arrowOpen.event.key === 'ArrowUp' ? 'last' : true) : 'container';
	};

	// The ArrowDown or ArrowUp that opened the menu from its button: the Popover sees that open as
	// one made from code, so the key is kept here until the menu has taken focus. A menu closed any
	// other way (code setting `open`, a cancelled change) must not leave it for the next open.
	let arrowOpen: { event: KeyboardEvent } | null = null;
	$effect(() => {
		if (!openState.value) arrowOpen = null;
	});
	const openFromArrow = (node: HTMLElement, event: KeyboardEvent) => {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		if (event.defaultPrevented || hasShortcutModifier(event)) return;
		if (node.matches(':disabled') || node.getAttribute('aria-disabled') === 'true') return;
		event.preventDefault();
		if (openState.value) {
			// Already open: ArrowDown or ArrowUp moves into it, like Tab does.
			menuElement?.querySelector<HTMLElement>('[role="menu"]')?.focus();
			return;
		}
		const details = createOpenChangeDetails({
			reason: 'list-navigation',
			event,
			trigger: node,
			interaction: 'keyboard'
		});
		arrowOpen = { event };
		setOpen(true, details);
		if (details.isCanceled) arrowOpen = null;
	};
	const arrowKey = createAttachmentKey();
	const openFromArrowKey = (node: HTMLElement) =>
		on(node, 'keydown', (e) => openFromArrow(node, e));

	// A trigger made with a snippet is the consumer's own element, so there is no attachment to
	// put the key handler on: the snippet's Popover is remembered as it renders, and a keydown
	// that bubbles up from the element it anchors to is handled the same way.
	let snippetPopover: PopoverState | null = null;
	const rememberSnippetPopover = (popover: PopoverState) => {
		snippetPopover = popover;
		return popover;
	};
	const usesSnippetTrigger = $derived(typeof trigger === 'function');
	$effect(() => {
		if (!usesSnippetTrigger) return;
		return on(document, 'keydown', (event) => {
			const target = event.target;
			const anchor = snippetPopover?.triggerReference ?? snippetPopover?.referenceElement;
			if (!(target instanceof HTMLElement) || !anchor || target !== anchor) return;
			openFromArrow(target, event);
		});
	});

	const resolvedTrigger = $derived(
		trigger !== undefined && trigger !== false && typeof trigger === 'object'
			? { ...trigger, [arrowKey]: openFromArrowKey }
			: trigger
	);
</script>

{#snippet snippetTrigger(popover: PopoverState)}
	{@const remembered = rememberSnippetPopover(popover)}
	{@render (trigger as Snippet<[PopoverState]>)(remembered)}
{/snippet}

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
	trigger={typeof resolvedTrigger === 'function' ? snippetTrigger : resolvedTrigger}
	{...popoverProps}
>
	{#snippet children(popover)}
		{@const focusOnMount = untrack(() => initialFocus(popover))}
		<Menu {...menu} {focusOnMount} {@attach attachTree(popover)} />
	{/snippet}
</Popover>
