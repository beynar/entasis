import type { Snippet } from 'svelte';
import type { MenuItem, MenuProps } from '../Menu/menu.props.js';
import type { PopupMenuProps } from '../PopupMenu/popupMenu.props.js';
import type { WithAttachments } from '$lib/types/props.js';

export type ContextMenuProps = WithAttachments<{
	/**
	 * The menu items shown on right-click (Button, MenuOption, Separator, or submenu).
	 */
	items: MenuItem[];
	/**
	 * The right-click target — the content the context menu is attached to.
	 */
	children: Snippet;
	/**
	 * Menu overrides (header, footer, theme, ...) forwarded to the underlying Menu.
	 */
	menu?: Omit<MenuProps, 'items'>;
	/**
	 * When true, right-click is ignored and the native context menu is allowed through.
	 */
	disabled?: boolean;
	/**
	 * Bindable open state of the context menu.
	 */
	open?: boolean;
	/**
	 * Initial open state when `open` is not provided.
	 */
	defaultOpen?: boolean;
	/**
	 * Called once when the library requests an open-state change.
	 */
	onOpenChange?: (open: boolean) => void;
	/**
	 * Called after the open transition finishes.
	 */
	onAfterOpen?: PopupMenuProps['onAfterOpen'];
	/**
	 * Called after the close transition finishes.
	 */
	onAfterClose?: PopupMenuProps['onAfterClose'];
	/**
	 * The class name applied to the wrapper around the target content.
	 */
	class?: string;
	/**
	 * Additional PopupMenu/Popover overrides (position, offset, closeOnEscape, ...).
	 */
	popup?: Omit<
		PopupMenuProps,
		| 'menu'
		| 'trigger'
		| 'open'
		| 'defaultOpen'
		| 'onOpenChange'
		| 'onAfterOpen'
		| 'onAfterClose'
		| 'ref'
	>;
}>;
