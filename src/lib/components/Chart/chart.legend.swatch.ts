import { createRawSnippet, type Snippet } from 'svelte';

/**
 * The colour chip a legend entry carries.
 *
 * `ToggleButton.prefix` is a `Slot`, and `Slot` renders it with no payload, so a snippet
 * written in Chart.svelte could never be told *which* series colour to paint. A raw snippet
 * closes over the colour instead, which is what the library already does for parameterised
 * slot content (see `Icons`). The shape comes from the `legendSwatch` theme part; the only
 * thing written inline is the resolved series colour.
 */
export function chartLegendSwatch(color: string, className: string): Snippet {
	const html = `<span data-chart-legend-swatch class="${escapeAttribute(className)}" style="background-color:${colorDeclarationValue(color)}"></span>`;
	return createRawSnippet(() => ({ render: () => html }));
}

/** The theme's own class string, which still lands in raw markup. */
function escapeAttribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/**
 * A series colour can come from consumer data (a palette entry, a colour column), and it is
 * interpolated into a `style` attribute. Escaping the markup-significant characters stops an
 * attribute or tag breakout but not a second declaration: a value carrying `;` would make
 * `red;position:fixed;inset:0` a full-viewport overlay. So the value is allowlisted to the
 * characters a CSS colour token actually needs — names, hex, `rgb()`/`oklch()` with their
 * separators, and `var(--x)` — and anything else falls back to `currentColor` rather than
 * being silently rewritten into a different colour.
 */
function colorDeclarationValue(color: string): string {
	return /^[A-Za-z0-9#%,./()+\-_ ]+$/.test(color) ? color : 'currentColor';
}
