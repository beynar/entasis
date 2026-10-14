import type { Snippet } from 'svelte';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ButtonProps } from '../Button/button.props.js';
import type { MenuOptionProps } from '../MenuOption/menuOption.props.js';
import type { SeparatorProps } from '../Separator/separator.props.js';
import type { Slot } from '../Slot/slot.js';
import type { MenuThemeProps } from './menu.theme.js';

export type MenuSubmenuMode = 'auto' | 'popover' | 'stack';

/** Fields every menu item accepts. */
export type MenuItemBase = {
	/**
	 * Identity of the row. A row keeps its DOM node (and with it focus, the tab stop and hover
	 * state) while items before it are inserted, removed or reordered, as long as its key stays the
	 * same. Left out, the key comes from the row's visible text, `href` or `textValue`, so rows
	 * built from plain strings need none. Give rows whose text is a snippet or repeats a key.
	 */
	key?: string | number;
	/**
	 * Identifies the row in `onHighlightChange` and in a filter's `match`. Left out, the row's
	 * `textValue`, or its text when that is a string, stands for it.
	 */
	value?: string;
};

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
	/**
	 * Adds a search field above the submenu's rows (a "Move to..." picker). `true` uses the
	 * defaults; an object tunes the field. See `MenuProps.filter`.
	 */
	filter?: MenuFilter;
	/**
	 * Called with the `value` of the highlighted row of the submenu, `undefined` when none is.
	 */
	onHighlightChange?: (value: string | undefined) => void;
};

/** What a menu's search field matches against, and how it looks. */
export type MenuFilterOptions = {
	/** Placeholder of the search field. Defaults to the catalog's search placeholder. */
	placeholder?: string;
	/** Accessible name of the search field. Defaults to the placeholder. */
	label?: string;
	/**
	 * Decides whether a row stays visible for the search text. Defaults to a case- and
	 * accent-insensitive substring match against the row's `textValue`, `value` or text.
	 */
	match?: (item: MenuFilterMatchItem, search: string) => boolean;
};

/** A row as a filter's `match` sees it. */
export type MenuFilterMatchItem = {
	/** The row's `value`, else its `textValue`, else its text when that is a string. */
	value: string | undefined;
	/** The text the row shows or is matched on. */
	text: string;
	/** The row's own item. */
	item: MenuItem;
};

/** `true` shows a search field with the defaults; an object tunes it. */
export type MenuFilter = boolean | MenuFilterOptions;

/**
 * A row that closes the menu when pressed unless `closeOnClick` is `false`. Applies to buttons
 * and options; a checkbox item or a radio group keeps the menu open by default.
 */
export type MenuCloseOnClick = {
	/**
	 * Whether pressing the row closes the menu it sits in.
	 * @default true
	 */
	closeOnClick?: boolean;
};

export type MenuButtonItem = { type: 'button' } & MenuItemBase & MenuCloseOnClick & ButtonProps;

export type MenuOptionItem = { type: 'option' } & MenuItemBase &
	Omit<MenuOptionProps, 'closeOnClick'> &
	MenuCloseOnClick;

export type MenuSeparatorItem = { type: 'separator' } & Pick<MenuItemBase, 'key'> & SeparatorProps;

export type MenuSubmenuItem = { type: 'submenu' } & MenuItemBase &
	MenuOptionProps &
	SubMenuItemProps;

/**
 * A row with a checked state. The check indicator stays mounted and animates out when the row is
 * unchecked. A press toggles it and keeps the menu open unless `closeOnClick` is `true`.
 */
export type MenuCheckboxItem = { type: 'checkbox' } & Pick<MenuItemBase, 'key'> &
	Omit<MenuOptionProps, 'selected' | 'role' | 'closeOnClick'> & {
		/** Checked state. Pass it with `onValueChange` to control the row. */
		value?: boolean;
		/** Initial checked state when `value` is not passed. @default false */
		defaultValue?: boolean;
		/** Called once with the new checked state after a press that changes it. */
		onValueChange?: (value: boolean) => void;
		/**
		 * Whether pressing the row closes the menu.
		 * @default false
		 */
		closeOnClick?: boolean;
	};

/** One radio of a `radio-group` item. */
export type MenuRadioItem = Omit<MenuOptionProps, 'selected' | 'role' | 'closeOnClick'> &
	Pick<MenuItemBase, 'key'> &
	Pick<MenuCloseOnClick, 'closeOnClick'> & {
		/** The value the group takes when this radio is chosen. Unique within the group. */
		value: string;
	};

/**
 * Radio rows that share one value, inside a labelled `role="group"`. A press chooses the radio
 * and keeps the menu open unless `closeOnClick` is `true`; choosing the checked radio changes
 * nothing.
 */
export type MenuRadioGroupItem = {
	type: 'radio-group';
	key?: string | number;
	/** Label of the group. It names the group for assistive technology and is hidden from the tree otherwise. */
	label?: Slot;
	/** Checked value. Pass it with `onValueChange` to control the group. */
	value?: string;
	/** Initial checked value when `value` is not passed. */
	defaultValue?: string;
	/** Called once with the chosen value after a press that changes it. */
	onValueChange?: (value: string) => void;
	/**
	 * Whether choosing a radio closes the menu. A radio's own `closeOnClick` wins.
	 * @default false
	 */
	closeOnClick?: boolean;
	/** Disables every radio of the group. */
	disabled?: boolean;
	/** The radios. */
	items: MenuRadioItem[];
};

/** Rows under a label, inside a `role="group"` named by it. */
export type MenuGroupItem = {
	type: 'group';
	key?: string | number;
	/** Label of the group. It names the group for assistive technology and is hidden from the tree otherwise. */
	label?: Slot;
	/** The rows of the group. */
	items: MenuItem[];
};

export type MenuItem =
	| MenuButtonItem
	| MenuOptionItem
	| MenuSeparatorItem
	| MenuSubmenuItem
	| MenuCheckboxItem
	| MenuRadioGroupItem
	| MenuGroupItem;

export type MenuProps = WithAttachments<{
	/**
	 * Focus first item on mount.
	 * - `true`: the first item.
	 * - `'last'`: the last item.
	 * - `'container'`: the menu itself, with no item highlighted.
	 *
	 * Left out, a PopupMenu decides from how it opened: a keyboard open highlights the first item
	 * (the last one for ArrowUp), a pointer open focuses the menu, and a hover open leaves focus
	 * where it is.
	 * @default false
	 */
	focusOnMount?: boolean | 'container' | 'last';
	/**
	 * The class name of the menu container. First element that the component outputs in the DOM.
	 */
	class?: string;
	/**
	 * Array of menu items to render (Button, MenuOption, Separator, submenu, checkbox, radio
	 * group or group).
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
	 * Type/icon scale of every MenuOption row. A per-item `size` wins over the
	 * menu-level one. Items of type 'button' render a Button and are unaffected.
	 * @default 'normal'
	 */
	size?: Sizes;
	/**
	 * Role every MenuOption row follows unless the item names its own `color`.
	 * Left undefined, each row keeps the MenuOption default.
	 */
	color?: Colors;
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
	 * Optional header content rendered at the top of the menu, outside the `role="menu"` element
	 * (links and fields in it are not menu items).
	 */
	header?: Snippet;
	/**
	 * Optional footer content rendered at the bottom of the menu, outside the `role="menu"`
	 * element (links and buttons in it are not menu items).
	 */
	footer?: Snippet;
	/**
	 * Adds a search field above the rows. Typing narrows the rows (and drops groups left empty);
	 * focus stays in the field while ArrowUp and ArrowDown highlight rows, and Enter presses the
	 * highlighted one. `true` uses the defaults; an object tunes the placeholder, the label and
	 * the match.
	 * @default false
	 */
	filter?: MenuFilter;
	/**
	 * The search text. Pass it with `onSearchChange` to control the field.
	 */
	search?: string;
	/**
	 * Initial search text when `search` is not passed.
	 * @default ''
	 */
	defaultSearch?: string;
	/**
	 * Called once per edit of the search field with the new text.
	 */
	onSearchChange?: (search: string) => void;
	/**
	 * Called when the highlighted row changes (by keyboard, by hover or by filtering), with that
	 * row's `value` (its `textValue`, or its text when that is a string) and `undefined` when no
	 * row is highlighted.
	 */
	onHighlightChange?: (value: string | undefined) => void;
	/**
	 * Shown in place of the rows when the search matches none of them.
	 */
	empty?: Snippet;
}>;
