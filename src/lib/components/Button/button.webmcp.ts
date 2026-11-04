// How Buttons appear to AI agents: the ones a person could press right now, as the options of
// `click_button`, and `click_danger_button` for those the browser may want confirmed.

import { createChoiceTool, type WebMCPChoice } from '$lib/utils/webmcp/webmcp.choices.js';
import { siteAddress } from '$lib/utils/webmcp/webmcp.navigation.js';
import { toolText } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPOptions } from '$lib/utils/webmcp/webmcp.types.js';
import type { ButtonToolOptions } from './button.props.js';

export type TrackedButton = {
	node: HTMLElement;
	danger: boolean;
	tool: ButtonToolOptions | undefined;
	webmcp: WebMCPOptions;
	surface: string | undefined;
};

const clickTool = createChoiceTool({
	name: 'click_button',
	consequentialName: 'click_danger_button',
	title: 'Press a button',
	description: 'Presses a button on the page, as the user would.',
	consequentialDescription:
		'Presses a button whose action is significant or hard to undo, as the user would.',
	param: 'id',
	doneStatus: 'pressed',
	limit: 100,
	read: {
		name: 'read_buttons',
		consequentialName: 'read_danger_buttons',
		title: 'Tell apart buttons with the same name',
		description:
			'Says what each button that reads the same as another belongs to, from the text around it on the page.'
	}
});

const tracked = new Set<TrackedButton>();

// Not a matter of `inert`: the page is inert behind a modal, and a list built then would stay
// empty once it closes. The registry pauses those tools meanwhile; a press still checks it.
const canBeOffered = (node: HTMLElement): boolean =>
	node.isConnected &&
	(node.checkVisibility?.() ?? true) &&
	!node.matches(':disabled, [aria-disabled="true"]') &&
	['button', 'link'].includes(node.getAttribute('role') ?? '');

const isPressable = (node: HTMLElement): boolean =>
	canBeOffered(node) && node.closest('[inert]') === null;

const staysOnSite = (node: HTMLElement): boolean =>
	!(node instanceof HTMLAnchorElement) || siteAddress(node.href, node.target) !== null;

// A component with its own tools already covers its buttons; those of a field set a value the
// form's tool sets, and a menu's trigger only shows rows `run_command` runs.
const isCoveredByAnotherTool = ({ node, tool }: TrackedButton): boolean =>
	!tool &&
	(node.closest('[data-webmcp-owned]') !== null || node.getAttribute('aria-haspopup') === 'menu');

// Text that is not a value or a control's own: a field's content is not for this tool to read.
const NOT_CONTEXT =
	'button, [role="button"], input, select, textarea, script, style, svg, [hidden], [aria-hidden="true"]';

function visibleText(root: Element): string {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const parts: string[] = [];
	let length = 0;
	while (length < 200 && walker.nextNode()) {
		const text = walker.currentNode.textContent?.trim();
		const parent = walker.currentNode.parentElement;
		if (!text || !parent || parent.closest(NOT_CONTEXT)) continue;
		if (!(parent.checkVisibility?.() ?? true)) continue;
		parts.push(text);
		length += text.length;
	}
	return toolText(parts.join(' '));
}

function headingBefore(node: Node): string {
	let found = '';
	for (const heading of document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')) {
		if (!(heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
		found = visibleText(heading) || found;
	}
	return found;
}

/**
 * What a person reads a button by: the text of the smallest thing that holds it and none of its
 * peers (its row, its card), else the heading it comes under.
 */
function contextOf(node: HTMLElement, peers: WebMCPChoice[]): string {
	const others = peers.flatMap((peer) => (peer.node && peer.node !== node ? [peer.node] : []));
	for (let holder = node.parentElement; holder; holder = holder.parentElement) {
		if (others.some((other) => holder?.contains(other))) break;
		const text = visibleText(holder);
		if (text) return text;
	}
	return headingBefore(node);
}

function choices(): WebMCPChoice[] {
	return [...tracked]
		.filter(
			(button) =>
				canBeOffered(button.node) && staysOnSite(button.node) && !isCoveredByAnotherTool(button)
		)
		.map((button) => ({
			key: button.node,
			node: button.node,
			label:
				toolText(button.node.getAttribute('aria-label') ?? '') ||
				toolText(button.node.textContent ?? ''),
			description: button.tool?.description,
			consequential: button.tool?.consequential ?? button.danger,
			surface: button.surface,
			exposedTo: button.tool?.exposedTo ?? button.webmcp.exposedTo,
			available: () => tracked.has(button) && isPressable(button.node),
			context: (peers) => contextOf(button.node, peers),
			run: () => button.node.click()
		}));
}

const source = clickTool.contribute(choices);

/** Offers a button to agents until the returned function runs. */
export function expose(button: TrackedButton): () => void {
	tracked.add(button);
	source.refresh();
	return () => {
		tracked.delete(button);
		source.refresh();
	};
}
