import type { DimValue, Params, SectionType } from '../engine/types.js';

/**
 * Lever positions live in the URL as plain query parameters (`?textCols=6&tone=muted`), so a
 * variant is a readable, editable link. Values are matched against the type's own levers; anything
 * else is kept as text and left for validation to reject with a precise reason.
 */
/** Read-only views of a URL: SvelteKit's `page.url` is immutable, and these only read it. */
type UrlQuery = { readonly searchParams: { get(name: string): string | null } };

export function paramsFromUrl(type: SectionType, url: UrlQuery, prefix = ''): Params | null {
	const params: Params = {};
	let found = false;
	for (const [lever, values] of Object.entries(type.dims)) {
		const raw = url.searchParams.get(prefix + lever);
		if (raw === null) continue;
		found = true;
		params[lever] = values.find((value) => String(value) === raw) ?? (raw as DimValue);
	}
	return found ? params : null;
}

export function writeParams(
	type: SectionType,
	url: { readonly href: string },
	params: Params,
	prefix = ''
) {
	const next = new URL(url.href);
	for (const lever of Object.keys(type.dims)) next.searchParams.delete(prefix + lever);
	for (const [lever, value] of Object.entries(params))
		next.searchParams.set(prefix + lever, String(value));
	return next;
}

/** Kit levers share the URL with section levers under a `kit.` prefix. */
export const KIT_PREFIX = 'kit.';
