import type { CommandGroup, CommandItem } from '../Command/command.props.js';
import { formatAIComposerTokenMarkdown } from './composer/markdown.js';
import type {
	RichTextInputItem,
	RichTextInputToken,
	RichTextInputTokenKind,
	RichTextInputTriggerConfig,
	RichTextInputTriggerContext,
	RichTextInputTriggers
} from './richTextInput.props.js';

export type RichTextInputResolvedSuggestion = {
	trigger: string;
	item: RichTextInputItem;
	token: RichTextInputToken;
	config: RichTextInputTriggerConfig;
};

type SearchableItem = {
	id: string;
	label: string;
	description?: string;
	keywords?: string[];
};

export function getRichTextInputSuggestionTitle(
	trigger: string | undefined,
	triggers: RichTextInputTriggers
) {
	if (!trigger) return 'Suggestions';
	return triggers[trigger]?.title ?? 'Suggestions';
}

export function getRichTextInputSuggestionEmpty(
	trigger: string | undefined,
	triggers: RichTextInputTriggers
) {
	if (!trigger) return 'No results found.';
	return triggers[trigger]?.empty ?? 'No results found.';
}

export function buildRichTextInputGroups(
	trigger: string,
	config: RichTextInputTriggerConfig,
	items: RichTextInputItem[],
	query: string,
	shouldFilter: boolean
): CommandGroup<string>[] {
	const filteredItems = shouldFilter ? items.filter((item) => itemMatches(item, query)) : items;
	const groups = new Map<string, CommandItem<string>[]>();
	for (const item of filteredItems) {
		const heading = getItemGroup(config, item);
		const groupItems = groups.get(heading) ?? [];
		groupItems.push({
			value: getSuggestionValue(trigger, item),
			label: item.label,
			icon: item.icon,
			keywords: item.keywords
		});
		groups.set(heading, groupItems);
	}
	return [...groups].map(([heading, groupItems]) => ({ heading, items: groupItems }));
}

export function resolveRichTextInputSuggestion(
	value: string,
	triggers: RichTextInputTriggers,
	itemsByTrigger: Map<string, RichTextInputItem[]>
): RichTextInputResolvedSuggestion | null {
	const separatorIndex = value.indexOf(':');
	if (separatorIndex === -1) return null;
	const trigger = value.slice(0, separatorIndex);
	const id = value.slice(separatorIndex + 1);
	const config = triggers[trigger];
	if (!config) return null;
	const item = itemsByTrigger.get(trigger)?.find((candidate) => candidate.id === id);
	if (!item) return null;
	return {
		trigger,
		item,
		config,
		token: toRichTextInputToken(item, config, { trigger, query: '' })
	};
}

export function toRichTextInputToken(
	item: RichTextInputItem,
	config: RichTextInputTriggerConfig,
	context: RichTextInputTriggerContext
): RichTextInputToken {
	if (config.toToken) return config.toToken({ item, context });
	const kind = getTokenKind(item, config);
	const token: RichTextInputToken = {
		kind,
		id: item.id,
		label: item.label,
		path: kind === 'file' || kind === 'reference' ? item.path : undefined
	};
	token.markdown = getTokenMarkdown(item, token);
	const promptText = getPromptText(item);
	if (promptText !== undefined) token.promptText = promptText;
	return token;
}

function getSuggestionValue(trigger: string, item: RichTextInputItem) {
	return `${trigger}:${item.id}`;
}

function getItemGroup(config: RichTextInputTriggerConfig, item: RichTextInputItem) {
	if (typeof config.group === 'function')
		return config.group(item) ?? config.title ?? 'Suggestions';
	return config.group ?? item.group ?? config.title ?? 'Suggestions';
}

function getTokenKind(
	item: RichTextInputItem,
	config: RichTextInputTriggerConfig
): RichTextInputTokenKind {
	if (typeof config.tokenKind === 'function') return config.tokenKind(item);
	const kind = item.kind ?? config.tokenKind;
	if (!kind) {
		throw new Error(`RichTextInput item "${item.id}" is missing a token kind.`);
	}
	return kind;
}

function getTokenMarkdown(item: RichTextInputItem, token: RichTextInputToken) {
	if (typeof item.markdown === 'function') return item.markdown(item);
	return item.markdown ?? formatAIComposerTokenMarkdown(token);
}

function getPromptText(item: RichTextInputItem) {
	if (typeof item.promptText === 'function') return item.promptText(item);
	return item.promptText;
}

function matchesQuery(text: string | undefined, query: string) {
	return !query || (text ?? '').toLowerCase().includes(query.toLowerCase());
}

function itemMatches(item: SearchableItem, query: string) {
	if (!query) return true;
	return (
		matchesQuery(item.id, query) ||
		matchesQuery(item.label, query) ||
		matchesQuery(item.description, query) ||
		item.keywords?.some((keyword) => matchesQuery(keyword, query)) === true
	);
}
