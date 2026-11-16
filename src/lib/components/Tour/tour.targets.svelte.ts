// Where a Tour step points: named elements registered with `{@attach tourTarget('name')}`, a CSS
// selector, an element, or a function returning one. Resolution waits for a target that is not
// on the page yet (a menu `before` opens, a route that is still loading) until a timeout.
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { SvelteMap } from 'svelte/reactivity';
import type { TourTarget } from './tour.props.js';

// Named targets, newest last per name: two elements under one name (a list rendered twice while
// a transition plays) resolve to the one that attached last and is still on the page.
const registry = new SvelteMap<string, HTMLElement[]>();
/** Listeners told when a named target attaches, so a step waiting for it resolves at once. */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- callbacks, never rendered
const listeners = new Set<() => void>();

/**
 * Registers the element under `name`, for steps whose `target` is that name:
 * `<button {@attach tourTarget('search')}>`. A name wins over a CSS selector with the same text.
 */
export function tourTarget(name: string): Attachment<HTMLElement> {
	// Read and written in one go, untracked: the attachment's effect must not depend on the
	// registry it writes.
	return (node) =>
		untrack(() => {
			registry.set(name, [...(registry.get(name) ?? []), node]);
			for (const listener of [...listeners]) listener();
			return () =>
				untrack(() => {
					const remaining = (registry.get(name) ?? []).filter((element) => element !== node);
					if (remaining.length > 0) registry.set(name, remaining);
					else registry.delete(name);
				});
		});
}

/** Whether `element` is on the page and laid out (a `display: none` menu item is not yet). */
export const isPresent = (element: Element | null | undefined): element is HTMLElement =>
	!!element && element.isConnected && element.getClientRects().length > 0;

/**
 * The element `target` points at right now, or `null`: a registered name first, then a CSS
 * selector. An element or function result that is not on the page counts as missing.
 */
export function resolveTarget(target: TourTarget | undefined, root?: Document): HTMLElement | null {
	if (target == null) return null;
	if (typeof target === 'function') {
		const element = target();
		return isPresent(element) ? element : null;
	}
	if (typeof target !== 'string') return isPresent(target) ? target : null;
	const named = registry.get(target);
	if (named) {
		for (let index = named.length - 1; index >= 0; index -= 1) {
			if (isPresent(named[index])) return named[index];
		}
	}
	const doc = root ?? (typeof document === 'undefined' ? null : document);
	if (!doc) return null;
	let element: Element | null;
	try {
		element = doc.querySelector(target);
	} catch {
		// Not a valid selector: a name nothing registered yet.
		return null;
	}
	return element instanceof HTMLElement && isPresent(element) ? element : null;
}

/**
 * Resolves `target`, waiting up to `timeout` ms for it to appear: re-checked on every DOM change,
 * every named registration and every animation frame (a target can become visible through a
 * stylesheet transition no mutation reports). Resolves `null` on timeout or when `signal` aborts.
 */
export function waitForTarget(
	target: TourTarget | undefined,
	{ timeout, signal }: { timeout: number; signal: AbortSignal }
): Promise<HTMLElement | null> {
	const found = resolveTarget(target);
	if (found || signal.aborted || timeout <= 0 || target == null) return Promise.resolve(found);
	return new Promise((resolve) => {
		let frame = 0;
		let settled = false;
		const finish = (element: HTMLElement | null) => {
			if (settled) return;
			settled = true;
			observer?.disconnect();
			listeners.delete(check);
			cancelAnimationFrame(frame);
			clearTimeout(timer);
			signal.removeEventListener('abort', abort);
			resolve(element);
		};
		const check = () => {
			const element = resolveTarget(target);
			if (element) finish(element);
		};
		const poll = () => {
			check();
			if (!settled) frame = requestAnimationFrame(poll);
		};
		const abort = () => finish(null);
		const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(check);
		observer?.observe(document.documentElement, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class', 'style', 'hidden', 'open', 'id']
		});
		listeners.add(check);
		signal.addEventListener('abort', abort);
		const timer = setTimeout(() => finish(resolveTarget(target)), timeout);
		frame = requestAnimationFrame(poll);
	});
}
