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
	limit: 100
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
