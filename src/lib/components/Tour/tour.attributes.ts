/**
 * The styling hooks a Tour exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value. The step popup is a
 * Popover, so its panel also carries the Popover hooks (`data-side`, `data-align`, `data-open`…).
 */
export const tourDataAttributes = {
	'data-entasis-tour': 'On the backdrop root: always present; marks the layer the tour portals.',
	'data-open': 'On the backdrop root: present while the tour runs.',
	'data-closed': 'On the backdrop root: present while its exit transition plays.',
	'data-entering': 'On the backdrop root: present while the fade-in plays.',
	'data-exiting': 'On the backdrop root: present while the fade-out plays.',
	'data-resolving':
		"On the backdrop root and the popup panel: present while a step's `before` runs or its target is awaited (the panel is also `aria-busy`).",
	'data-instant':
		'On the backdrop root: present while the spotlight follows a scroll or a resize, so a CSS transition on the `--spotlight-*` variables can be skipped then. Absent while it glides to a new step.',
	'data-centered':
		'On the backdrop root: present while the step has no spotlight (a centred step, or a target scrolled out of view).',
	'data-modal': 'On the backdrop root: present while `modal` makes the rest of the page inert.',
	'data-step': 'On the backdrop root and the popup panel: the index of the current step.',
	'data-tour-target':
		"On the element the current step points at: present while it is highlighted, so a theme can style it (the popup's `data-popup-open` is there too)."
} as const;

/** The name of a Tour data attribute. */
export type TourDataAttribute = keyof typeof tourDataAttributes;

/**
 * The CSS variables the backdrop root carries, in px, updated as the spotlight moves: the box of
 * the hole in viewport coordinates and its corner radius. All `0px` without a spotlight.
 */
export const tourCssVariables = {
	'--spotlight-x': 'The left edge of the spotlight hole, in px from the viewport.',
	'--spotlight-y': 'The top edge of the spotlight hole, in px from the viewport.',
	'--spotlight-width': 'The width of the spotlight hole, in px (the target plus `padding`).',
	'--spotlight-height': 'The height of the spotlight hole, in px (the target plus `padding`).',
	'--spotlight-radius': 'The corner radius of the spotlight hole, in px.'
} as const;

/** The name of a Tour CSS variable. */
export type TourCssVariable = keyof typeof tourCssVariables;
