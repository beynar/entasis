import type { CommandGroup } from '../Command/command.props.js';
import type { TriggerState } from './composer/trigger.js';
import type {
	RichTextInputItem,
	RichTextInputSearchResult,
	RichTextInputTriggerConfig,
	RichTextInputTriggers
} from './richTextInput.props.js';
import {
	buildRichTextInputGroups,
	toRichTextInputToken,
	type RichTextInputResolvedSuggestion
} from './suggestions.js';

export type RichTextInputSearchStatus = 'idle' | 'loading' | 'error';

export type RichTextInputSearchOptions = {
	menu: TriggerState | null;
	triggers: RichTextInputTriggers;
};

export type RichTextInputSearchOptionsSource = () => RichTextInputSearchOptions;

export class RichTextInputSearch {
	private searchedItems = $state<RichTextInputItem[]>([]);
	private searchedTriggerKey = $state('');
	private statusValue = $state<RichTextInputSearchStatus>('idle');
	private errorValue = $state<unknown | null>(null);
	private requestIdValue = $state<number | null>(null);
	private searchRequestId = 0;

	constructor(private optionsSource: RichTextInputSearchOptionsSource) {
		$effect(() => this.search());
	}

	get groups(): CommandGroup<string>[] {
		const menu = this.options.menu;
		if (!menu) return [];
		const config = this.getConfig(menu);
		if (!config) return [];
		const triggerKey = getTriggerKey(menu);
		const items =
			config.onSearch && this.shouldUseSearchedItems(triggerKey)
				? this.searchedItems
				: (config.items ?? []);
		return buildRichTextInputGroups(
			menu.trigger,
			config,
			items,
			menu.query,
			!(config.onSearch && this.shouldUseSearchedItems(triggerKey))
		);
	}

	get status(): RichTextInputSearchStatus {
		return this.statusValue;
	}

	get error(): unknown | null {
		return this.errorValue;
	}

	get requestId(): number | null {
		return this.requestIdValue;
	}

	resolve(value: string): RichTextInputResolvedSuggestion | null {
		const menu = this.options.menu;
		if (!menu) return null;
		const config = this.getConfig(menu);
		if (!config) return null;
		const triggerKey = getTriggerKey(menu);
		const items =
			config.onSearch && this.shouldUseSearchedItems(triggerKey)
				? this.searchedItems
				: (config.items ?? []);
		const item = resolveItem(value, menu.trigger, items);
		if (!item) return null;
		return {
			trigger: menu.trigger,
			item,
			config,
			token: toRichTextInputToken(item, config, { trigger: menu.trigger, query: menu.query })
		};
	}

	private get options() {
		return this.optionsSource();
	}

	private getConfig(menu: TriggerState): RichTextInputTriggerConfig | undefined {
		return this.options.triggers[menu.trigger];
	}

	private shouldUseSearchedItems(triggerKey: string) {
		return this.statusValue === 'idle' && this.searchedTriggerKey === triggerKey;
	}

	private search() {
		const requestId = ++this.searchRequestId;
		const menu = this.options.menu;
		if (!menu) {
			this.clear();
			return;
		}
		const config = this.getConfig(menu);
		if (!config?.onSearch) {
			this.searchedItems = [];
			this.searchedTriggerKey = '';
			this.clearSearchState();
			return;
		}
		const triggerKey = getTriggerKey(menu);
		this.searchedItems = [];
		this.searchedTriggerKey = triggerKey;
		let result: RichTextInputSearchResult<RichTextInputItem>;
		try {
			result = config.onSearch({ trigger: menu.trigger, query: menu.query });
		} catch (error: unknown) {
			this.handleSearchError(error, requestId);
			return;
		}
		if (!isPromiseLike(result)) {
			this.searchedItems = result;
			this.finishSearch();
			return;
		}
		this.startSearch(requestId);
		result
			.then((items) => this.finishSearchResult(items, triggerKey, requestId))
			.catch((error: unknown) => this.handleSearchError(error, requestId));
	}

	private clear() {
		this.searchedItems = [];
		this.searchedTriggerKey = '';
		this.clearSearchState();
	}

	private clearSearchState() {
		this.statusValue = 'idle';
		this.errorValue = null;
		this.requestIdValue = null;
	}

	private startSearch(requestId: number) {
		this.statusValue = 'loading';
		this.errorValue = null;
		this.requestIdValue = requestId;
	}

	private finishSearch() {
		this.statusValue = 'idle';
		this.errorValue = null;
		this.requestIdValue = null;
	}

	private finishSearchResult(items: RichTextInputItem[], triggerKey: string, requestId: number) {
		const currentMenu = this.options.menu;
		if (
			this.isCurrentSearch(requestId) &&
			currentMenu &&
			getTriggerKey(currentMenu) === triggerKey
		) {
			this.searchedItems = items;
			this.finishSearch();
		}
	}

	private handleSearchError(error: unknown, requestId: number) {
		if (!this.isCurrentSearch(requestId)) return;
		this.searchedItems = [];
		this.statusValue = 'error';
		this.errorValue = error;
		queueMicrotask(() => {
			throw error;
		});
	}

	private isCurrentSearch(requestId: number) {
		return requestId === this.searchRequestId;
	}
}

function getTriggerKey(trigger: TriggerState) {
	return `${trigger.trigger}:${trigger.query}`;
}

function resolveItem(value: string, trigger: string, items: RichTextInputItem[]) {
	const separatorIndex = value.indexOf(':');
	if (separatorIndex === -1) return null;
	if (value.slice(0, separatorIndex) !== trigger) return null;
	const id = value.slice(separatorIndex + 1);
	return items.find((item) => item.id === id) ?? null;
}

function isPromiseLike<T>(value: RichTextInputSearchResult<T>): value is Promise<T[]> {
	return typeof (value as Promise<T[]>).then === 'function';
}
