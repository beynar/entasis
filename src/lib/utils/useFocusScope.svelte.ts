// The one focus primitive every overlay uses: initial focus on open, Tab containment for
// modal scopes, `inert` on the rest of the page for modal scopes, and focus restoration
// to the opener when the scope goes away. Radix calls this FocusScope.
import { on } from 'svelte/events';
import { tick, untrack } from 'svelte';
import {
	composedContains,
	getDeepActiveElement,
	getTabbableElements,
	isFocusable,
	isTextField,
	isWebKit,
	resolveInitialFocus
} from './focus.js';
import { findFocusFallback, installFocusHistory } from './focusHistory.js';
import type { OpenChangeDetails } from './openChange.js';

/**
 * Where focus goes when an overlay closes. `true` (or nothing) restores it to the opener, else the
 * most recent element still on the page; `false` leaves focus alone; an element receives it. A
 * function is called with the details of the change that closed the overlay (`null` when it
 * closed without one) and returns any of these; returning nothing restores as usual.
 */
export type FocusOnClose =
	| boolean
	| HTMLElement
	| null
	| ((details: OpenChangeDetails | null) => HTMLElement | boolean | null | void);

export interface FocusScopeOptions {
	/** Scope is live (typically: it is the topmost layer of its kind). */
	isActive: () => boolean;
	/** Contain Tab / Shift+Tab inside the node. Default: `isActive`. */
	trap?: () => boolean;
	/**
	 * `'first'` (default) → `[autofocus]`/`[data-autofocus]`, else first tabbable, else the
	 * container; `'container'` → the node itself; an element → that element; `false` → none.
	 */
	initialFocus?: () => HTMLElement | 'first' | 'container' | false;
	/** Return focus to the opener when the scope ends. Default `true`. */
	restoreFocus?: () => boolean;
	/** Explicit element to return focus to; default is whatever was focused on attach. */
	returnTo?: () => HTMLElement | null;
	/** Mark every sibling subtree up to `<body>` `inert` while active (modal scopes). */
	inertSiblings?: () => boolean;
	/** The owner's `focusOnClose` choice; see `FocusOnClose`. Wins over `restoreFocus`. */
	focusOnClose?: () => FocusOnClose | undefined;
	/**
	 * The change that closed the overlay. A close by Escape or from the keyboard returns focus
	 * with a visible focus ring, and `focusOnClose` functions receive it.
	 */
	closeDetails?: () => OpenChangeDetails | null;
}

/** What `focusOnClose` resolves to for one close: leave focus, restore as usual, or this element. */
export function resolveFocusOnClose(
	choice: FocusOnClose | undefined,
	details: OpenChangeDetails | null
): false | 'default' | HTMLElement {
	const value = typeof choice === 'function' ? choice(details) : choice;
	if (value === false) return false;
	return value instanceof HTMLElement ? value : 'default';
}

// `inert` refcount per element so stacked modals release it in any order.
const inertCounts = new WeakMap<Element, number>();
const makeInert = (element: Element) => {
	const count = inertCounts.get(element) ?? 0;
	if (count === 0) element.setAttribute('inert', '');
	inertCounts.set(element, count + 1);
};
const releaseInert = (element: Element) => {
	const count = inertCounts.get(element) ?? 0;
	if (count <= 1) {
		inertCounts.delete(element);
		element.removeAttribute('inert');
	} else {
		inertCounts.set(element, count - 1);
	}
};

/** Whether focus is on `<body>`, or inside the node (shadow roots included). */
const isFocusInside = (node: HTMLElement) => {
	const doc = node.ownerDocument;
	const active = getDeepActiveElement(doc);
	return !active || active === doc.body || composedContains(node, active);
};

/** A live scope, for the ones stacked above and below it to find each other. */
interface ScopeRecord {
	node: HTMLElement;
	isActive: () => boolean;
	/** The last element that had focus inside the scope, while it is still usable. */
	lastFocused: () => HTMLElement | null;
}

/** Mounted scopes, in the order they last became active (the newest is last). */
const scopes: ScopeRecord[] = [];

const usable = (element: HTMLElement | null): element is HTMLElement =>
	!!element && element.isConnected && !element.closest('[inert]') && isFocusable(element);

export function useFocusScope(options: FocusScopeOptions) {
	let node: HTMLElement | null = null;
	let returnTarget: HTMLElement | null = null;
	let restored = false;
	/** Initial focus is applied once per mount: a later re-activation leaves focus where it is. */
	let initialFocusDone = false;
	let lastFocusedInside: HTMLElement | null = null;
	/** Releases the `inert` this scope set on the page behind it; idempotent. */
	let releaseSiblings: () => void = () => {};

	/** A close by Escape or from the keyboard shows the focus ring where focus lands. */
	const focusVisibleOnClose = () => {
		const details = options.closeDetails?.() ?? null;
		return details?.reason === 'escape-key' || details?.interaction === 'keyboard';
	};

	const focusElement = (element: HTMLElement, focusVisible = false) => {
		// `focusVisible` makes engines that do not infer a focus ring from the last input (Firefox,
		// Safari after a pointer open) show it; engines that do not know the option ignore it. It is
		// left out otherwise: `false` would suppress the ring a keyboard user is owed.
		element.focus({
			preventScroll: true,
			...(focusVisible ? { focusVisible } : {})
		} as FocusOptions);
	};

	/**
	 * Where focus goes when the scope's own target is gone: the last element that had focus in the
	 * scope still showing below this one (a Dialog under a closing Confirmation), else the most
	 * recent element in the focus history that is still on the page.
	 */
	const fallbackTarget = (scope: HTMLElement): HTMLElement | null => {
		for (let index = scopes.length - 1; index >= 0; index -= 1) {
			const other = scopes[index];
			if (other.node === scope || !other.node.isConnected || !other.isActive()) continue;
			const candidate = other.lastFocused();
			if (usable(candidate) && !composedContains(scope, candidate)) return candidate;
		}
		return findFocusFallback(scope.ownerDocument, { exclude: scope });
	};

	/**
	 * Idempotent; only moves focus when it is still on `<body>` or inside the scope. The page
	 * behind is released first: an `inert` opener cannot take focus, and a close that is
	 * reported once its transition ends runs this before the node is torn down.
	 */
	const restore = () => {
		if (restored) return;
		restored = true;
		releaseSiblings();
		const scope = node;
		if (!scope) return;
		// Safari scrolls the page when a focused text field leaves the document: let go of it
		// while it is still mounted.
		const active = getDeepActiveElement(scope.ownerDocument);
		if (isWebKit() && active && composedContains(scope, active) && isTextField(active)) {
			active.blur();
		}
		const choice = resolveFocusOnClose(options.focusOnClose?.(), options.closeDetails?.() ?? null);
		if (choice === false) return;
		if (choice === 'default' && !(options.restoreFocus?.() ?? true)) return;
		if (!isFocusInside(scope)) return;
		const target =
			choice !== 'default'
				? choice
				: [options.returnTo?.() ?? null, returnTarget].find(usable) || fallbackTarget(scope);
		returnTarget = null;
		if (usable(target)) focusElement(target, focusVisibleOnClose());
	};

	const applyInitialFocus = (target: HTMLElement) => {
		const mode = options.initialFocus?.() ?? 'first';
		if (mode === false) return;
		const element =
			mode === 'first' ? resolveInitialFocus(target) : mode === 'container' ? target : mode;
		if (element === target && target.tabIndex < 0) target.tabIndex = -1;
		element.focus({ preventScroll: true });
	};

	const insideOtherScope = (element: HTMLElement) =>
		scopes.some(
			(other) => other.node !== node && other.isActive() && composedContains(other.node, element)
		);

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!node || event.key !== 'Tab' || event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey) return;
		if (!(options.trap?.() ?? options.isActive())) return;
		const doc = node.ownerDocument;
		const active = getDeepActiveElement(doc);
		const inside = !!active && composedContains(node, active);
		// A panel opened from inside the scope (a popover over a dialog) handles its own Tab.
		if (active && !inside && insideOtherScope(active)) return;
		const tabbable = getTabbableElements(node);
		if (tabbable.length === 0) {
			event.preventDefault();
			node.focus();
			return;
		}
		const index = active ? tabbable.indexOf(active) : -1;
		const edge = event.shiftKey ? tabbable[tabbable.length - 1] : tabbable[0];
		let next: HTMLElement;
		if (index >= 0) {
			// Move focus ourselves rather than trusting the engine's Tab order: WebKit without
			// Full Keyboard Access skips buttons, which would let Tab leave the scope.
			const step = event.shiftKey ? index - 1 : index + 1;
			next = tabbable[(step + tabbable.length) % tabbable.length];
		} else if (!inside || active === node) {
			next = edge;
		} else {
			// Focus is on something the list does not know (a roving item, an element in a shadow
			// root): the engine moves it, unless nothing tabbable lies ahead, which would leave.
			const ahead = tabbable.some((element) => {
				const position = active.compareDocumentPosition(element);
				return event.shiftKey
					? position & Node.DOCUMENT_POSITION_PRECEDING
					: position & Node.DOCUMENT_POSITION_FOLLOWING;
			});
			if (ahead) return;
			next = edge;
		}
		event.preventDefault();
		next.focus();
	};

	const attachment = (target: HTMLElement) => {
		return untrack(() => {
			node = target;
			restored = false;
			initialFocusDone = false;
			const doc = target.ownerDocument;
			const active = getDeepActiveElement(doc);
			returnTarget = active && active !== doc.body ? active : null;
			lastFocusedInside = active && composedContains(target, active) ? active : null;
			if (target.tabIndex < 0) target.tabIndex = -1;

			const record: ScopeRecord = {
				node: target,
				isActive: () => options.isActive(),
				lastFocused: () => lastFocusedInside
			};
			scopes.push(record);

			const inerted: Element[] = [];
			releaseSiblings = () => inerted.splice(0).forEach(releaseInert);
			const cleanups: Array<() => void> = [
				installFocusHistory(doc),
				on(doc, 'keydown', handleKeyDown),
				// Remember where focus last was inside, for the scope below to hand focus back to.
				on(target, 'focusin', (event) => {
					const origin = event.composedPath()[0] ?? event.target;
					if (origin instanceof HTMLElement) lastFocusedInside = origin;
				}),
				// A focused element that is disabled or removed drops focus with no new target; it is
				// still the best place to return to if it comes back.
				on(target, 'focusout', (event) => {
					const origin = event.composedPath()[0] ?? event.target;
					if (!event.relatedTarget && origin instanceof HTMLElement) lastFocusedInside = origin;
				})
			];

			$effect(() => {
				const active = options.isActive();
				if (!active) return;
				// The newest active scope is the last one: a scope that becomes active again after the
				// one above it closed is the next to receive focus.
				const position = scopes.indexOf(record);
				if (position >= 0) scopes.push(...scopes.splice(position, 1));
				// Wait for the intro to mount children before picking the initial target.
				let cancelled = false;
				void tick().then(() => {
					if (cancelled || !node || initialFocusDone) return;
					initialFocusDone = true;
					const current = getDeepActiveElement(node.ownerDocument);
					if (!current || !composedContains(node, current)) applyInitialFocus(node);
				});
				if (options.inertSiblings?.()) {
					let current: Element | null = target;
					while (current && current !== target.ownerDocument.body) {
						const parent: Element | null = current.parentElement;
						if (!parent) break;
						for (const sibling of parent.children) {
							if (sibling === current || sibling.hasAttribute('data-live-region')) continue;
							if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
							makeInert(sibling);
							inerted.push(sibling);
						}
						current = parent;
					}
				}
				return () => {
					cancelled = true;
					releaseSiblings();
				};
			});

			return () => {
				cleanups.forEach((cleanup) => cleanup());
				releaseSiblings();
				restore();
				const at = scopes.indexOf(record);
				if (at >= 0) scopes.splice(at, 1);
				node = null;
			};
		});
	};

	return { attachment, restore };
}
