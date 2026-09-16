import { createHighlighter, type Highlighter } from '@tanstack/highlight/core';
import {
	PLAIN_TEXT_LANGUAGE,
	bundledCodeLanguages,
	resolveLanguage
} from './highlighter/code-languages.js';

/**
 * Singleton synchronous highlighter (TanStack Highlight) with every shipped
 * language registered. Fully SSR-safe: no top-level await, no WebAssembly, no
 * browser-only APIs — the same instance runs on the server and the client.
 */
let highlighter: Highlighter | undefined;

function getHighlighter(): Highlighter {
	highlighter ??= createHighlighter({
		languages: bundledCodeLanguages,
		fallbackLanguage: PLAIN_TEXT_LANGUAGE
	});
	return highlighter;
}

export type HighlightOptions = {
	/**
	 * When true, the highlighter wraps every line in a `.th-line` span carrying
	 * `data-line`, which the CSS gutter (in `CodeTheme.svelte`) renders as numbers.
	 */
	lineNumbers?: boolean;
	/**
	 * When true, long lines soft-wrap instead of scrolling horizontally.
	 */
	wrap?: boolean;
};

// Applied to the highlighter's `<pre>`. Scrolling is owned by the wrapping ScrollArea (see
// Code.svelte), so the pre itself does not scroll: when not wrapping it takes its natural
// (max-content) width so the ScrollArea sees the horizontal overflow; when wrapping it fills
// and soft-wraps. `has-[.th-line]:px-0` lets the gutter sit flush against the edge.
const preClass = (wrap: boolean) =>
	[
		'px-4 py-3.5 outline-none has-[.th-line]:px-0',
		wrap ? 'w-full whitespace-pre-wrap break-words' : 'w-max'
	].join(' ');

/**
 * Highlights `code` to a `<pre class="th-code"><code>…</code></pre>` HTML string
 * using the singleton highlighter. `language` is normalized/aliased via
 * `resolveLanguage` (falls back to plain text). Tokens come out as `th-*`
 * classes whose colors `CodeTheme.svelte` maps to `--code-token-*` variables,
 * so the result adapts to light/dark for free.
 */
export function codeToHtml(
	code: string,
	options: { language?: string } & HighlightOptions = {}
): string {
	const { language, lineNumbers = false, wrap = false } = options;
	let html = getHighlighter().highlight(code, {
		lang: resolveLanguage(language),
		lineNumbers
	}).html;
	// The renderer owns the `<pre>` markup; layout classes and the wrap flag ride on it so
	// CodeTheme's selectors can target them.
	html = html.replace(/^<pre class="/, `<pre class="${preClass(wrap)} `);
	if (wrap) html = html.replace(/^(<pre[^>]*)>/, '$1 data-wrap>');
	if (lineNumbers) {
		// Lines are separated by literal "\n" text. Once the gutter makes each line
		// `display: block`, those preserved newlines would double the line spacing.
		html = html.replace(/<\/span>\n<span class="th-line"/g, '</span><span class="th-line"');
	}
	return html;
}
