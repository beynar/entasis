// The Content-Security-Policy nonce of the page, for code that injects a `<script>` or `<style>`
// outside a component (CDN loaders, runtime stylesheets). `<Theme nonce>` registers its value
// here while it is mounted, the way `registerActiveTheme` exposes the Theme to plain modules;
// components that render markup (BeforeHydratation) read it from the Theme directly.

type NonceSource = () => string | undefined;

const sources: NonceSource[] = [];

/** Registers where the nonce comes from; the returned function removes the registration. */
export function registerCspNonce(source: NonceSource) {
	sources.push(source);
	return () => {
		const index = sources.lastIndexOf(source);
		if (index >= 0) sources.splice(index, 1);
	};
}

/**
 * The nonce of the most recently mounted `<Theme>` that has one, or `undefined` without a Theme
 * or a nonce. Client-only: on the server a module-level value would leak between requests.
 */
export function getCspNonce(): string | undefined {
	for (let index = sources.length - 1; index >= 0; index -= 1) {
		const nonce = sources[index]();
		if (nonce) return nonce;
	}
	return undefined;
}

/**
 * Stamps `nonce` (default: `getCspNonce()`) on a script, style or link element before it is
 * attached, so a CSP that only allows nonced inline code accepts it. Returns the element.
 */
export function applyCspNonce<E extends Element>(
	element: E,
	nonce: string | undefined = getCspNonce()
): E {
	if (nonce) element.setAttribute('nonce', nonce);
	return element;
}

/** Escapes a value for a double-quoted HTML attribute. */
const escapeAttribute = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** ` nonce="…"` for markup built as a string, or `''` without a nonce. */
export const nonceAttribute = (nonce: string | undefined) =>
	nonce ? ` nonce="${escapeAttribute(nonce)}"` : '';
