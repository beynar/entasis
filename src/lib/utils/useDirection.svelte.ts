// Resolves the writing direction for keyboard handling (which arrow means "next").
// Priority: an explicit override → the element's computed direction → the i18n direction
// context → `document.dir`. The element comes before the context because it is what the user
// sees: a `dir="ltr"` island (a code sample, a phone number) inside an Arabic page lays its
// items out left to right, so its arrows must not be mirrored, and the reverse holds for an
// Arabic island in an English page. The context still answers where there is no element yet
// (server rendering, before mount). Call during component init; the returned getter stays
// reactive to the context and is cheap to call from event handlers.
import { getI18nDirection } from '$lib/i18n/context.svelte.js';

export type Direction = 'ltr' | 'rtl';

export function useDirection(
	getNode?: () => HTMLElement | null | undefined,
	override?: () => Direction | undefined
): () => Direction {
	const fromContext = getI18nDirection();
	return () => {
		const explicit = override?.();
		if (explicit) return explicit;
		// Read before the element so a reactive caller re-runs when the locale switches.
		const contextual = fromContext?.();
		const node = getNode?.();
		if (node?.isConnected && typeof getComputedStyle === 'function') {
			return getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		if (contextual) return contextual;
		return typeof document !== 'undefined' && document.dir === 'rtl' ? 'rtl' : 'ltr';
	};
}
