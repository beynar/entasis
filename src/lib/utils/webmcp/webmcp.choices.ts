// One tool whose options come from many components: every Button a person could press behind
// `click_button`, every menu row behind `run_command`, every link behind `navigate`. An agent reads
// one short list instead of a tool per row. Options the browser may want confirmed get a tool of
// their own, because a hint is per tool.

import { DEV } from 'esm-env';
import {
	registerWebMCPTool,
	toolText,
	toToolName,
	type WebMCPToolHandle
} from './webmcp.registry.js';

export type WebMCPChoice = {
	/** Identity of the option: its id stays the same as long as this does. */
	key: unknown;
	/** What a person reads on it. An option without one is left out. */
	label: string;
	/** Added to the label for the model. */
	description?: string;
	/** The id the agent sends. Defaults to the slug of the label; the same id is offered once. */
	id?: string;
	/** Puts the option behind the tool the browser may ask the user to confirm. */
	consequential?: boolean;
	/** The modal Dialog it belongs to. */
	surface?: string;
	exposedTo?: string[];
	/** Checked again when the agent picks it, as the list can be behind the page. */
	available?: () => boolean;
	/** Places the option in document order among the others that have a node. */
	node?: Node;
	/** Acts on the option. */
	run: () => unknown;
};

/** Removes or refreshes what one contributor offers. */
export type WebMCPChoiceSource = { refresh: () => void; remove: () => void };

export type WebMCPChoiceToolOptions = {
	name: string;
	/** Name of the tool holding the consequential options. */
	consequentialName: string;
	title: string;
	description: string;
	consequentialDescription: string;
	/** The input property the agent fills in. */
	param: string;
	/** The `status` of a call that went through. */
	doneStatus: string;
	/** More options than this cost more than they give: the schema is sent on every turn. */
	limit: number;
};

type Group = {
	surface: string | undefined;
	consequential: boolean;
	exposedTo: string[] | undefined;
	choices: { id: string; choice: WebMCPChoice }[];
};

const REFRESH_DELAY = 50;

const inDocumentOrder = (left: WebMCPChoice, right: WebMCPChoice): number => {
	if (!left.node || !right.node) return 0;
	return left.node.compareDocumentPosition(right.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
};

/** Creates the tool; each component adds its options with `contribute`. */
export function createChoiceTool(options: WebMCPChoiceToolOptions) {
	const sources = new Set<() => WebMCPChoice[]>();
	const handles = new Map<string, WebMCPToolHandle>();
	// By contributor: two menus may both have a "Save", and each keeps its own id.
	const ids = new Map<() => WebMCPChoice[], Map<unknown, string>>();
	let timer: ReturnType<typeof setTimeout> | undefined;

	const idFor = (
		choice: WebMCPChoice,
		source: () => WebMCPChoice[],
		taken: Set<string>
	): string | null => {
		if (choice.id) return taken.has(choice.id) ? null : choice.id;
		const remembered = ids.get(source) ?? new Map<unknown, string>();
		ids.set(source, remembered);
		const known = remembered.get(choice.key);
		if (known && !taken.has(known)) return known;
		const base = toToolName(choice.label) ?? 'option';
		let id = base;
		for (let number = 2; taken.has(id); number += 1) id = `${base}_${number}`;
		remembered.set(choice.key, id);
		return id;
	};

	function group(): Map<string, Group> {
		const groups = new Map<string, Group>();
		const choices = [...sources]
			.flatMap((source) => source().map((choice) => ({ choice, source })))
			.filter(({ choice }) => toolText(choice.label) !== '')
			.sort((left, right) => inDocumentOrder(left.choice, right.choice));
		if (DEV && choices.length > options.limit) {
			console.warn(
				`[WebMCP] ${choices.length} options for ${options.name}; agents see ${options.limit}.`
			);
		}
		for (const { choice, source } of choices.slice(0, options.limit)) {
			const consequential = Boolean(choice.consequential);
			// One tool has one exposure: options for different origins cannot share it.
			const exposure = JSON.stringify(choice.exposedTo ?? null);
			const key = `${choice.surface ?? ''}:${consequential}:${exposure}`;
			const entry = groups.get(key) ?? {
				surface: choice.surface,
				consequential,
				exposedTo: choice.exposedTo,
				choices: []
			};
			const id = idFor(choice, source, new Set(entry.choices.map((item) => item.id)));
			if (id) entry.choices.push({ id, choice });
			groups.set(key, entry);
		}
		return groups;
	}

	function buildTool(key: string, entry: Group) {
		const { param } = options;
		return {
			name: entry.consequential ? options.consequentialName : options.name,
			title: options.title,
			description: entry.consequential ? options.consequentialDescription : options.description,
			inputSchema: {
				type: 'object',
				properties: {
					[param]: {
						type: 'string',
						enum: entry.choices.map(({ id }) => id),
						oneOf: entry.choices.map(({ id, choice }) => ({
							const: id,
							title: [toolText(choice.label), toolText(choice.description)]
								.filter(Boolean)
								.join(': ')
						}))
					}
				},
				required: [param],
				additionalProperties: false
			},
			annotations: { consequentialHint: entry.consequential },
			execute: async (input: Record<string, unknown>) => {
				// What is true now, not when the list was built: a row may have gone since.
				const current = group().get(key)?.choices;
				const picked = current?.find(({ id }) => id === input[param])?.choice;
				if (!picked || picked.available?.() === false) {
					refresh();
					return { status: 'unavailable', message: 'This cannot be used right now.' };
				}
				try {
					await picked.run();
				} catch {
					// The app's handler threw; its message is not written for a model.
					return { status: 'failed', [param]: input[param] };
				}
				// Acting often changes what is on screen, including what the options say.
				schedule();
				return { status: options.doneStatus, [param]: input[param] };
			}
		};
	}

	function refresh(): void {
		clearTimeout(timer);
		const groups = group();
		for (const [key, entry] of groups) {
			const tool = buildTool(key, entry);
			const handle = handles.get(key);
			if (handle) handle.update(tool, { exposedTo: entry.exposedTo });
			else {
				handles.set(
					key,
					registerWebMCPTool(tool, { exposedTo: entry.exposedTo, modal: entry.surface })
				);
			}
		}
		for (const [key, handle] of handles) {
			if (groups.has(key)) continue;
			handle.remove();
			handles.delete(key);
		}
	}

	// A page mounts its components together, and some need to be laid out to tell what they offer.
	function schedule(): void {
		clearTimeout(timer);
		timer = setTimeout(refresh, REFRESH_DELAY);
	}

	return {
		/** Adds what `source` returns, read each time the list is rebuilt. */
		contribute(source: () => WebMCPChoice[]): WebMCPChoiceSource {
			sources.add(source);
			schedule();
			return {
				refresh: schedule,
				remove() {
					sources.delete(source);
					ids.delete(source);
					schedule();
				}
			};
		}
	};
}
