// Pure DOM helpers for focus management. No runes, no listeners — shared by
// `useFocusScope`, menus and anything else that needs to know what can take focus.
export const focusableSelector = [
	'a[href]',
	'area[href]',
	'button',
	'input:not([type="hidden"])',
	'select',
	'textarea',
	'iframe',
	'object',
	'embed',
	'audio[controls]',
	'video[controls]',
	'summary',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]'
].join(',');

export function isTabbable(element: HTMLElement): boolean {
	if (element.tabIndex < 0 || element.matches(':disabled')) return false;
	if (element.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
	if (element.getClientRects().length === 0) return false;
	const style = getComputedStyle(element);
	return style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

/** Tabbable descendants in tab order (positive tabindex first, one radio per group). */
export function getTabbableElements(node: HTMLElement): HTMLElement[] {
	const visible = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter(
		isTabbable
	);
	const radioGroups = new Map<HTMLFormElement | null, Map<string, HTMLInputElement>>();
	for (const element of visible) {
		if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name)
			continue;
		let formGroups = radioGroups.get(element.form);
		if (!formGroups) radioGroups.set(element.form, (formGroups = new Map()));
		const current = formGroups.get(element.name);
		if (!current || element.checked) formGroups.set(element.name, element);
	}
	const elements = visible.filter((element) => {
		if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name)
			return true;
		return radioGroups.get(element.form)?.get(element.name) === element;
	});
	const positive = elements
		.filter((element) => element.tabIndex > 0)
		.sort((left, right) => left.tabIndex - right.tabIndex);
	return [...positive, ...elements.filter((element) => element.tabIndex === 0)];
}

export const getFirstTabbable = (node: HTMLElement) => getTabbableElements(node)[0] ?? null;

/**
 * Where focus should land when a scope opens: an explicit `[autofocus]` /
 * `[data-autofocus]` target, else the first tabbable, else the container itself.
 */
export function resolveInitialFocus(node: HTMLElement): HTMLElement {
	const explicit = node.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
	if (explicit && isTabbable(explicit)) return explicit;
	// `data-autofocus-skip` marks chrome (a close button) that should not win by DOM order.
	const tabbable = getTabbableElements(node);
	return (
		tabbable.find((element) => !element.closest('[data-autofocus-skip]')) ?? tabbable[0] ?? node
	);
}
