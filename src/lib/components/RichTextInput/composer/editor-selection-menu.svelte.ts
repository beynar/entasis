import type { EdytorInstance } from 'edytor';
import {
	applyAIComposerSelectionFormat,
	applyAIComposerSelectionBlock,
	applyAIComposerSelectionLink,
	applyAIComposerSelectionList,
	readAIComposerSelectionState,
	type AIComposerSelectionBlockType,
	type AIComposerSelectionFormat,
	type AIComposerSelectionListType,
	type AIComposerSelectionState
} from './selection-formatting.js';

type AIComposerSelectionMenuOptions = {
	editor: EdytorInstance | null;
	rootElement: HTMLElement | null;
	suggestionMenuOpen: boolean;
	disabled: boolean;
};

type AIComposerSelectionMenuOptionsSource = () => AIComposerSelectionMenuOptions;

export class AIComposerSelectionMenuController {
	private currentSelection = $state<AIComposerSelectionState | null>(null);
	private dismissedSignature = $state<string | null>(null);
	private linkEditing = $state(false);

	constructor(private optionsSource: AIComposerSelectionMenuOptionsSource) {}

	get state() {
		return this.currentSelection;
	}

	get open() {
		const options = this.optionsSource();
		return !!this.currentSelection && !options.suggestionMenuOpen && !options.disabled;
	}

	get linkUrl() {
		return this.currentSelection?.linkUrl ?? '';
	}

	get formats() {
		return (
			this.currentSelection?.formats ?? {
				bold: false,
				italic: false,
				code: false,
				strikethrough: false,
				highlight: false
			}
		);
	}

	get blockType() {
		return this.currentSelection?.blockType ?? 'paragraph';
	}

	get listType() {
		return this.currentSelection?.listType ?? null;
	}

	update() {
		const options = this.optionsSource();
		if (options.suggestionMenuOpen || options.disabled) {
			this.clear();
			return;
		}

		const nextSelection = readAIComposerSelectionState(options.editor, options.rootElement, {
			requireAnchor: false
		});
		if (!nextSelection) {
			if (!this.linkEditing) this.currentSelection = null;
			return;
		}

		if (nextSelection.signature === this.dismissedSignature) {
			this.currentSelection = null;
			return;
		}

		this.dismissedSignature = null;
		this.currentSelection = nextSelection;
	}

	close() {
		this.dismissedSignature = this.currentSelection?.signature ?? null;
		this.clear();
	}

	setLinkEditing(isEditing: boolean) {
		this.linkEditing = isEditing;
	}

	reset() {
		this.currentSelection = null;
		this.dismissedSignature = null;
		this.linkEditing = false;
	}

	format(format: AIComposerSelectionFormat) {
		const selection = this.currentSelection?.selection;
		const editor = this.optionsSource().editor;
		if (!editor || !selection) return;
		applyAIComposerSelectionFormat(editor, selection, format);
		editor.focus();
	}

	list(listType: AIComposerSelectionListType) {
		const selection = this.currentSelection?.selection;
		const editor = this.optionsSource().editor;
		if (!editor || !selection) return;
		applyAIComposerSelectionList(editor, selection, listType);
		editor.focus();
	}

	block(blockType: AIComposerSelectionBlockType) {
		const selection = this.currentSelection?.selection;
		const editor = this.optionsSource().editor;
		if (!editor || !selection) return;
		applyAIComposerSelectionBlock(editor, selection, blockType);
		editor.focus();
	}

	link(url: string | null) {
		const selection = this.currentSelection?.selection;
		const editor = this.optionsSource().editor;
		if (!editor || !selection) return;
		this.linkEditing = false;
		applyAIComposerSelectionLink(editor, selection, url);
		editor.focus();
	}

	private clear() {
		this.currentSelection = null;
		this.linkEditing = false;
	}
}
