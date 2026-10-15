/**
 * The styling hooks a tooltip exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value. The surface is the
 * `role="tooltip"` element a tooltip's `class` and theme style.
 */
export const tooltipDataAttributes = {
	'data-open': 'On the surface: present while the tooltip shows.',
	'data-closed': 'On the surface: present while its exit transition plays.',
	'data-entering': 'On the surface: present while the enter transition plays.',
	'data-exiting': 'On the surface: present while the exit transition plays.',
	'data-side':
		'On the surface: the side of the trigger it sits on after flipping, `top`, `right`, `bottom` or `left`.',
	'data-align': 'On the surface: `start`, `center` or `end`, how it lines up with the trigger.',
	'data-anchor-hidden': 'On the surface: present while the trigger is scrolled out of view.',
	'data-instant':
		'On the surface: present while it moved straight from one trigger to another, which plays no transition.',
	'data-color': 'On the surface: the resolved `color`.',
	'data-size': 'On the surface: the resolved `size`.',
	'data-variant': 'On the surface: the resolved `variant`.',
	'data-popup-open': 'On the trigger: present while its tooltip shows.',
	'data-popup-side': "On the trigger: the surface's `data-side` while it is placed."
} as const;

/** The name of a tooltip data attribute. */
export type TooltipDataAttribute = keyof typeof tooltipDataAttributes;

/** Written by the placement on the positioned wrapper and inherited by the surface. */
export const tooltipCssVariables = {
	'--available-width':
		'The width in px the surface can take before it reaches the viewport edges, minus 20px.',
	'--available-height':
		"The room in px between the trigger and the viewport edge on the surface's side, minus 20px.",
	'--anchor-width': "The trigger's width in px, snapped to the device pixel grid.",
	'--anchor-height': "The trigger's height in px, snapped to the device pixel grid.",
	'--transform-origin': 'The surface corner facing the trigger, the point it scales from.'
} as const;

/** The name of a tooltip CSS variable. */
export type TooltipCssVariable = keyof typeof tooltipCssVariables;
