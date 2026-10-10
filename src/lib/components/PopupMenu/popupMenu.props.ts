import type { PopoverProps } from '../Popover/popover.props.js';
import type { MenuProps } from '../Menu/menu.props.js';
import type { PopupMenuThemeProps } from './popupMenu.theme.js';

export type PopupMenuProps = Omit<PopoverProps, 'children' | 'theme'> & {
	/**
	 * Menu props including items array and theme.
	 */
	menu: MenuProps;
	/**
	 * Whether choosing a menu item (a button or link without `data-menu-keep-open="true"`)
	 * closes the menu. Choosing an item inside a submenu closes every open submenu and the menu
	 * together, and focus returns to the menu trigger. Submenus follow the outermost menu's
	 * setting.
	 * @default true
	 */
	closeOnItemClick?: boolean;
	/**
	 * Theme overrides for PopupMenu's own panel slot plus the underlying Popover parts.
	 */
	theme?: PopupMenuThemeProps & PopoverProps['theme'];
};
