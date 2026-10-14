/**
 * Collision-resistant id generation.
 *
 * `crypto.randomUUID()` where the platform has it; otherwise a timestamp plus enough
 * random base-36 to stay unique. The fallback pads deliberately: `Math.random()` can
 * produce a short mantissa (`0.5` stringifies to `"0.i"`), so a bare
 * `Math.random().toString(36).slice(2)` is allowed to be empty.
 */
const RANDOM_CHARS = 10;

const randomSegment = (): string => {
	let segment = '';
	while (segment.length < RANDOM_CHARS) {
		segment += Math.random().toString(36).slice(2);
	}
	return segment.slice(0, RANDOM_CHARS);
};

/**
 * Returns a unique id, optionally namespaced: `createId('toast')` → `toast-<unique>`.
 * Never empty, and never shorter than 8 characters after the prefix.
 */
export const createId = (prefix?: string): string => {
	const id =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${randomSegment()}`;
	return prefix ? `${prefix}-${id}` : id;
};

/**
 * Finds an element by id in the tree `from` lives in: the document, or the shadow root when it
 * renders inside one (`document.getElementById` cannot see into a shadow tree). Falls back to the
 * page's document, where a panel portaled out of a shadow root ends up. `from` is any node of
 * that tree; without one the page's document is searched.
 */
export const elementById = (from: Node | null | undefined, id: string): HTMLElement | null => {
	const root = from?.getRootNode?.();
	if (root && 'getElementById' in root) {
		const found = (root as Document | ShadowRoot).getElementById(id);
		if (found) return found;
	}
	return typeof document === 'undefined' ? null : document.getElementById(id);
};
