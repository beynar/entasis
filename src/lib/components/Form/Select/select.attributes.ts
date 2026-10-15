import { popoverCssVariables } from '../../Popover/popover.attributes.js';

/**
 * The styling hooks a Select exposes. Attributes are presence attributes (set while the state
 * holds, omitted otherwise) unless the description says they carry a value. The list sits in a
 * Popover panel, whose `data-open`, `data-closed`, `data-entering` and `data-exiting` it also
 * carries, and whose CSS variables are `selectCssVariables`.
 */
export const selectDataAttributes = {
	'data-popup-open':
		'On the trigger button and the field container around it: present while the list is open.',
	'data-placeholder': 'On the trigger: present while no value is chosen and the placeholder shows.',
	'data-disabled':
		'On the trigger: present while disabled. On an option: present while it is disabled.',
	'data-readonly': 'On the trigger: present while `readOnly`.',
	'data-popup-side':
		'On the field container: `none` while the list is placed over the trigger, otherwise the side it sits on.',
	'data-highlighted': 'On an option: present while the keyboard or the pointer highlights it.',
	'data-selected': 'On an option: present while it is selected.',
	'data-open': 'On the list panel: present while open.',
	'data-closed': 'On the list panel: present while its exit transition plays.',
	'data-entering': 'On the list panel: present while the enter transition plays.',
	'data-exiting': 'On the list panel: present while the exit transition plays.',
	'data-side':
		'On the list panel: `none` while it is placed over the trigger (aligned on the selected option), otherwise the side of the trigger it sits on.'
} as const;

/** The name of a Select data attribute. */
export type SelectDataAttribute = keyof typeof selectDataAttributes;

/**
 * The CSS variables a placement writes on the list panel's positioned wrapper, inherited by the
 * list: the Popover set (`popoverCssVariables`). The dropdown list caps its height with
 * `--available-height`; the mobile sheet has none.
 */
export const selectCssVariables = popoverCssVariables;

/** The name of a Select CSS variable. */
export type SelectCssVariable = keyof typeof selectCssVariables;
