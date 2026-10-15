/**
 * The styling hooks an Accordion exposes. Attributes are presence attributes (`''` while the
 * state holds, omitted otherwise) unless the description says they carry a value.
 */
export const accordionDataAttributes = {
	'data-open':
		"On an item, its trigger, its panel and the panel's content: present while the item is expanded.",
	'data-closed':
		"On an item, its trigger, its panel and the panel's content: present while the item is collapsed, including during the exit transition.",
	'data-entering': 'On a panel: present while its opening animation plays.',
	'data-exiting': 'On a panel: present while its closing animation plays.',
	'data-disabled': 'On an item and its trigger: present while the item is disabled.',
	'data-state':
		'On a trigger: `open` or `closed` (kept for compatibility; prefer `data-open` / `data-closed`).',
	'data-index': 'On an item and its trigger: the item index.',
	'data-slot':
		'The part: `accordion`, `accordion-item`, `accordion-trigger`, `accordion-icon-wrapper` or `accordion-panel`.',
	'data-size': 'On the root: the resolved `size`.',
	'data-density': 'On the root: the resolved `density`.',
	'data-variant': 'On the root: the resolved `variant`.'
} as const;

/** The name of an Accordion data attribute. */
export type AccordionDataAttribute = keyof typeof accordionDataAttributes;

export const accordionCssVariables = {
	'--disclosure-panel-height':
		'On a panel: its measured height in px while it animates, `auto` once open and `0px` once closed.'
} as const;

/** The name of an Accordion CSS variable. */
export type AccordionCssVariable = keyof typeof accordionCssVariables;
