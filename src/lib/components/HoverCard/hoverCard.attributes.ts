/**
 * The styling hooks a HoverCard exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value. The card is a
 * Popover panel, so its CSS variables are `popoverCssVariables` (from `entasis/popover`).
 */
export const hoverCardDataAttributes = {
	'data-open': 'On the card: present while open.',
	'data-closed': 'On the card: present while its exit transition plays.',
	'data-entering': 'On the card: present while the enter transition plays.',
	'data-exiting': 'On the card: present while the exit transition plays.',
	'data-side':
		'On the card: the side of the trigger it sits on after flipping, `top`, `right`, `bottom` or `left`.',
	'data-align': 'On the card: `start`, `center` or `end`, how it lines up with the trigger.',
	'data-anchor-hidden': 'On the card: present while the trigger is scrolled out of view.',
	'data-state':
		'On the trigger: `open` or `closed` (kept for compatibility; prefer `data-popup-open`).',
	'data-popup-open': 'On the trigger: present while the card is open.',
	'data-popup-side': "On the trigger: the card's `data-side` while it is placed.",
	'data-disabled': 'On the trigger: present while `disabled`.'
} as const;

/** The name of a HoverCard data attribute. */
export type HoverCardDataAttribute = keyof typeof hoverCardDataAttributes;
