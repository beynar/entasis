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

// The outermost PopupMenu owns the whole menu tree. Submenu panels are portaled out of the root
// panel, so a press inside one never reaches the root's own click listener; every level reports
// item presses here instead, and the root closes all of them at once.
const POPUP_MENU_ROOT = Symbol('entasis:popup-menu-root');

export interface PopupMenuRoot {
	/** The root's `closeOnItemClick`: whether an item press anywhere in the tree closes it. */
	closeOnItemClick: () => boolean;
	/** Closes every open level of the tree once, focus going back to the root trigger. */
	close: () => void;
}

/** Called by the outermost PopupMenu only; nested PopupMenus read it with `usePopupMenuRoot`. */
export const providePopupMenuRoot = (root: PopupMenuRoot) => setContext(POPUP_MENU_ROOT, root);

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
 * Focus left inside a submenu panel is first handed to the trigger of the first-level submenu,
 * which sits in the root panel. The root's focus scope only restores focus that is still inside
 * its own panel, and it returns that focus to the root trigger when its close transition ends —
 * whichever level finishes animating first.
 */
export const closeMenuTree = (root: PopoverState) => {
	const active = document.activeElement;
	if (active) {
		const branch = root.children.find((child) => child.isOpen && containsInTree(child, active));
		branch?.triggerReference?.focus({ preventScroll: true });
	}
	const close = (popover: PopoverState) => {
		for (const child of popover.children) close(child);
		if (popover.isOpen) popover.close();
	};
	close(root);
};
