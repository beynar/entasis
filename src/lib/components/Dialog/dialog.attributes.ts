/**
 * The styling hooks a Dialog exposes. Attributes are presence attributes (`''` while the state
 * holds, omitted otherwise) unless the description says they carry a value.
 */
export const dialogDataAttributes = {
	'data-open':
		'On the root (`role="dialog"`), the panel and the shared backdrop: present while open.',
	'data-closed':
		'On the root, the panel and the backdrop: present while their exit transition plays (a closed dialog is not rendered).',
	'data-entering': 'On the root and the panel: present while the enter transition plays.',
	'data-exiting': 'On the root and the panel: present while the exit transition plays.',
	'data-type':
		'On the root and the panel: the type actually shown (`modal`, `drawerBottom`, ...), after responsive records and the mobile-sheet fallback resolve.',
	'data-modal': 'On the root: `true` or `false`, whether the dialog is modal.',
	'data-popup-open':
		'On the trigger (the built-in button, or an element with `dialog.trigger` / `dialog.reference`): present while the dialog is open.',
	'data-dialog-open': 'On `<html>`: present while at least one modal dialog is open.'
} as const;

/** The name of a Dialog data attribute. */
export type DialogDataAttribute = keyof typeof dialogDataAttributes;

export const dialogCssVariables = {
	'--dialog-depth':
		'On `<html>`: how many modal dialogs are open (`1` for a single sheet), for pages that scale back behind a sheet.',
	'--drawer-inset':
		'On the root: the gap between a drawer and the screen edge, from the `inset` prop or the theme.',
	'--drawer-edge-radius':
		"On a drawer's panel: the radius of its screen-edge corners, `0` while it touches the edge."
} as const;

/** The name of a Dialog CSS variable. */
export type DialogCssVariable = keyof typeof dialogCssVariables;
