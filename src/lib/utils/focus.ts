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

/**
 * Whether the element can take focus right now: a focusable kind of element that is enabled,
 * rendered and not inside an `inert`, `hidden` or `aria-hidden` subtree. Unlike `isTabbable` it
 * accepts `tabindex="-1"`, the kind of target focus restoration may land on.
 */
export function isFocusable(element: HTMLElement): boolean {
	if (!element.isConnected || !element.matches(focusableSelector)) return false;
	if (element.matches(':disabled')) return false;
	if (element.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
	if (element.getClientRects().length === 0) return false;
	const style = getComputedStyle(element);
	return style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

export function isTabbable(element: HTMLElement): boolean {
	if (element.tabIndex < 0 || element.matches(':disabled')) return false;
	if (element.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
	if (element.getClientRects().length === 0) return false;
	const style = getComputedStyle(element);
	return style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

/**
 * The element that really has focus: `root.activeElement` stops at a shadow host, so this looks
 * inside open shadow roots until it reaches the focused element. Like `activeElement`, it is
 * `<body>` when nothing is focused. It is an `Element`, not only an `HTMLElement`: an SVG element
 * with a `tabindex` takes focus too, and must not read as "nothing is focused".
 */
export function getDeepActiveElement(root: Document | ShadowRoot = document): Element | null {
	let active: Element | null = root.activeElement;
	while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
	return active;
}

/**
 * `container.contains(node)` across shadow boundaries: an element inside a shadow root belongs to
 * the container when its host does.
 */
export function composedContains(container: Node, node: Node | null): boolean {
	let current: Node | null = node;
	while (current) {
		if (current === container) return true;
		current = current.parentNode ?? (current as ShadowRoot).host ?? null;
	}
	return false;
}

/**
 * Whether the page runs in WebKit (Safari, and every browser on iOS) rather than Chromium or
 * Gecko. Safari is the only engine whose `navigator.vendor` is Apple's.
 */
export function isWebKit(): boolean {
	return typeof navigator !== 'undefined' && /Apple/i.test(navigator.vendor ?? '');
}

const TEXT_INPUT_TYPES = new Set([
	'text',
	'search',
	'email',
	'url',
	'tel',
	'password',
	'number',
	''
]);

/** Whether typing goes into the element: a text input, a textarea or an editable region. */
export function isTextField(element: Element | null): element is HTMLElement {
	if (!(element instanceof HTMLElement)) return false;
	if (element instanceof HTMLTextAreaElement) return true;
	if (element instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(element.type);
	return (
		element.isContentEditable === true ||
		element.matches('[contenteditable]:not([contenteditable="false"])')
	);
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

/**
 * The first tabbable element that follows `reference` in document order, skipping its own
 * descendants and everything inside `exclude`. `boundary` limits the search to one subtree (a
 * parent popover's panel). `null` when nothing follows.
 */
export function getTabbableAfter(
	reference: HTMLElement,
	{
		exclude,
		boundary = reference.ownerDocument.body
	}: { exclude?: HTMLElement | null; boundary?: HTMLElement | null } = {}
): HTMLElement | null {
	if (!boundary) return null;
	let next: HTMLElement | null = null;
	for (const element of getTabbableElements(boundary)) {
		if (exclude && composedContains(exclude, element)) continue;
		const position = reference.compareDocumentPosition(element);
		if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) continue;
		if (!(position & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
		// The tabbable list puts positive tabindex first; the nearest one in the page wins here.
		if (!next || next.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)
			next = element;
	}
	return next;
}
