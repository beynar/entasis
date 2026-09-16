// Resolves the writing direction for keyboard handling (which arrow means "next").
// Priority: an explicit override → the i18n direction context → the element's computed
// direction → `document.dir`. Call during component init; the returned getter is reactive
// to the context and cheap to call from event handlers.
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
		const contextual = fromContext?.();
		if (contextual) return contextual;
		const node = getNode?.();
		if (node && typeof getComputedStyle === 'function') {
			return getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		return typeof document !== 'undefined' && document.dir === 'rtl' ? 'rtl' : 'ltr';
	};
}
