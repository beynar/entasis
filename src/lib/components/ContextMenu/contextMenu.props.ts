import type { Snippet } from 'svelte';
import type { MenuItem, MenuProps } from '../Menu/menu.props.js';
import type { PopupMenuProps } from '../PopupMenu/popupMenu.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ContextMenuThemeProps } from './contextMenu.theme.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';

export type ContextMenuProps = WithAttachments<{
	/**
	 * The menu items shown on right-click (Button, MenuOption, Separator, submenu, checkbox, radio
	 * group or group).
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
	 * Called before the menu opens or closes, with the requested state and the change details
	 * (`reason`, `event`, `interaction`, `cancel()`): `'trigger-press'` for the right-click,
	 * long-press or keyboard request that opened it (or a second right-click on its anchor that
	 * closes it), `'item-press'`, `'escape-key'`, `'outside-press'` or `'focus-out'` (Tab) when it
	 * closes. `details.cancel()` keeps the menu as it is.
	 */
	onOpenChange?: OpenChangeHandler;
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
	 * Theme overrides for the target wrapper and the popup panel.
	 */
	theme?: ContextMenuThemeProps;
	/**
	 * Additional PopupMenu/Popover overrides (position, offset, closeOnEscape, closeOnItemClick,
	 * ...). `position` places the menu relative to the pointer and defaults to `'bottom-start'`;
	 * a responsive record keeps that default below its first breakpoint. `collisionBoundary`
	 * defaults to `'layoutViewport'`, so panning a pinch-zoomed page doesn't drag the menu along.
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
