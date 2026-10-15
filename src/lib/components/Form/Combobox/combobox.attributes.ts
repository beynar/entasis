/**
 * The styling hooks a Combobox exposes. Attributes are presence attributes (set while the state
 * holds, omitted otherwise) unless the description says they carry a value. The list sits in a
 * Popover panel, whose CSS variables (`popoverCssVariables`, from `entasis/popover`) it inherits.
 */
export const comboboxDataAttributes = {
	'data-popup-open':
		'On the input and the field container around it: present while the list (or its empty, loading or error status) shows.',
	'data-popup-side': 'On the field container: the side of the field the list sits on.',
	'data-disabled':
		'On the input: present while disabled. On an option: present while it is disabled.',
	'data-highlighted': 'On an option: present while the keyboard or the pointer highlights it.',
	'data-selected': 'On an option: present while it is the value.',
	'data-open': 'On the list panel: present while open.',
	'data-closed': 'On the list panel: present while its exit transition plays.',
	'data-entering': 'On the list panel: present while the enter transition plays.',
	'data-exiting': 'On the list panel: present while the exit transition plays.',
	'data-side': 'On the list panel: the side of the field it sits on after flipping.',
	'data-align': 'On the list panel: `start`, `center` or `end`.'
} as const;

/** The name of a Combobox data attribute. */
export type ComboboxDataAttribute = keyof typeof comboboxDataAttributes;
