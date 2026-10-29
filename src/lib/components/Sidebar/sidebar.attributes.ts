/**
 * The styling hooks a Sidebar exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value. Parts are named by
 * `data-sidebar` (`sidebar`, `menu-button`, `menu-sub`, `group-content`, ...).
 */
export const sidebarDataAttributes = {
	'data-state': 'On the root: `expanded` or `collapsed`.',
	'data-display-state':
		'On the root: what is on screen, `expanded`, `collapsed` (the icon rail) or `hidden`.',
	'data-collapsible':
		'On the root: `icon` while collapsed to the icon rail, `offcanvas` while hidden, empty while expanded.',
	'data-side': 'On the root, the panel and its rail and handles: `left` or `right`.',
	'data-variant': 'On the root: the resolved `variant`.',
	'data-size': 'On the root: the resolved `size`.',
	'data-density': 'On the root: the resolved `density`.',
	'data-peek':
		'On the layout wrapper: `true` while a hover peek shows the collapsed panel at full width.',
	'data-active': 'On a row: `true` while it is the current page (`isActive`).',
	'data-active-variant': 'On a row: the resolved `activeVariant`.',
	'data-open':
		'On the toggle of a collapsible group, a submenu or a tree branch, and on its panel: present while it is open.',
	'data-closed':
		'On the toggle of a collapsible group, a submenu or a tree branch, and on its panel: present while it is closed, including during the exit transition.',
	'data-entering':
		'On a group, submenu or tree branch panel: present while its opening animation plays.',
	'data-exiting':
		'On a group, submenu or tree branch panel: present while its closing animation plays.',
	'data-popup-open':
		'On a row: present while one of its popups is open, its `menu`, its flyout on the collapsed rail, or its tooltip (every row on the collapsed rail, and every row with `tooltips="always"`). Match `[aria-expanded="true"]` to style an open menu or flyout only.',
	'data-sidebar': 'The part (`sidebar`, `menu-button`, `menu-sub`, `group-content`, `rail`, ...).'
} as const;

/** The name of a Sidebar data attribute. */
export type SidebarDataAttribute = keyof typeof sidebarDataAttributes;

export const sidebarCssVariables = {
	'--sidebar-width': 'On the root: the expanded panel width.',
	'--sidebar-width-icon': 'On the root: the width of the collapsed icon rail.',
	'--sidebar-width-mobile': 'On the root: the width of the mobile drawer.',
	'--sidebar-suffix-width':
		"On a row with a `suffix` (its `menu-item` row wrapper or `menu-sub-item`): the suffix's measured width in px, reserved at the row's end so the label truncates before it.",
	'--disclosure-panel-height':
		'On a group, submenu or tree branch panel: its measured height in px while it animates, `auto` once open and `0px` once closed.'
} as const;

/** The name of a Sidebar CSS variable. */
export type SidebarCssVariable = keyof typeof sidebarCssVariables;
