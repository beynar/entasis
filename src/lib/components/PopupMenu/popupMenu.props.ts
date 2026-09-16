import type { PopoverProps } from '../Popover/popover.props.js';
import type { MenuProps } from '../Menu/menu.props.js';
import type { PopupMenuThemeProps } from './popupMenu.theme.js';

export type PopupMenuProps = Omit<PopoverProps, 'children' | 'theme'> & {
	/**
	 * Menu props including items array and theme.
	 */
	menu: MenuProps;
	/**
	 * Whether to close the menu when a menu item is clicked.
	 * @default true
	 */
	closeOnItemClick?: boolean;
	/**
	 * Theme overrides for PopupMenu's own panel slot plus the underlying Popover parts.
	 */
	theme?: PopupMenuThemeProps & PopoverProps['theme'];
};
