import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { bind } from '$lib/utils/state.svelte.js';
import type { LexicalEditor } from 'lexical';
import type { AnchoredReference } from './anchored-reference.js';
import { mountAIComposerLexicalEditor } from './composer/editor-lexical.js';
import {
	EXTERNAL_MARKDOWN_UPDATE,
	loadComposerMarkdown,
	readComposerChange
} from './composer/editor-markdown.js';
import { AIComposerSelectionMenuController } from './composer/editor-selection-menu.svelte.js';
import {
	insertAIComposerTextAtSelection,
	insertAIComposerToken,
	insertAIComposerTokenAtSelection
} from './composer/insert-token.js';
import { handleEditorFormatKeydown, type AIComposerSuggestionHandle } from './composer/keyboard.js';
import {
	createCaretAnchor,
	isSameTriggerState,
	readTriggerState,
	type TriggerState
} from './composer/trigger.js';
import { RichTextInputFixedToolbarController } from './fixed-toolbar-controller.svelte.js';
import type {
	RichTextInputChange,
	RichTextInputFormat,
	RichTextInputItem,
	RichTextInputSubmitShortcut,
	RichTextInputSuggestionLifecycleCallback,
	RichTextInputToolbar,
	RichTextInputToken,
	RichTextInputTriggers
} from './richTextInput.props.js';
import { RichTextInputSearch } from './search.svelte.js';
import { RichTextInputSuggestionLifecycle } from './suggestion-lifecycle.svelte.js';
import {
	getRichTextInputSuggestionEmpty,
	getRichTextInputSuggestionTitle,
	toRichTextInputToken
} from './suggestions.js';

type RichTextInputStateOptions = {
	value: string;
	triggers: RichTextInputTriggers;
	onSuggestionOpen?: RichTextInputSuggestionLifecycleCallback;
	onSuggestionClose?: RichTextInputSuggestionLifecycleCallback;
	onSuggestionQueryChange?: RichTextInputSuggestionLifecycleCallback;
	onSuggestionHighlightChange?: RichTextInputSuggestionLifecycleCallback;
	onValueChange?: (change: RichTextInputChange) => void;
	onSubmitShortcut?: (event: KeyboardEvent) => void;
	submitShortcut: RichTextInputSubmitShortcut;
	toolbar: RichTextInputToolbar;
	formats: RichTextInputFormat[];
	disabled: boolean;
};

export interface RichTextInputState extends RichTextInputStateOptions {}

export class RichTextInputState {
	rootElement = $state<HTMLDivElement | null>(null);
	editor = $state<LexicalEditor | null>(null);
	isEmpty = $state(true);
	menu = $state<TriggerState | null>(null);
	caretAnchor = $state<AnchoredReference | null>(null);
	suggestions = $state<AIComposerSuggestionHandle | undefined>();
	selectionMenuHandle = $state<{ focusFirst: () => void } | undefined>();
	lastMarkdown = $state('');
	highlightedSuggestionValue = $state<string | null>(null);

	triggerCharacters = $derived(Object.keys(this.triggers));
	hasToolbarFormats = $derived(this.formats.length > 0);
	showHoverToolbar = $derived(
		this.hasToolbarFormats && (this.toolbar === 'hover' || this.toolbar === 'both')
	);
	showFixedToolbar = $derived(
		this.hasToolbarFormats && (this.toolbar === 'fixed' || this.toolbar === 'both')
	);
	search = new RichTextInputSearch(() => ({
		menu: this.menu,
		triggers: this.triggers
	}));
	suggestionTitle = $derived.by(() =>
		getRichTextInputSuggestionTitle(this.menu?.trigger, this.triggers)
	);
	suggestionEmpty = $derived.by(() =>
		getRichTextInputSuggestionEmpty(this.menu?.trigger, this.triggers)
	);
	suggestionGroups = $derived.by(() => this.search.groups);
	suggestionStatus = $derived(this.search.status);
	suggestionError = $derived(this.search.error);
	suggestionLifecycle = new RichTextInputSuggestionLifecycle(() => ({
		menu: this.menu,
		requestId: this.search.requestId,
		isLoading: this.suggestionStatus === 'loading',
		error: this.suggestionError,
		highlightedValue: this.highlightedSuggestionValue,
		groups: this.suggestionGroups,
		onSuggestionOpen: this.onSuggestionOpen,
		onSuggestionClose: this.onSuggestionClose,
		onSuggestionQueryChange: this.onSuggestionQueryChange,
		onSuggestionHighlightChange: this.onSuggestionHighlightChange
	}));
	selectionMenu = new AIComposerSelectionMenuController(() => ({
		editor: this.editor,
		rootElement: this.rootElement,
		suggestionMenuOpen: this.menu !== null,
		disabled: this.disabled
	}));
	fixedToolbar = new RichTextInputFixedToolbarController(() => ({
		editor: this.editor,
		rootElement: this.rootElement,
		enabled: this.showFixedToolbar
	}));

	constructor(options: RichTextInputStateOptions) {
		bind(this, options);
		this.lastMarkdown = this.value;
	}

	rootAttachment: Attachment<HTMLDivElement> = (node) =>
		untrack(() => {
			this.rootElement = node;
			const nextEditor = mountAIComposerLexicalEditor({
				rootElement: node,
				value: this.value,
				disabled: this.disabled,
				getMenu: () => this.menu,
				getSuggestions: () => this.suggestions,
				getSubmitShortcut: () => this.submitShortcut,
				getFormats: () => this.formats,
				closeMenu: this.closeMenu,
				onSubmitShortcut: this.onSubmitShortcut,
				onUpdate: this.emitChange,
				onSelectionChange: this.updateMenuFromSelection
			});
			this.editor = nextEditor.editor;
			this.lastMarkdown = this.value;

			return () => {
				nextEditor.cleanup();
				this.closeMenu();
				this.fixedToolbar.reset();
				this.selectionMenu.reset();
				if (this.editor === nextEditor.editor) this.editor = null;
				if (this.rootElement === node) this.rootElement = null;
			};
		});

	updateMenuFromSelection = () => {
		const nextMenu = readTriggerState(this.triggerCharacters);
		if (!isSameTriggerState(this.menu, nextMenu)) {
			this.menu = nextMenu;
			this.caretAnchor = nextMenu ? createCaretAnchor(this.rootElement) : null;
		}
		this.fixedToolbar.update();
		this.selectionMenu.update();
	};

	emitChange = (isExternal: boolean) => {
		const change = readComposerChange(this.formats);
		const hasChanged = change.markdown !== this.lastMarkdown;
		this.lastMarkdown = isExternal ? this.value : change.markdown;
		this.isEmpty = change.isEmpty;
		if (!isExternal && hasChanged) {
			this.value = change.markdown;
			this.onValueChange?.(change);
		}
		this.updateMenuFromSelection();
	};

	closeMenu = () => {
		this.highlightedSuggestionValue = null;
		this.menu = null;
		this.caretAnchor = null;
	};

	handleSuggestionHighlightChange = (value: string | undefined) => {
		const nextValue = value ?? null;
		this.highlightedSuggestionValue = nextValue;
		this.suggestionLifecycle.handleHighlightChange(nextValue ?? undefined);
	};

	selectSuggestion = (value: string) => {
		if (!this.editor || !this.menu) return;
		const selection = this.search.resolve(value);
		if (!selection) return;
		insertAIComposerToken(this.editor, this.menu, selection.token);
		selection.config.onSelect?.({
			item: selection.item,
			context: { trigger: selection.trigger, query: this.menu.query }
		});
		this.closeMenu();
		this.editor.focus();
	};

	handleKeydown = (event: KeyboardEvent) => {
		handleEditorFormatKeydown(this.editor, event, this.formats);
		if (event.defaultPrevented) return;
		if (
			event.altKey &&
			!event.ctrlKey &&
			!event.metaKey &&
			event.key === 'F10' &&
			this.selectionMenu.open
		) {
			event.preventDefault();
			this.selectionMenuHandle?.focusFirst();
		}
	};

	focus = () => {
		this.editor?.focus();
	};

	clear = () => {
		if (!this.editor) return;
		this.closeMenu();
		loadComposerMarkdown(this.editor, '', this.formats);
	};

	insertText = (text: string) => {
		if (!this.editor) return;
		this.closeMenu();
		insertAIComposerTextAtSelection(this.editor, text);
		this.editor.focus();
	};

	insertItem = (trigger: string, item: RichTextInputItem) => {
		const config = this.triggers[trigger];
		if (!config) throw new Error(`RichTextInput trigger "${trigger}" is not configured.`);
		const context = { trigger, query: '' };
		if (!this.insertTokenData(toRichTextInputToken(item, config, context))) return;
		config.onSelect?.({ item, context });
	};

	insertToken = (token: RichTextInputToken) => {
		this.insertTokenData(token);
	};

	insertTokenData = (token: RichTextInputToken) => {
		if (!this.editor) return false;
		this.closeMenu();
		insertAIComposerTokenAtSelection(this.editor, token);
		this.editor.focus();
		return true;
	};

	syncEditable = () => {
		this.editor?.setEditable(!this.disabled);
	};

	syncValue = () => {
		if (!this.editor || this.value === this.lastMarkdown) return;
		this.lastMarkdown = this.value;
		loadComposerMarkdown(this.editor, this.value, this.formats, {
			tag: EXTERNAL_MARKDOWN_UPDATE,
			discrete: true
		});
	};
}
