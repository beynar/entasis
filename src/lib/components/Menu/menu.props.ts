import type { Snippet } from 'svelte';
import type { Density } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ButtonProps } from '../Button/button.props.js';
import type { MenuOptionProps } from '../MenuOption/menuOption.props.js';
import type { SeparatorProps } from '../Separator/separator.props.js';
import type { MenuThemeProps } from './menu.theme.js';

export type MenuSubmenuMode = 'auto' | 'popover' | 'stack';

export type SubMenuItemProps = Omit<
	MenuOptionProps,
	'onclick' | 'onpointerenter' | 'onpointerleave'
> & {
	/**
	 * Array of submenu items.
	 */
	menu: MenuItem[];
	/**
	 * Open submenu on hover.
	 * @default true
	 */
	openOnHover?: boolean;
	/**
	 * Open submenu on click.
	 * @default true
	 */
	openOnClick?: boolean;
	/**
	 * Delay in milliseconds before the submenu opens on hover.
	 * @default 100
	 */
	delay?: number;
	/**
	 * Close when the pointer leaves the submenu prediction cone and rectangle tolerance.
	 * @default true
	 */
	closeOnMouseLeave?: boolean;
	/**
	 * Shows the submenu hover safe-area rectangle and prediction cone.
	 * @default false
	 */
	debugSafeArea?: boolean;
};

export type MenuItem =
	| ({ type: 'button' } & ButtonProps)
	| ({ type: 'option' } & MenuOptionProps)
	| ({ type: 'separator' } & SeparatorProps)
	| ({ type: 'submenu' } & MenuOptionProps & SubMenuItemProps);

export type MenuProps = WithAttachments<{
	/**
	 * Focus first item on mount.
	 * @default false
	 */
	focusOnMount?: boolean | 'container';
	/**
	 * The class name of the menu container. First element that the component outputs in the DOM.
	 */
	class?: string;
	/**
	 * Array of menu items to render (Button, MenuOption, or Separator).
	 */
	items: MenuItem[];
	/**
	 * Spacing density — controls the gap between rows and is forwarded to every
	 * MenuOption row (option, submenu trigger, back control). A per-item `density`
	 * wins over the menu-level one. Items of type 'button' render a Button, which
	 * has no density axis and is unaffected.
	 * @default 'normal'
	 */
	density?: Density;
	/**
	 * Custom theme overrides for the menu container and child components.
	 */
	theme?: MenuThemeProps;
	/**
	 * How submenu items render.
	 * - auto: floating popovers normally, stacked views inside mobile-sheet popovers.
	 * - popover: always use nested PopupMenu instances.
	 * - stack: navigate to submenu views inside the current menu.
	 * @default 'auto'
	 */
	submenuMode?: MenuSubmenuMode;
	/**
	 * Optional header content rendered at the top of the menu.
	 */
	header?: Snippet;
	/**
	 * Optional footer content rendered at the bottom of the menu.
	 */
	footer?: Snippet;
}>;
