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
