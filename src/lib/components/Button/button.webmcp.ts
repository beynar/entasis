// The tools behind every Button under `<Theme webmcp>`. One tool per kind of action, its options
// listing the buttons a person could press right now. Loaded only when an app turned WebMCP on and
// the browser has it.

import { DEV } from 'esm-env';
import { tick } from 'svelte';
import {
	registerWebMCPTool,
	toolText,
	toToolName,
	type WebMCPToolHandle
} from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPOptions, WebMCPTool } from '$lib/utils/webmcp/webmcp.types.js';
import type { ButtonToolOptions } from './button.props.js';

export type TrackedButton = {
	node: HTMLElement;
	danger: boolean;
	tool: ButtonToolOptions;
	webmcp: WebMCPOptions;
};

type Choice = { id: string; title: string; button: TrackedButton };
type Group = {
	surface: string | undefined;
	consequential: boolean;
	choices: Choice[];
	exposedTo: string[] | undefined;
};

// A tool's schema is sent to the model on every turn; past this it costs more than it gives.
const MAX_BUTTONS = 100;
const REFRESH_DELAY = 50;

const tracked = new Set<TrackedButton>();
const handles = new Map<string, WebMCPToolHandle>();
const ids = new WeakMap<HTMLElement, string>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** What a person reads on the button: its accessible name. */
const buttonLabel = ({ node }: TrackedButton): string =>
	toolText(node.getAttribute('aria-label') ?? '') || toolText(node.textContent ?? '');

// Not a matter of `inert`: the page is inert behind a modal, and a list built then would stay
// empty once it closes. The registry pauses those tools meanwhile; a press still checks it.
const canBeOffered = (node: HTMLElement): boolean =>
	node.isConnected &&
	(node.checkVisibility?.() ?? true) &&
	!node.matches(':disabled, [aria-disabled="true"]') &&
	['button', 'link'].includes(node.getAttribute('role') ?? '');

const isPressable = (node: HTMLElement): boolean =>
	canBeOffered(node) && node.closest('[inert]') === null;

// As for navigation everywhere else: nothing here takes the agent off the site.
const staysOnSite = (node: HTMLElement): boolean =>
	!(node instanceof HTMLAnchorElement) || node.origin === location.origin;

// A control's own buttons (a calendar's arrows, a stepper) are how a person reaches a value the
// form's tool already sets.
const isOwnedByField = (node: HTMLElement): boolean =>
	node.closest('[data-field-control]') !== null;

const inDocumentOrder = (left: TrackedButton, right: TrackedButton): number =>
	left.node.compareDocumentPosition(right.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

function idFor(button: TrackedButton, label: string, taken: Set<string>): string {
	const known = ids.get(button.node);
	if (known && !taken.has(known)) return known;
	const base = toToolName(label) ?? 'button';
	let id = base;
	for (let number = 2; taken.has(id); number += 1) id = `${base}_${number}`;
	ids.set(button.node, id);
	return id;
}

function groupButtons(): Map<string, Group> {
	const groups = new Map<string, Group>();
	const buttons = [...tracked]
		.filter(({ node }) => canBeOffered(node) && staysOnSite(node) && !isOwnedByField(node))
		.sort(inDocumentOrder);
	if (DEV && buttons.length > MAX_BUTTONS) {
		console.warn(`[WebMCP] ${buttons.length} buttons; agents see the first ${MAX_BUTTONS}.`);
	}
	for (const button of buttons.slice(0, MAX_BUTTONS)) {
		const label = buttonLabel(button);
		if (!label) continue;
		const consequential = button.tool.consequential ?? button.danger;
		const surface = button.node.closest('[aria-modal="true"]')?.id || undefined;
		const key = `${surface ?? ''}:${consequential}`;
		const group = groups.get(key) ?? {
			surface,
			consequential,
			choices: [],
			exposedTo: button.webmcp.exposedTo
		};
		const taken = new Set(group.choices.map(({ id }) => id));
		group.choices.push({
			id: idFor(button, label, taken),
			title: [label, toolText(button.tool.description)].filter(Boolean).join(': '),
			button
		});
		groups.set(key, group);
	}
	return groups;
}

function buildTool(group: Group): WebMCPTool<{ id: string }> {
	return {
		name: group.consequential ? 'click_danger_button' : 'click_button',
		title: group.consequential ? 'Press a button with lasting effects' : 'Press a button',
		description: group.consequential
			? 'Presses a button whose action is significant or hard to undo, as the user would.'
			: 'Presses a button on the page, as the user would.',
		inputSchema: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					enum: group.choices.map(({ id }) => id),
					oneOf: group.choices.map(({ id, title }) => ({ const: id, title }))
				}
			},
			required: ['id'],
			additionalProperties: false
		},
		annotations: { consequentialHint: group.consequential },
		execute: async ({ id }) => {
			const choice = group.choices.find((candidate) => candidate.id === id);
			// The list can be behind the page: what counts is the button as it is now.
			if (!choice || !tracked.has(choice.button) || !isPressable(choice.button.node)) {
				refresh();
				return { status: 'unavailable', message: 'This button cannot be pressed right now.' };
			}
			choice.button.node.click();
			await tick();
			// A press often changes what is on screen, including what the buttons say.
			scheduleRefresh();
			return { status: 'pressed', button: id };
		}
	};
}

function refresh(): void {
	const groups = groupButtons();
	for (const [key, group] of groups) {
		const tool = buildTool(group);
		const handle = handles.get(key);
		if (handle) handle.update(tool, { exposedTo: group.exposedTo });
		else {
			handles.set(
				key,
				registerWebMCPTool(tool, { exposedTo: group.exposedTo, modal: group.surface })
			);
		}
	}
	for (const [key, handle] of handles) {
		if (groups.has(key)) continue;
		handle.remove();
		handles.delete(key);
	}
}

// A page mounts its buttons together, and they need to be laid out to tell if they are visible.
function scheduleRefresh(): void {
	clearTimeout(timer);
	timer = setTimeout(refresh, REFRESH_DELAY);
}

/** Offers a button to agents until the returned function runs. */
export function trackButton(button: TrackedButton): () => void {
	tracked.add(button);
	scheduleRefresh();
	return () => {
		tracked.delete(button);
		scheduleRefresh();
	};
}
