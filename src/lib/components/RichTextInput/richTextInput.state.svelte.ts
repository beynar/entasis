import { createRichTextPlugin, type EdytorInstance, type JSONDoc, type Plugin } from 'edytor';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { AnchoredReference } from './anchored-reference.js';
import {
	insertDocAtSelection,
	insertTextAtSelection,
	insertTokenAtSelection,
	insertTokenForTrigger,
	placeCaretAtEnd,
	replaceDocument
} from './composer/editing.js';
import { AIComposerSelectionMenuController } from './composer/editor-selection-menu.svelte.js';
import { docToMarkdown, isDocEmpty, markdownToDoc, readDocTokens } from './composer/markdown.js';
import { createRichTextInputPlugin, type AIComposerSuggestionHandle } from './composer/plugin.js';
import { applyAIComposerSelectionLink } from './composer/selection-formatting.js';
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
	onValueChange?: (payload: RichTextInputChange) => void;
	onSubmitShortcut?: (event: KeyboardEvent) => void;
	submitShortcut: RichTextInputSubmitShortcut;
	toolbar: RichTextInputToolbar;
	formats: RichTextInputFormat[];
	disabled: boolean;
	/** The editor edits a shared document: it, not \`value\`, is the source of truth. */
	collaborative?: boolean;
};

const URL_RE = /^https?:\/\/\S+$/;

export class RichTextInputState extends createBindableStateClass<RichTextInputStateOptions>() {
	rootElement = $state<HTMLElement | null>(null);
	editor = $state<EdytorInstance | null>(null);
	isEmpty = $state(true);
	menu = $state<TriggerState | null>(null);
	caretAnchor = $state<AnchoredReference | null>(null);
	suggestions = $state<AIComposerSuggestionHandle | undefined>();
	selectionMenuHandle = $state<{ focusFirst: () => void } | undefined>();
	highlightedSuggestionValue = $state<string | null>(null);
	/** The document the editor mounts with; edytor reads its `value` once. */
	readonly initialDoc: JSONDoc;
	/** The editor's content as markdown, as last published or loaded. */
	private lastMarkdown: string;
	/** The `value` the editor last loaded or published, so a parent echo loads nothing. */
	private syncedValue: string;

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

	/** The plugins the editor mounts with: the input's own, then rich text. */
	readonly plugins: Plugin[];

	constructor(options: RichTextInputStateOptions) {
		super(options);
		this.initialDoc = markdownToDoc(this.value, this.formats);
		this.lastMarkdown = docToMarkdown(this.initialDoc);
		this.syncedValue = this.value;
		this.isEmpty = isDocEmpty(this.initialDoc);

		let instance: EdytorInstance | null = null;
		const plugin = createRichTextInputPlugin({
			getFormats: () => this.formats,
			getMenuOpen: () => this.menu !== null,
			getSuggestions: () => this.suggestions,
			getSubmitShortcut: () => this.submitShortcut,
			getOnSubmitShortcut: () => this.onSubmitShortcut,
			closeMenu: this.closeMenu,
			focusToolbar: this.focusToolbar,
			paste: this.paste,
			onChange: this.emitChange,
			onSelectionChange: this.updateMenuFromSelection,
			onAttached: (node) => {
				this.editor = instance;
				this.rootElement = node;
				// A shared document may already hold content (another view seeded it, a room loaded it)
				// that no change will announce: publish what the editor actually shows.
				if (instance) this.emitChange(instance.value);
				return () => {
					this.closeMenu();
					this.fixedToolbar.reset();
					this.selectionMenu.reset();
					if (this.editor === instance) this.editor = null;
					if (this.rootElement === node) this.rootElement = null;
				};
			}
		});
		// The plugin factory is where edytor hands over its view; it is published once attached.
		const capture: Plugin = (edytor) => {
			if (edytor) instance = edytor;
			return plugin(edytor);
		};
		this.plugins = [capture, createRichTextPlugin()];
	}

	updateMenuFromSelection = () => {
		const nextMenu = this.disabled ? null : readTriggerState(this.editor, this.triggerCharacters);
		if (!isSameTriggerState(this.menu, nextMenu)) {
			this.menu = nextMenu;
			this.caretAnchor = nextMenu ? createCaretAnchor(this.rootElement) : null;
		}
		this.fixedToolbar.update();
		this.selectionMenu.update();
	};

	emitChange = (doc: JSONDoc) => {
		const markdown = docToMarkdown(doc);
		this.isEmpty = isDocEmpty(doc);
		if (markdown !== this.lastMarkdown) {
			this.lastMarkdown = markdown;
			this.syncedValue = markdown;
			this.value = markdown;
			this.onValueChange?.({ markdown, tokens: readDocTokens(doc), isEmpty: this.isEmpty });
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
		const { editor, menu } = this;
		if (!editor || !menu) return;
		const selection = this.search.resolve(value);
		if (!selection) return;
		insertTokenForTrigger(editor, menu, selection.token);
		selection.config.onSelect?.({
			item: selection.item,
			context: { trigger: selection.trigger, query: menu.query }
		});
		this.closeMenu();
		editor.focus();
	};

	focusToolbar = () => {
		if (!this.selectionMenu.open || !this.selectionMenuHandle) return false;
		this.selectionMenuHandle.focusFirst();
		return true;
	};

	paste = (markdown: string) => {
		const editor = this.editor;
		if (!editor) return;
		this.closeMenu();
		const url = markdown.trim();
		const projection = editor.selection.projection;
		if (
			this.formats.includes('link') &&
			URL_RE.test(url) &&
			!projection.isCollapsed &&
			projection.content.trim().length > 0
		) {
			applyAIComposerSelectionLink(editor, editor.selection.value, url);
			return;
		}
		insertDocAtSelection(editor, markdownToDoc(markdown, this.formats));
	};

	focus = () => {
		const editor = this.editor;
		if (!editor) return;
		if (!editor.selection.projection.start) placeCaretAtEnd(editor);
		editor.focus();
	};

	focusEnd = () => {
		const editor = this.editor;
		if (!editor) return;
		placeCaretAtEnd(editor);
		editor.focus();
	};

	clear = () => {
		if (!this.editor) return;
		this.closeMenu();
		replaceDocument(this.editor, { children: [] });
		this.afterReplace();
	};

	insertText = (text: string) => {
		if (!this.editor) return;
		this.closeMenu();
		insertTextAtSelection(this.editor, text);
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
		insertTokenAtSelection(this.editor, token);
		this.editor.focus();
		return true;
	};

	/** A replaced document keeps no selection of the old one: the caret goes to its end if focused. */
	private afterReplace() {
		const editor = this.editor;
		const root = this.rootElement;
		if (!editor) return;
		if (root?.contains(document.activeElement)) placeCaretAtEnd(editor);
		else editor.selection.select({ kind: 'none' });
	}

	syncValue = () => {
		const value = this.value;
		const editor = this.editor;
		// A shared document is edited by everyone in it: a parent's value never replaces it.
		if (this.collaborative) return;
		if (!editor || value === this.syncedValue) return;
		this.syncedValue = value;
		const doc = markdownToDoc(value, this.formats);
		this.lastMarkdown = docToMarkdown(doc);
		this.closeMenu();
		replaceDocument(editor, doc);
		this.afterReplace();
	};
}
