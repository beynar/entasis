// The one focus primitive every overlay uses: initial focus on open, Tab containment for
// modal scopes, `inert` on the rest of the page for modal scopes, and focus restoration
// to the opener when the scope goes away. Radix calls this FocusScope.
import { on } from 'svelte/events';
import { tick, untrack } from 'svelte';
import { getTabbableElements, resolveInitialFocus } from './focus.js';

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

const isFocusInside = (node: HTMLElement) => {
	const active = node.ownerDocument.activeElement;
	return !active || active === node.ownerDocument.body || node.contains(active);
};

export function useFocusScope(options: FocusScopeOptions) {
	let node: HTMLElement | null = null;
	let returnTarget: HTMLElement | null = null;
	let restored = false;

	/** Idempotent; only moves focus when it is still on `<body>` or inside the scope. */
	const restore = () => {
		if (restored) return;
		restored = true;
		if (!(options.restoreFocus?.() ?? true)) return;
		const target = options.returnTo?.() ?? returnTarget;
		returnTarget = null;
		if (!target?.isConnected || !node || !isFocusInside(node)) return;
		target.focus({ preventScroll: true });
	};

	const applyInitialFocus = (target: HTMLElement) => {
		const mode = options.initialFocus?.() ?? 'first';
		if (mode === false) return;
		const element =
			mode === 'first' ? resolveInitialFocus(target) : mode === 'container' ? target : mode;
		if (element === target && target.tabIndex < 0) target.tabIndex = -1;
		element.focus({ preventScroll: true });
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!node || event.key !== 'Tab' || event.defaultPrevented) return;
		if (!(options.trap?.() ?? options.isActive())) return;
		const tabbable = getTabbableElements(node);
		if (tabbable.length === 0) {
			event.preventDefault();
			node.focus();
			return;
		}
		const active = node.ownerDocument.activeElement as HTMLElement | null;
		const index = tabbable.indexOf(active as HTMLElement);
		const first = tabbable[0];
		const last = tabbable[tabbable.length - 1];
		const wrapBackward = event.shiftKey && index <= 0;
		const wrapForward = !event.shiftKey && index === tabbable.length - 1;
		const outside = active ? !node.contains(active) : true;
		if (!wrapBackward && !wrapForward && !outside) return;
		event.preventDefault();
		(event.shiftKey ? last : first).focus();
	};

	const attachment = (target: HTMLElement) => {
		return untrack(() => {
			node = target;
			restored = false;
			const active = target.ownerDocument.activeElement;
			returnTarget =
				active instanceof HTMLElement && active !== target.ownerDocument.body ? active : null;
			if (target.tabIndex < 0) target.tabIndex = -1;

			const inerted: Element[] = [];
			const cleanups: Array<() => void> = [on(target.ownerDocument, 'keydown', handleKeyDown)];

			$effect(() => {
				const active = options.isActive();
				if (!active) return;
				// Wait for the intro to mount children before picking the initial target.
				let cancelled = false;
				void tick().then(() => {
					if (!cancelled && node && !node.contains(node.ownerDocument.activeElement)) {
						applyInitialFocus(node);
					}
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
					inerted.splice(0).forEach(releaseInert);
				};
			});

			return () => {
				cleanups.forEach((cleanup) => cleanup());
				inerted.splice(0).forEach(releaseInert);
				restore();
				node = null;
			};
		});
	};

	return { attachment, restore };
}
