// An address from a row, a response or a model can be anything, and a link follows it on a press. So
// a link refuses what runs code when followed, and only that: an app's own scheme (`myapp://`), a
// path, `file:` and `blob:` are the app's business, and a `data:` address can be a file to download.
// Judged by `URL`, which reads an address as the browser will: `JaVa\tScRiPt:` and a leading space
// are not a way past it.
const RUNS_CODE: ReadonlySet<string> = new Set(['javascript:', 'vbscript:']);
// The type of a `data:` address, up to its first `,` or `;`, when a browser would draw it as a page.
const DATA_DOCUMENT = /^[^,;]*(?:html|xml)/i;

/** The address unless following it would run code, in which case undefined. */
export const safeHref = (href: unknown): string | undefined => {
	if (typeof href !== 'string') return undefined;
	try {
		const { protocol, pathname } = new URL(href, 'https://probe.invalid/');
		if (RUNS_CODE.has(protocol)) return undefined;
		return protocol === 'data:' && DATA_DOCUMENT.test(pathname) ? undefined : href;
	} catch {
		// Not an address a browser could follow at all, so nothing runs.
		return href;
	}
};
