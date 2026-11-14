// The one focus primitive every overlay uses: initial focus on open, Tab containment for
// modal scopes, `inert` on the rest of the page for modal scopes, and focus restoration
// to the opener when the scope goes away. Radix calls this FocusScope.
import { on } from 'svelte/events';
import { tick, untrack } from 'svelte';
import {
	composedContains,
	getDeepActiveElement,
	focusableSelector,
	getTabbableElements,
	isFocusable,
	isTabbable,
	isTextField,
	isWebKit,
	resolveInitialFocus
} from './focus.js';
import { findFocusFallback, installFocusHistory } from './focusHistory.js';
import type { OpenChangeDetails } from './openChange.js';
import { resolvePortalContainer } from '../attachments/portal.js';

/**
 * Where focus goes when an overlay closes. `true` (or nothing) restores it to the opener; when the
 * opener left the page, to the nearest tabbable element that survived where it was; else to the
 * most recent element still on the page. `false` leaves focus alone; an element receives it. A
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
	/** Whether the scope contains Tab right now. */
	traps: () => boolean;
	/** The last element that had focus inside the scope, while it is still usable. */
	lastFocused: () => HTMLElement | null;
}

/** Mounted scopes, in the order they last became active (the newest is last). */
const scopes: ScopeRecord[] = [];

/**
 * The node of the newest live scope that contains Tab and holds `element` (a modal dialog around a
 * popover's trigger), or `null`. Lets Tab that has nowhere to go inside a portaled panel wrap
 * within the modal instead of leaving it.
 */
export function findTrappingScope(element: Node): HTMLElement | null {
	for (let index = scopes.length - 1; index >= 0; index -= 1) {
		const scope = scopes[index];
		if (
			scope.node.isConnected &&
			scope.isActive() &&
			scope.traps() &&
			composedContains(scope.node, element)
		)
			return scope.node;
	}
	return null;
}

// Counts the `focus()` calls a closing overlay makes to give focus back. Their `focusin` events
// are dispatched inside the call, so a listener can tell restored focus from focus the user moved.
let restoringFocus = 0;

/**
 * Whether the focus event being dispatched right now comes from an overlay handing focus back to
 * its opener. Read it synchronously inside a `focus` or `focusin` listener: a tooltip does not
 * open for focus the page returned, only for focus the user moved.
 */
export const isRestoringFocus = () => restoringFocus > 0;

const usable = (element: HTMLElement | null): element is HTMLElement =>
	!!element && element.isConnected && !element.closest('[inert]') && isFocusable(element);

/** One ancestor of an element, with the siblings on either side of the branch leading to it. */
interface PlaceLevel {
	parent: Element | ShadowRoot;
	previous: Node | null;
	next: Node | null;
}

/**
 * Where `element` sits in the page, nearest ancestor first, up to (not including) the container
 * overlays portal into: past that point the neighbours are other popups or the whole page, not
 * the element's surroundings. Shadow roots are crossed through their host.
 */
const recordPlace = (element: HTMLElement): PlaceLevel[] => {
	const doc = element.ownerDocument;
	const stop = resolvePortalContainer(element);
	const levels: PlaceLevel[] = [];
	let branch: Node = element;
	for (;;) {
		const parent: Node | null = branch.parentNode;
		if (!parent || parent === stop || parent === doc.body || parent === doc.documentElement) break;
		if (!(parent instanceof Element) && !(parent instanceof ShadowRoot)) break;
		levels.push({ parent, previous: branch.previousSibling, next: branch.nextSibling });
		branch = parent instanceof ShadowRoot ? parent.host : parent;
	}
	return levels;
};

/**
 * The tabbable element nearest to where a removed element was: inside its closest ancestor that
 * is still on the page, the first one after it, else the last one before it. A row's "Delete"
 * menu that deleted the row hands focus to the next row's control, or the previous row's when it
 * was the last. Ancestors with nothing tabbable left are passed for the next one up.
 */
const nearestSurvivor = (
	place: PlaceLevel[],
	accept: (element: HTMLElement) => boolean
): HTMLElement | null => {
	const ok = (element: HTMLElement) => isTabbable(element) && accept(element);
	for (const { parent, previous, next } of place) {
		if (!parent.isConnected) continue;
		const all = Array.from(parent.querySelectorAll<HTMLElement>(focusableSelector));
		if (all.length === 0) continue;
		// A sibling that was removed with the element no longer says where it was.
		const after = next?.parentNode === parent ? next : null;
		const before = previous?.parentNode === parent ? previous : null;
		if (after) {
			const start = all.findIndex(
				(element) =>
					after === element ||
					after.contains(element) ||
					!!(after.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
			);
			if (start >= 0) {
				const found = all.slice(start).find(ok);
				if (found) return found;
			}
		}
		if (before) {
			for (let index = all.length - 1; index >= 0; index -= 1) {
				const element = all[index];
				const precedes =
					before === element ||
					before.contains(element) ||
					!!(before.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
				if (precedes && ok(element)) return element;
			}
		}
		const any = all.find(ok);
		if (any) return any;
	}
	return null;
};

export function useFocusScope(options: FocusScopeOptions) {
	let node: HTMLElement | null = null;
	let returnTarget: HTMLElement | null = null;
	/** The element focus was to return to when the scope mounted, and where it sat then. */
	let returnPlace: { element: HTMLElement; place: PlaceLevel[] } | null = null;
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
		restoringFocus += 1;
		try {
			element.focus({
				preventScroll: true,
				...(focusVisible ? { focusVisible } : {})
			} as FocusOptions);
		} finally {
			restoringFocus -= 1;
		}
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
	 * When the element focus was to return to has left the page (the row a menu deleted), the
	 * tabbable element nearest to where it was. Only for an element that is gone: one that is still
	 * there but disabled says nothing about its neighbours, and the focus history serves it better.
	 */
	const survivorTarget = (scope: HTMLElement): HTMLElement | null => {
		if (!returnPlace || returnPlace.element.isConnected) return null;
		return nearestSurvivor(
			returnPlace.place,
			(element) => usable(element) && !composedContains(scope, element)
		);
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
				: [options.returnTo?.() ?? null, returnTarget].find(usable) ||
					survivorTarget(scope) ||
					fallbackTarget(scope);
		returnTarget = null;
		returnPlace = null;
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

	const insideOtherScope = (element: Element) =>
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
		const index = active instanceof HTMLElement ? tabbable.indexOf(active) : -1;
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
			returnTarget = active instanceof HTMLElement && active !== doc.body ? active : null;
			// Remembered now, while the element is still on the page: by the time the scope closes,
			// the action that closed it may have removed it with its surroundings.
			const returning = [options.returnTo?.() ?? null, returnTarget].find(
				(element): element is HTMLElement => !!element?.isConnected
			);
			returnPlace =
				returning && !composedContains(target, returning)
					? { element: returning, place: recordPlace(returning) }
					: null;
			lastFocusedInside =
				active instanceof HTMLElement && composedContains(target, active) ? active : null;
			if (target.tabIndex < 0) target.tabIndex = -1;

			const record: ScopeRecord = {
				node: target,
				isActive: () => options.isActive(),
				traps: () => options.trap?.() ?? options.isActive(),
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
				// An owner may restore as its close begins (a Popover does, before its outro makes the
				// panel inert). Reopened before the outro ended, the same mounted scope must restore
				// again when it next closes.
				restored = false;
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
					// Up to <body>, through the host of every shadow root on the way: a dialog portaled
					// into a shadow root has the rest of that root and the light DOM around its host to
					// make inert, and a direct child of a shadow root has no `parentElement`.
					let current: Element | null = target;
					while (current && current !== target.ownerDocument.body) {
						const root = current.getRootNode();
						const container: Element | ShadowRoot | null =
							current.parentElement ?? (root instanceof ShadowRoot ? root : null);
						if (!container) break;
						for (const sibling of container.children) {
							if (sibling === current || sibling.hasAttribute('data-live-region')) continue;
							if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
							makeInert(sibling);
							inerted.push(sibling);
						}
						current = container instanceof ShadowRoot ? container.host : container;
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
