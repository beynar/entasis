/**
 * The styling hooks a Popover exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value. Components built on
 * Popover (Select, Combobox, Menu, HoverCard, Tooltip) inherit them.
 */
export const popoverDataAttributes = {
	'data-open': 'On the panel: present while open.',
	'data-closed':
		'On the panel: present while its exit transition plays (a closed panel is not rendered).',
	'data-entering': 'On the panel: present while the enter transition plays.',
	'data-exiting': 'On the panel: present while the exit transition plays.',
	'data-side':
		'On the panel: the side of the trigger it sits on after flipping, `top`, `right`, `bottom` or `left`; `inline-start` / `inline-end` when a logical side was requested; `none` when `positionPanel` placed it. On the arrow: the physical side of the panel it sits on.',
	'data-align':
		'On the panel: `start`, `center` or `end`, how it lines up with the trigger (absent with `data-side="none"`).',
	'data-anchor-hidden':
		'On the panel: present while the trigger is scrolled out of view; the panel is hidden meanwhile.',
	'data-uncentered':
		'On the arrow: present while the trigger is not under the middle of the panel (a shift moved the panel).',
	'data-popup-open':
		'On the element the panel is anchored to (the trigger that opened it, or the `ref` element): present while the popover is open.',
	'data-popup-side':
		"On the element the panel is anchored to: the panel's `data-side` while it is placed, so a theme can flatten the corner the panel attaches to."
} as const;

/** The name of a Popover data attribute. */
export type PopoverDataAttribute = keyof typeof popoverDataAttributes;

/**
 * The CSS variables a placement writes on the positioned wrapper, inherited by the panel and its
 * content. A floating panel only; an inline panel and the mobile sheet have none.
 */
export const popoverCssVariables = {
	'--available-width':
		'The width in px the panel can take before it reaches the viewport edges, minus 20px.',
	'--available-height':
		"The room in px between the trigger and the viewport edge on the panel's side, minus 20px. Cap a scrolling list with `max-height: min(240px, var(--available-height))`.",
	'--anchor-width': "The trigger's width in px, snapped to the device pixel grid.",
	'--anchor-height': "The trigger's height in px, snapped to the device pixel grid.",
	'--transform-origin':
		'The panel corner facing the trigger, mirrored in right-to-left documents; the point the panel scales from.'
} as const;

/** The name of a Popover CSS variable. */
export type PopoverCssVariable = keyof typeof popoverCssVariables;
