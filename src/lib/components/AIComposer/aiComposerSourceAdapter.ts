import type {
	RichTextInputItem,
	RichTextInputSuggestionLifecycleState,
	RichTextInputTokenKind,
	RichTextInputTriggerConfig,
	RichTextInputTriggerContext,
	RichTextInputTriggers
} from '../RichTextInput/richTextInput.props.js';
import { toRichTextInputToken } from '../RichTextInput/suggestions.js';
import type {
	AIComposerCommand,
	AIComposerCommandSearch,
	AIComposerMentionItem,
	AIComposerMentionSearch,
	AIComposerSearchResult,
	AIComposerSkillItem,
	AIComposerSkillSearch,
	AIComposerSuggestionLifecycleCallback,
	AIComposerSuggestionLifecycleState,
	AIComposerTriggerSource
} from './aiComposer.props.js';

type MentionKind = 'mention' | 'file' | 'reference' | 'skill';

export type AIComposerSourceOptions = {
	commands?: AIComposerTriggerSource<AIComposerCommand> | readonly AIComposerCommand[];
	mentionItems?: readonly AIComposerMentionItem[];
	mentions?: AIComposerTriggerSource<AIComposerMentionItem>;
	references?: AIComposerTriggerSource<AIComposerMentionItem>;
	skills?: AIComposerTriggerSource<AIComposerSkillItem> | readonly AIComposerSkillItem[];
	onCommandSelect?: (command: AIComposerCommand) => void;
	onMentionSelect?: (item: AIComposerMentionItem) => void;
	onSkillSelect?: (skill: AIComposerSkillItem) => void;
	onCommandSearch?: AIComposerCommandSearch;
	onMentionSearch?: AIComposerMentionSearch;
	onSkillSearch?: AIComposerSkillSearch;
	onItemSelect?: (payload: { item: RichTextInputItem; kind: RichTextInputTokenKind }) => void;
};

export type AIComposerResolvedSources = {
	commands?: AIComposerTriggerSource<AIComposerCommand>;
	mentions?: AIComposerTriggerSource<AIComposerMentionItem>;
	references?: AIComposerTriggerSource<AIComposerMentionItem>;
	skills?: AIComposerTriggerSource<AIComposerSkillItem>;
	triggers: RichTextInputTriggers;
};

export function resolveAIComposerSources(
	options: AIComposerSourceOptions
): AIComposerResolvedSources {
	const commands = resolveCommands(options);
	const mentions = resolveMentions(options, 'mention');
	const references = resolveMentions(options, 'reference');
	const skills = resolveSkills(options);
	return {
		commands,
		mentions,
		references,
		skills,
		triggers: buildTriggers(commands, mentions, references, skills, options)
	};
}

export function getAIComposerMentionKind(
	item: AIComposerMentionItem,
	fallback: MentionKind
): MentionKind {
	return item.kind ?? item.type ?? fallback;
}

export function notifyAIComposerSuggestion(
	callback: AIComposerSuggestionLifecycleCallback | undefined,
	state: RichTextInputSuggestionLifecycleState
): void {
	const trigger = toSuggestionTrigger(state.trigger);
	callback?.({ ...state, trigger, kind: toSuggestionKind(trigger) });
}

function resolveCommands(
	options: AIComposerSourceOptions
): AIComposerTriggerSource<AIComposerCommand> | undefined {
	const source = toSource(options.commands);
	if (!source && !options.onCommandSearch) return undefined;
	return mergeSource(source, {
		kind: 'command',
		title: 'AI commands',
		empty: 'No commands found.',
		onSearch: options.onCommandSearch,
		onSelect: (item) => {
			options.onCommandSelect?.(item);
			options.onItemSelect?.({ item, kind: 'command' });
		}
	});
}

function resolveMentions(
	options: AIComposerSourceOptions,
	group: 'mention' | 'reference'
): AIComposerTriggerSource<AIComposerMentionItem> | undefined {
	const source = group === 'mention' ? options.mentions : options.references;
	const legacyItems = options.mentionItems ?? [];
	const items = legacyItems.flatMap((item) => {
		const kind = getAIComposerMentionKind(item, 'mention');
		const matches = group === 'mention' ? kind === 'mention' || kind === 'file' : kind === group;
		if (!matches) return [];
		return [{ ...item, kind, group: item.group ?? defaultGroup(kind) }];
	});
	if (!source && items.length === 0) return undefined;
	return mergeSource(source, {
		kind: group,
		items,
		onSelect: (item) => {
			options.onMentionSelect?.(item);
			options.onItemSelect?.({ item, kind: itemKind(item, group) });
		}
	});
}

function resolveSkills(
	options: AIComposerSourceOptions
): AIComposerTriggerSource<AIComposerSkillItem> | undefined {
	const source = toSource(options.skills);
	const items = toSkills(options.mentionItems ?? []);
	let search = options.onSkillSearch;
	if (!search && options.onMentionSearch) {
		const mentionSearch = options.onMentionSearch;
		search = (query) =>
			mapSearchResult(searchMentions(mentionSearch, query, 'skill'), (items) => toSkills(items));
	}
	if (!source && items.length === 0 && !search) return undefined;
	return mergeSource(source, {
		kind: 'skill',
		title: 'Skills',
		empty: 'No skills found.',
		items,
		onSearch: search,
		onSelect: (item) => {
			options.onSkillSelect?.(item);
			options.onItemSelect?.({ item, kind: 'skill' });
		}
	});
}

function mergeSource<Item extends RichTextInputItem>(
	source: AIComposerTriggerSource<Item> | undefined,
	compatibility: {
		kind: RichTextInputTokenKind;
		title?: string;
		empty?: string;
		items?: Item[];
		onSearch?: (query: string) => AIComposerSearchResult<Item>;
		onSelect?: (item: Item) => void;
	}
): AIComposerTriggerSource<Item> {
	return {
		...source,
		title: source?.title ?? compatibility.title,
		empty: source?.empty ?? compatibility.empty,
		items: dedupe([...(source?.items ?? []), ...(compatibility.items ?? [])]),
		tokenKind: source?.tokenKind ?? ((item) => item.kind ?? compatibility.kind),
		onSearch: combineSearch(source?.onSearch, compatibility.onSearch),
		onSelect: (payload) => {
			source?.onSelect?.(payload);
			compatibility.onSelect?.(payload.item);
		}
	};
}

function combineSearch<Item extends RichTextInputItem>(
	sourceSearch: AIComposerTriggerSource<Item>['onSearch'] | undefined,
	compatibilitySearch: ((query: string) => AIComposerSearchResult<Item>) | undefined
): AIComposerTriggerSource<Item>['onSearch'] {
	if (!sourceSearch && !compatibilitySearch) return undefined;
	return (context) =>
		combineSearchResults([
			sourceSearch ? sourceSearch(context) : [],
			compatibilitySearch ? compatibilitySearch(context.query) : []
		]);
}

function buildTriggers(
	commands: AIComposerTriggerSource<AIComposerCommand> | undefined,
	mentions: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	references: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	skills: AIComposerTriggerSource<AIComposerSkillItem> | undefined,
	options: AIComposerSourceOptions
): RichTextInputTriggers {
	const triggers: RichTextInputTriggers = {};
	if (commands) triggers['/'] = toTrigger(commands, 'command');
	if (mentions || references || options.onMentionSearch) {
		triggers['@'] = toAtTrigger(mentions, references, options);
	}
	if (skills) triggers['$'] = toTrigger(skills, 'skill');
	return triggers;
}

function toTrigger<Item extends RichTextInputItem>(
	source: AIComposerTriggerSource<Item>,
	kind: RichTextInputTokenKind
): RichTextInputTriggerConfig {
	const toToken = source.toToken;
	return {
		title: source.title,
		empty: source.empty,
		items: withKind(source.items, kind),
		group: toGroupResolver(source),
		tokenKind: toTokenKindResolver(source, kind),
		onSearch: source.onSearch
			? (context) =>
					mapSearchResult(source.onSearch?.(context) ?? [], (items) => withKind(items, kind))
			: undefined,
		onSelect: ({ item, context }) => source.onSelect?.({ item: item as Item, context }),
		toToken: toToken
			? ({ item, context }) => toToken({ item: item as Item, context })
			: undefined
	};
}

function toAtTrigger(
	mentions: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	references: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	options: AIComposerSourceOptions
): RichTextInputTriggerConfig {
	return {
		title: 'Mentions and references',
		empty: mentions?.empty ?? references?.empty,
		items: dedupe([
			...withKind(mentions?.items, 'mention'),
			...withKind(references?.items, 'reference')
		]),
		group: (item) => resolveGroup(atSource(item, mentions, references), item),
		tokenKind: (item) => itemKind(item, 'mention'),
		onSearch: createAtSearch(mentions, references, options.onMentionSearch),
		onSelect: ({ item, context }) => {
			const mention = requireMention(item);
			atSource(mention, mentions, references)?.onSelect?.({ item: mention, context });
		},
		toToken: ({ item, context }) => {
			const mention = requireMention(item);
			const source = atSource(mention, mentions, references);
			if (source?.toToken) return source.toToken({ item: mention, context });
			return toRichTextInputToken(mention, toFallbackConfig(source, mention), context);
		}
	};
}

function toFallbackConfig(
	source: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	item: AIComposerMentionItem
): RichTextInputTriggerConfig {
	return {
		title: source?.title,
		empty: source?.empty,
		group: source ? toGroupResolver(source) : undefined,
		tokenKind: itemKind(item, 'mention')
	};
}

function createAtSearch(
	mentions: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	references: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	compatibilitySearch: AIComposerMentionSearch | undefined
): RichTextInputTriggerConfig['onSearch'] {
	if (!mentions?.onSearch && !references?.onSearch && !compatibilitySearch) return undefined;
	return (context) =>
		combineSearchResults([
			searchSource(mentions, context, 'mention'),
			searchSource(references, context, 'reference'),
			mapSearchResult(
				compatibilitySearch ? searchMentions(compatibilitySearch, context.query, 'all') : [],
				(items) =>
					items
						.filter(isAtMention)
						.map((item) => ({ ...item, kind: getAIComposerMentionKind(item, 'mention') }))
			)
		]);
}

function searchSource(
	source: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	context: RichTextInputTriggerContext,
	kind: 'mention' | 'reference'
): AIComposerSearchResult<RichTextInputItem> {
	if (!source?.onSearch) return [];
	return mapSearchResult(source.onSearch(context), (items) => withKind(items, kind));
}

function searchMentions(
	search: AIComposerMentionSearch,
	query: string,
	type: 'all' | 'skill'
): AIComposerSearchResult<AIComposerMentionItem> {
	return search({ query, type });
}

function toSource<Item extends RichTextInputItem>(
	source: AIComposerTriggerSource<Item> | readonly Item[] | undefined
): AIComposerTriggerSource<Item> | undefined {
	if (!source) return undefined;
	if (Array.isArray(source)) return { items: Array.from(source) };
	return source as AIComposerTriggerSource<Item>;
}

function toSkills(items: readonly AIComposerMentionItem[]): AIComposerSkillItem[] {
	return items.flatMap((item) => {
		if (getAIComposerMentionKind(item, 'mention') !== 'skill') return [];
		return [{ ...item, type: 'skill', kind: 'skill', group: item.group ?? 'Skills' }];
	});
}

function toGroupResolver<Item extends RichTextInputItem>(
	source: AIComposerTriggerSource<Item>
): RichTextInputTriggerConfig['group'] {
	const group = source.group;
	if (typeof group !== 'function') return group;
	return (item) => group(item as Item);
}

function toTokenKindResolver<Item extends RichTextInputItem>(
	source: AIComposerTriggerSource<Item>,
	fallback: RichTextInputTokenKind
): RichTextInputTriggerConfig['tokenKind'] {
	const tokenKind = source.tokenKind;
	if (typeof tokenKind !== 'function') return tokenKind ?? fallback;
	return (item) => tokenKind(item as Item);
}

function atSource(
	item: RichTextInputItem,
	mentions: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	references: AIComposerTriggerSource<AIComposerMentionItem> | undefined
): AIComposerTriggerSource<AIComposerMentionItem> | undefined {
	return itemKind(item, 'mention') === 'reference' ? references : mentions;
}

function resolveGroup(
	source: AIComposerTriggerSource<AIComposerMentionItem> | undefined,
	item: RichTextInputItem
): string | undefined {
	if (!source) return item.group;
	if (typeof source.group === 'function') return source.group(item);
	return source.group ?? item.group ?? source.title;
}

function requireMention(item: RichTextInputItem): AIComposerMentionItem {
	const kind = item.kind;
	if (kind === 'command') {
		throw new Error(`AIComposer @ suggestion "${item.id}" cannot use the command token kind.`);
	}
	return { ...item, kind };
}

function withKind(
	items: readonly RichTextInputItem[] | undefined,
	fallback: RichTextInputTokenKind
): RichTextInputItem[] {
	return (items ?? []).map((item) => ({ ...item, kind: itemKind(item, fallback) }));
}

function itemKind(
	item: RichTextInputItem,
	fallback: RichTextInputTokenKind
): RichTextInputTokenKind {
	if (item.kind) return item.kind;
	if (!('type' in item)) return fallback;
	if (item.type === 'file' || item.type === 'reference' || item.type === 'skill') return item.type;
	return fallback;
}

function isAtMention(item: AIComposerMentionItem): boolean {
	const kind = getAIComposerMentionKind(item, 'mention');
	return kind === 'mention' || kind === 'file' || kind === 'reference';
}

function defaultGroup(kind: MentionKind): string | undefined {
	if (kind === 'file') return 'Files';
	if (kind === 'reference') return 'References';
	if (kind === 'skill') return 'Skills';
	return undefined;
}

function mapSearchResult<Item, MappedItem>(
	result: AIComposerSearchResult<Item>,
	map: (items: Item[]) => MappedItem[]
): AIComposerSearchResult<MappedItem> {
	if (isPromiseLike(result)) return result.then(map);
	return map(result);
}

function combineSearchResults<Item extends RichTextInputItem>(
	results: AIComposerSearchResult<Item>[]
): AIComposerSearchResult<Item> {
	if (results.some(isPromiseLike)) {
		return Promise.all(results).then((items) => dedupe(items.flat()));
	}
	return dedupe((results as Item[][]).flat());
}

function isPromiseLike<Item>(result: AIComposerSearchResult<Item>): result is Promise<Item[]> {
	return typeof (result as Promise<Item[]>).then === 'function';
}

function toSuggestionTrigger(trigger: string): AIComposerSuggestionLifecycleState['trigger'] {
	if (trigger === '/') return '/';
	if (trigger === '$') return '$';
	return '@';
}

function toSuggestionKind(
	trigger: AIComposerSuggestionLifecycleState['trigger']
): AIComposerSuggestionLifecycleState['kind'] {
	if (trigger === '/') return 'command';
	if (trigger === '$') return 'skill';
	return 'mention';
}

function dedupe<Item extends RichTextInputItem>(items: Item[]): Item[] {
	const byId = new Map<string, Item>();
	for (const item of items) byId.set(`${item.kind ?? 'item'}:${item.id}`, item);
	return [...byId.values()];
}
