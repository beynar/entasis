// The `navigate` tool every navigation component adds its links to. It only goes where the page
// already links, and never off the site.

import { createChoiceTool, type WebMCPChoiceSource } from './webmcp.choices.js';

export type WebMCPLink = {
	/** Identity of the link. Defaults to its address. */
	key?: unknown;
	href: string | undefined;
	label: unknown;
	description?: unknown;
	disabled?: boolean;
	target?: string;
	surface?: string;
	exposedTo?: string[];
};

const navigateTool = createChoiceTool({
	name: 'navigate',
	consequentialName: 'navigate_consequential',
	title: 'Go to a page',
	description: 'Goes to another page of this site, as following one of its links would.',
	consequentialDescription:
		'Goes to another page of this site, which the user may need to confirm.',
	param: 'to',
	doneStatus: 'navigating',
	limit: 300
});

/** The address of a link within this site, or `null` for one an agent should not follow. */
export function siteAddress(href: string | undefined, target?: string): string | null {
	if (!href || (target && target !== '_self')) return null;
	let url: URL;
	try {
		url = new URL(href, location.href);
	} catch {
		return null;
	}
	// `//host/path` is another site once it stands alone as an address.
	if (url.origin !== location.origin || url.pathname.startsWith('//')) return null;
	return `${url.pathname}${url.search}${url.hash}`;
}

/** Follows a link as a click does, so a client-side router handles it the same way. */
export function followLink(href: string): void {
	const anchor = document.createElement('a');
	anchor.href = href;
	anchor.hidden = true;
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
}

/** Adds links to `navigate`, read each time the list is rebuilt. */
export function contributeLinks(links: () => WebMCPLink[]): WebMCPChoiceSource {
	return navigateTool.contribute(() =>
		links().flatMap(({ key, href, label, description, disabled, target, surface, exposedTo }) => {
			const to = disabled ? null : siteAddress(href, target);
			if (!to || typeof label !== 'string') return [];
			return [
				{
					key: key ?? to,
					id: to,
					label,
					description: typeof description === 'string' ? description : undefined,
					surface,
					exposedTo,
					run: () => followLink(to)
				}
			];
		})
	);
}
