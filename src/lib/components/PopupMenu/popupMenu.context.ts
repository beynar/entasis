import { getContext, setContext } from 'svelte';
import type { PopoverProps } from '../Popover/popover.props.js';
import type { PopoverState } from '../Popover/popover.state.svelte.js';

// A submenu is a second PopupMenu nested inside the first. Its panel must be the same panel
// one level down — same size, so the same padding and the same concentric radius — which nothing
// carries across on its own: the nested PopupMenu is rendered by the Menu, not by the consumer.
// The parent PopupMenu publishes its panel size here and MenuFloating reads it back.
const POPUP_MENU_PANEL_SIZE = Symbol('entasis:popup-menu-panel-size');

export type PopupMenuPanelSize = NonNullable<PopoverProps['size']>;

export const providePopupMenuPanelSize = (read: () => PopupMenuPanelSize) =>
	setContext(POPUP_MENU_PANEL_SIZE, read);

export const usePopupMenuPanelSize = (): (() => PopupMenuPanelSize) | undefined =>
	getContext<(() => PopupMenuPanelSize) | undefined>(POPUP_MENU_PANEL_SIZE);

// A menu and the submenus it opens are one tree, owned by its root: the PopupMenu the consumer
// rendered, or another host that renders a Menu inline (Tree's context-menu surface). Submenu
// panels are portaled out of the root panel, so a press inside one never reaches the root's own
// click listener; each submenu reports item presses to the root instead, and the root closes every
// level at once. MenuFloating hands the root to the submenus it renders through `submenuOf`, so a
// PopupMenu the consumer nests in a header, a footer or a trigger stays a root of its own.
const POPUP_MENU_ROOT = Symbol('entasis:popup-menu-root');

export interface PopupMenuRoot {
	/** The root's `closeOnItemClick`: whether an item press anywhere in the tree closes it. */
	closeOnItemClick: () => boolean;
	/** Closes every open level of the tree once, focus going back to where the root returns it. */
	close: () => void;
}

/** Makes `root` the tree that the submenus of every Menu rendered below it join. */
export const providePopupMenuRoot = (root: PopupMenuRoot) => setContext(POPUP_MENU_ROOT, root);

/** The tree a Menu's submenus join, read by MenuFloating; `undefined` outside any tree. */
export const usePopupMenuRoot = (): PopupMenuRoot | undefined =>
	getContext<PopupMenuRoot | undefined>(POPUP_MENU_ROOT);

const containsInTree = (popover: PopoverState, node: Node): boolean =>
	!!popover.dialogElement?.contains(node) ||
	popover.children.some((child) => containsInTree(child, node));

/**
 * Closes a menu tree: every open submenu, deepest first, then the root, each through its own
 * `close()` so each level reports its open change exactly once (the order an outside press
 * dismisses them in).
 *
 * Focus left inside the tree goes straight to `returnTo`, the element the root hands focus back
 * to. No row of a closing panel keeps focus through the close transition, and every panel's focus
 * scope then finds focus already outside and leaves it alone. `rootMenu`, the root's Menu element,
 * covers a root panel the popover does not own, such as a mobile sheet.
 */
export const closeMenuTree = (
	root: PopoverState,
	returnTo: HTMLElement | null,
	rootMenu?: HTMLElement | null
) => {
	const active = document.activeElement;
	const focusInTree = !!active && (!!rootMenu?.contains(active) || containsInTree(root, active));
	const close = (popover: PopoverState) => {
		for (const child of popover.children) close(child);
		if (popover.isOpen) popover.close();
	};
	close(root);
	if (focusInTree && returnTo?.isConnected) returnTo.focus({ preventScroll: true });
};
