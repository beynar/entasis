/**
 * The styling hooks a Menu exposes. Attributes are presence attributes (set while the state
 * holds, omitted otherwise) unless the description says they carry a value. A popup menu
 * (PopupMenu, ContextMenu, a submenu) is a Popover panel: it also carries `data-open`,
 * `data-closed`, `data-entering`, `data-exiting`, `data-side` and `data-align`, and the CSS
 * variables of `popoverCssVariables` (from `entasis/popover`).
 */
export const menuDataAttributes = {
	'data-highlighted':
		'On a row: present while the keyboard or the pointer highlights it (the roving tab stop).',
	'data-disabled': 'On a row: present while it is disabled.',
	'data-selected': 'On a checkbox, radio or option row: present while it is checked or selected.',
	'data-popup-open': 'On a submenu row: present while its submenu is open.',
	'data-popup-side': "On a submenu row: the submenu's `data-side` while it is placed.",
	'data-open': 'On a popup menu or submenu panel: present while open.',
	'data-closed': 'On a popup menu or submenu panel: present while its exit transition plays.',
	'data-entering': 'On a popup menu or submenu panel: present while the enter transition plays.',
	'data-exiting': 'On a popup menu or submenu panel: present while the exit transition plays.',
	'data-side':
		'On a popup menu or submenu panel: the side of its trigger it sits on after flipping.',
	'data-align': 'On a popup menu or submenu panel: `start`, `center` or `end`.',
	'data-size': 'On the root and the list: the resolved `size`.',
	'data-density': 'On the root and the list: the resolved `density`.'
} as const;

/** The name of a Menu data attribute. */
export type MenuDataAttribute = keyof typeof menuDataAttributes;
