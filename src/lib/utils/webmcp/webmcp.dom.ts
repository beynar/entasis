// What the page shows an agent, read the way assistive technology reads it: a subtree marked
// `aria-hidden` is not there, a name comes from `aria-labelledby`, then `aria-label`, then the text
// a screen reader would announce, and a `data-webmcp-off` zone is out of every tool's reach.

/** Removes a subtree from agents: tools, buttons, rows, context and data alike. */
export const AGENT_OFF_ATTRIBUTE = 'data-webmcp-off';

/**
 * The selector of what agents may not reach. `data-webmcp-off={condition}` renders "false" when
 * the condition is false, which leaves the subtree to agents.
 */
export const AGENT_OFF_SELECTOR = `[${AGENT_OFF_ATTRIBUTE}]:not([${AGENT_OFF_ATTRIBUTE}="false"])`;

const asElement = (node: Node | null | undefined): Element | null =>
	!node ? null : node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

/** Whether `node` sits in a subtree the app took from agents with `data-webmcp-off`. */
export const isAgentOff = (node: Node | null | undefined): boolean =>
	asElement(node)?.closest(AGENT_OFF_SELECTOR) != null;

// What assistive technology skips. `[data-aria-hidden]` marks the page outside a third-party modal
// (the `aria-hidden` package of Radix and others): like `inert` behind an entasis Dialog, it says
// nothing about what the page offers once the modal closes, only that nothing can be pressed now.
const DECORATIVE = '[aria-hidden="true"]:not([data-aria-hidden])';

/**
 * Whether `node` is decorative: inside an `aria-hidden` subtree, such as Marquee's repeated copies,
 * which a person never reaches as controls. The page an outside modal hides is not decorative.
 */
export const isDecorative = (node: Node | null | undefined): boolean =>
	asElement(node)?.closest(DECORATIVE) != null;

/** Whether a person could reach `node` right now: not inert and not hidden from assistive tech. */
export const isReachableNow = (node: Node | null | undefined): boolean =>
	asElement(node)?.closest('[inert], [aria-hidden="true"]') == null;

const SKIPPED = 'script, style, template, [hidden], [aria-hidden="true"]';

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

function textOf(node: Node, parts: string[], named: boolean): void {
	if (node.nodeType === Node.TEXT_NODE) {
		parts.push(node.textContent ?? '');
		return;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) return;
	const element = node as Element;
	if (element.matches(SKIPPED)) return;
	if (named) {
		// A name is what is announced: an embedded label or an image's text stands for its content.
		if (!(element instanceof HTMLElement ? (element.checkVisibility?.() ?? true) : true)) return;
		const label = collapse(element.getAttribute('aria-label') ?? '');
		if (label) {
			parts.push(` ${label} `);
			return;
		}
		if (element instanceof HTMLImageElement) {
			parts.push(` ${element.alt} `);
			return;
		}
	}
	for (const child of element.childNodes) textOf(child, parts, named);
}

/**
 * The text of `root` a person can read, without what assistive technology skips (decorative
 * glyphs, a shortcut hint marked `aria-hidden`). Whitespace collapsed, nothing cut.
 */
export function readableText(root: Node): string {
	const parts: string[] = [];
	for (const child of root.childNodes) textOf(child, parts, false);
	return collapse(parts.join(''));
}

/**
 * The accessible name of an element, as a screen reader computes it for a button or a link: the
 * elements `aria-labelledby` points to, else `aria-label`, else its announced content.
 */
export function accessibleName(element: Element): string {
	const ids = collapse(element.getAttribute('aria-labelledby') ?? '');
	if (ids) {
		const root = element.getRootNode() as Document | ShadowRoot;
		const named = ids
			.split(' ')
			.map((id) => root.getElementById?.(id))
			.flatMap((labelling) => {
				if (!labelling) return [];
				const own = collapse(labelling.getAttribute('aria-label') ?? '');
				if (own) return [own];
				// A referenced label counts even when hidden itself: a visually hidden caption is common.
				const parts: string[] = [];
				for (const child of labelling.childNodes) textOf(child, parts, true);
				return [collapse(parts.join(''))];
			})
			.filter(Boolean);
		if (named.length) return named.join(' ');
	}
	const label = collapse(element.getAttribute('aria-label') ?? '');
	if (label) return label;
	const parts: string[] = [];
	for (const child of element.childNodes) textOf(child, parts, true);
	return collapse(parts.join(''));
}
