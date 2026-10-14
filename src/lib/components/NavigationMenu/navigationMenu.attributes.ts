import { stateDataAttributes } from '$lib/utils/stateAttributes.js';

/**
 * The styling hooks a NavigationMenu exposes. Attributes are presence attributes (`''` while the
 * state holds, omitted otherwise) unless the description says they carry a value.
 */
export const navigationMenuDataAttributes = {
	'data-open': `On the root, the popup and the open panel: ${stateDataAttributes['data-open'].toLowerCase()}`,
	'data-closed': `On the root, the popup and a closed panel: ${stateDataAttributes['data-closed'].toLowerCase()}`,
	'data-entering': `On the popup: ${stateDataAttributes['data-entering'].toLowerCase()}`,
	'data-exiting': `On the popup: ${stateDataAttributes['data-exiting'].toLowerCase()}`,
	'data-popup-open': `On a panel trigger: ${stateDataAttributes['data-popup-open'].toLowerCase()}`,
	'data-disabled': 'On a disabled panel trigger, link or nested trigger: present while disabled.',
	'data-selected': 'On a link of the current page (the one with `active`): present while it is.',
	'data-side':
		'On the viewport and the popup: always `bottom`, the side of the triggers the popup sits on.',
	'data-align':
		'On the viewport and the popup: always `start`, how the popup lines up with the active trigger.',
	'data-activation-direction':
		'On a panel that replaced another: `left` or `right`, the physical direction its trigger lies in from the previously open one (a later trigger is on the right in left-to-right). Absent when the panel was opened from closed.'
} as const;

/** The name of a NavigationMenu data attribute. */
export type NavigationMenuDataAttribute = keyof typeof navigationMenuDataAttributes;

export const navigationMenuCssVariables = {
	'--anchor-width': "On the viewport: the width in px of the open panel's trigger.",
	'--anchor-height': "On the viewport: the height in px of the open panel's trigger."
} as const;

/** The name of a NavigationMenu CSS variable. */
export type NavigationMenuCssVariable = keyof typeof navigationMenuCssVariables;
