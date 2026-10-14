// A short memory of where focus has been, so an overlay whose opener is gone (a menu item that
// opened a dialog and left with the menu) can hand focus to the most recent element that is still
// on the page instead of dropping it on <body>. `<Theme>` installs the listener for its document;
// a focus scope installs it for its own document too, so an overlay in an iframe is covered.
import { composedContains, isFocusable } from './focus.js';

/** How many elements are remembered per document. */
export const FOCUS_HISTORY_SIZE = 20;

interface History {
	/** Oldest first. Weak, so remembering an element never keeps it alive. */
	entries: WeakRef<HTMLElement>[];
	installs: number;
	stop: () => void;
}

const histories = new WeakMap<Document, History>();

/** Remembers an element as the newest entry of a document's history. */
export function recordFocus(element: HTMLElement, doc: Document = element.ownerDocument) {
	const history = histories.get(doc);
	if (!history || element === doc.body || element === doc.documentElement) return;
	const { entries } = history;
	const newest = entries.at(-1)?.deref();
	if (newest === element) return;
	// Drop an earlier entry for the same element and every entry that has been collected.
	const kept = entries.filter((entry) => {
		const value = entry.deref();
		return value !== undefined && value !== element;
	});
	kept.push(new WeakRef(element));
	history.entries = kept.slice(-FOCUS_HISTORY_SIZE);
}

/**
 * Starts remembering focus in `doc`. Calls nest: the listener stays until every caller has run
 * the function this returns. Safe to call on the server, where it does nothing.
 */
export function installFocusHistory(
	doc: Document | undefined = typeof document === 'undefined' ? undefined : document
): () => void {
	if (!doc) return () => {};
	let history = histories.get(doc);
	if (!history) {
		const onFocusIn = (event: FocusEvent) => {
			// Retargeted at the document when the focus is inside a shadow root: use the real target.
			const target = event.composedPath()[0] ?? event.target;
			if (target instanceof HTMLElement) recordFocus(target, doc);
		};
		doc.addEventListener('focusin', onFocusIn, true);
		history = {
			entries: [],
			installs: 0,
			stop: () => doc.removeEventListener('focusin', onFocusIn, true)
		};
		histories.set(doc, history);
		// Whatever has focus now is the first thing worth remembering.
		const active = doc.activeElement;
		if (active instanceof HTMLElement) recordFocus(active, doc);
	}
	history.installs += 1;
	const owned = history;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		owned.installs -= 1;
		if (owned.installs > 0) return;
		owned.stop();
		histories.delete(doc);
	};
}

/** The remembered elements of `doc` that are still connected, newest first. */
export function getFocusHistory(doc: Document = document): HTMLElement[] {
	const entries = histories.get(doc)?.entries ?? [];
	const live: HTMLElement[] = [];
	for (const entry of entries) {
		const element = entry.deref();
		if (element?.isConnected) live.push(element);
	}
	return live.reverse();
}

/**
 * The most recently focused element that can take focus again: connected, enabled, rendered and
 * not inside `exclude` (the overlay that is closing) or an `inert` subtree. `null` when none is.
 */
export function findFocusFallback(
	doc: Document,
	{ exclude, accept }: { exclude?: Node | null; accept?: (element: HTMLElement) => boolean } = {}
): HTMLElement | null {
	for (const element of getFocusHistory(doc)) {
		if (exclude && composedContains(exclude, element)) continue;
		if (element.closest('[inert]') || !isFocusable(element)) continue;
		if (accept && !accept(element)) continue;
		return element;
	}
	return null;
}

/** Forgets everything remembered for `doc`. For tests. */
export function clearFocusHistory(doc: Document = document) {
	const history = histories.get(doc);
	if (history) history.entries = [];
}
