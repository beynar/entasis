/**
 * The styling hooks a Collapsible exposes. Attributes are presence attributes (`''` while the
 * state holds, omitted otherwise) unless the description says they carry a value.
 */
export const collapsibleDataAttributes = {
	'data-open': 'On the root, the trigger, the panel and the content: present while open.',
	'data-closed':
		'On the root, the trigger, the panel and the content: present while closed, including during the exit transition.',
	'data-entering':
		'On the root and the panel (`variant="peek"` has no separate panel): present while the opening animation plays.',
	'data-exiting':
		'On the root and the panel (`variant="peek"` has no separate panel): present while the closing animation plays.',
	'data-disabled': 'On the root, the trigger, the panel and the content: present while `disabled`.',
	'data-state':
		'On the root, the trigger, the panel and the content: `open` or `closed` (kept for compatibility; prefer `data-open` / `data-closed`).',
	'data-size': 'On the root: the resolved `size`.',
	'data-variant': 'On the root: `peek` with `variant="peek"`.'
} as const;

/** The name of a Collapsible data attribute. */
export type CollapsibleDataAttribute = keyof typeof collapsibleDataAttributes;

export const collapsibleCssVariables = {
	'--disclosure-panel-height':
		'On the panel: its measured height in px while it animates, `auto` once open and `0px` once closed.'
} as const;

/** The name of a Collapsible CSS variable. */
export type CollapsibleCssVariable = keyof typeof collapsibleCssVariables;
