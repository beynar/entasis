// The indent effect: while a modal dialog is open, `<html>` carries a hook for the page behind to
// move back (scale and round the app shell behind a sheet) and the stack's depth, with nothing
// the page has to measure.

/** Attribute on `<html>` while at least one modal dialog is open. */
export const DIALOG_OPEN_ATTRIBUTE = 'data-dialog-open';
/** Custom property on `<html>`: how many modal dialogs are open (`1` for a single sheet). */
export const DIALOG_DEPTH_VARIABLE = '--dialog-depth';

/** Writes the hooks for `depth` open modal dialogs on `root`; the returned function removes them. */
export const applyDialogIndent = (root: HTMLElement, depth: number) => {
	root.setAttribute(DIALOG_OPEN_ATTRIBUTE, '');
	root.style.setProperty(DIALOG_DEPTH_VARIABLE, String(depth));
	return () => {
		root.removeAttribute(DIALOG_OPEN_ATTRIBUTE);
		root.style.removeProperty(DIALOG_DEPTH_VARIABLE);
	};
};
