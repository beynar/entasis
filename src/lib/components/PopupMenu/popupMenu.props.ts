import type { PopoverProps } from '../Popover/popover.props.js';
import type { MenuProps } from '../Menu/menu.props.js';
import type { PopupMenuRoot } from './popupMenu.context.js';
import type { PopupMenuThemeProps } from './popupMenu.theme.js';

export type PopupMenuProps = Omit<PopoverProps, 'children' | 'theme'> & {
	/**
	 * Menu props including items array and theme.
	 */
	menu: MenuProps;
	/**
	 * Whether choosing a menu item (a button or link without `data-menu-keep-open="true"`)
	 * closes the menu. Choosing an item inside a submenu closes every open submenu and the menu
	 * together; a floating menu then returns focus to its trigger (a mobile sheet hands focus back
	 * through its Dialog). Submenus follow this setting. A PopupMenu placed in another menu's
	 * header, footer or trigger is a menu of its own and keeps its own setting.
	 * @default true
	 */
	closeOnItemClick?: boolean;
	/**
	 * Theme overrides for PopupMenu's own panel slot plus the underlying Popover parts.
	 */
	theme?: PopupMenuThemeProps & PopoverProps['theme'];
};

/**
 * PopupMenu props plus the tree wiring MenuFloating passes to the submenus it renders.
 * Deliberately absent from the package's public exports: a consumer's PopupMenu is always the
 * root of its own menu tree.
 */
export type PopupMenuInternalProps = PopupMenuProps & {
	/** The menu tree this PopupMenu opens from as a submenu; its root then decides for this level. */
	submenuOf?: PopupMenuRoot;
	/**
	 * This PopupMenu is a submenu level of the Menu that renders it, even when no tree hosts that
	 * Menu (an inline Menu): ArrowLeft leaves the level and a mobile sheet shows a back control.
	 */
	isSubmenu?: boolean;
	/**
	 * Whether the browser's own context menu may open over this menu's panels (and its submenus').
	 * A ContextMenu turns it off, so a right-click on the open menu does not show a second menu.
	 * @default true
	 */
	nativeMenu?: boolean;
};
