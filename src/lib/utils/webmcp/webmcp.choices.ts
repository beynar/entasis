// One tool whose options come from many components: every Button a person could press behind
// `click_button`, every menu row behind `run_command`, every link behind `navigate`. An agent reads
// one short list instead of a tool per row. Options the browser may want confirmed get a tool of
// their own, because a hint is per tool. Options that read the same can get a tool that tells them
// apart, kept out of the list because that text is often written by users.

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
	/**
	 * What tells it apart from `peers`, the options that read the same. Read only for those, by a
	 * tool with `read` set. An empty text means nothing does.
	 */
	context?: (peers: WebMCPChoice[]) => string;
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
	/** The tool that tells apart options that read the same, present while there are some. */
	read?: {
		name: string;
		/** Its name for the consequential options. */
		consequentialName: string;
		title: string;
		description: string;
	};
};

type Option = {
	id: string;
	choice: WebMCPChoice;
	/** "(2 of 3)" when other options read the same. */
	rank?: string;
	/** What the read tool gives for it. `null` when nothing tells it apart. */
	context?: string | null;
};

type Group = {
	surface: string | undefined;
	consequential: boolean;
	exposedTo: string[] | undefined;
	choices: Option[];
};

const REFRESH_DELAY = 50;

const titleOf = ({ label, description }: WebMCPChoice): string =>
	[toolText(label), toolText(description)].filter(Boolean).join(': ');

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
	// What the read tool last said, by group: picking goes by it, so the row is the one that was read.
	const reads = new Map<string, Map<unknown, string>>();
	const warned = new Set<string>();
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

	/**
	 * Ranks the options that read the same and finds what tells them apart. A consequential one that
	 * nothing does is left out: an agent could only pick it at random. Any other stays, as trying it
	 * costs little.
	 */
	function separateHomonyms(entry: Group): void {
		const sameTitle = new Map<string, Option[]>();
		for (const option of entry.choices) {
			const title = titleOf(option.choice);
			sameTitle.set(title, [...(sameTitle.get(title) ?? []), option]);
		}
		for (const [title, same] of sameTitle) {
			if (same.length < 2) continue;
			const contexts = same.map(({ choice }) =>
				toolText(choice.context?.(same.map((option) => option.choice)) ?? '')
			);
			same.forEach((option, index) => {
				const context = contexts[index];
				option.context =
					context && contexts.indexOf(context) === contexts.lastIndexOf(context) ? context : null;
			});
			if (DEV && same.some(({ context }) => !context) && !warned.has(title)) {
				warned.add(title);
				console.warn(
					`[WebMCP] Nothing tells apart the "${title}" options of ${options.name}. Give them a \`tool.description\`.`
				);
			}
			const kept = same.filter(({ context }) => context || !entry.consequential);
			kept.forEach((option, index) => {
				option.rank = `(${index + 1} of ${kept.length})`;
			});
			entry.choices = entry.choices.filter(
				(option) => !same.includes(option) || kept.includes(option)
			);
		}
	}

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
		if (options.read) {
			for (const [key, entry] of groups) {
				separateHomonyms(entry);
				if (entry.choices.length === 0) groups.delete(key);
			}
		}
		return groups;
	}

	const readName = (entry: Group): string | undefined =>
		entry.consequential ? options.read?.consequentialName : options.read?.name;

	const mustBeRead = (entry: Group): boolean => entry.choices.some(({ context }) => context);

	function buildTool(key: string, entry: Group) {
		const { param } = options;
		const description = entry.consequential
			? options.consequentialDescription
			: options.description;
		return {
			name: entry.consequential ? options.consequentialName : options.name,
			title: options.title,
			description: mustBeRead(entry)
				? `${description} Options numbered like "(2 of 3)" read the same: call ${readName(entry)} first to tell them apart.`
				: description,
			inputSchema: {
				type: 'object',
				properties: {
					[param]: {
						type: 'string',
						enum: entry.choices.map(({ id }) => id),
						oneOf: entry.choices.map(({ id, choice, rank }) => ({
							const: id,
							title: rank ? `${titleOf(choice)} ${rank}` : titleOf(choice)
						}))
					}
				},
				required: [param],
				additionalProperties: false
			},
			annotations: { consequentialHint: entry.consequential },
			execute: async (input: Record<string, unknown>) => {
				// What is true now, not when the list was built: a row may have gone since.
				const fresh = group().get(key);
				const option = fresh?.choices.find(({ id }) => id === input[param]);
				const picked = option?.choice;
				if (!option || !fresh || !picked || picked.available?.() === false) {
					refresh();
					return { status: 'unavailable', message: 'This cannot be used right now.' };
				}
				// Unread, or it now belongs to another row: the agent cannot know what it would hit.
				if (option.context && reads.get(key)?.get(picked.key) !== option.context) {
					return {
						status: 'read_first',
						message: `Several options read the same. Call ${readName(fresh)} and pick by what it says.`
					};
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

	function buildReadTool(key: string, entry: Group) {
		return {
			name: readName(entry) as string,
			title: options.read?.title,
			description: options.read?.description as string,
			inputSchema: { type: 'object', properties: {}, additionalProperties: false },
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: () => {
				const same = (group().get(key)?.choices ?? []).filter(({ rank }) => rank);
				reads.set(
					key,
					new Map(same.flatMap((o) => (o.context ? [[o.choice.key, o.context]] : [])))
				);
				return {
					options: same.map((option) => ({
						[options.param]: option.id,
						label: titleOf(option.choice),
						context: option.context
					}))
				};
			}
		};
	}

	function refresh(): void {
		clearTimeout(timer);
		const groups = group();
		const wanted = new Set<string>();
		const place = (key: string, tool: Parameters<typeof registerWebMCPTool>[0], entry: Group) => {
			wanted.add(key);
			const handle = handles.get(key);
			if (handle) handle.update(tool, { exposedTo: entry.exposedTo });
			else {
				handles.set(
					key,
					registerWebMCPTool(tool, { exposedTo: entry.exposedTo, modal: entry.surface })
				);
			}
		};
		for (const [key, entry] of groups) {
			place(key, buildTool(key, entry), entry);
			if (mustBeRead(entry)) place(`${key}:read`, buildReadTool(key, entry), entry);
		}
		for (const [key, handle] of handles) {
			if (wanted.has(key)) continue;
			handle.remove();
			handles.delete(key);
			reads.delete(key);
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
