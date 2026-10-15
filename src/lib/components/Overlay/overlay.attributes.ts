/**
 * The styling hooks an Overlay exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value.
 */
export const overlayDataAttributes = {
	'data-open': 'On the root: present while open (shown, or ready to show on hover or focus).',
	'data-closed': 'On the root: present while closed, including during the exit transition.',
	'data-entering': 'On the root: present while the opening transition plays.',
	'data-exiting': 'On the root: present while the closing transition plays.',
	'data-show-on': 'On the root: `always`, `hover` or `focus`, the resolved `showOn`.',
	'data-position': 'On the root: the resolved `position`.',
	'data-entasis-overlay': 'On the root: always present; marks the overlay inside its container.',
	'data-overlay-content': 'On the content panel: always present.'
} as const;

/** The name of an Overlay data attribute. */
export type OverlayDataAttribute = keyof typeof overlayDataAttributes;
