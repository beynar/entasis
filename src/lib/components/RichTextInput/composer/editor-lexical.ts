import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode, registerList } from '@lexical/list';
import { registerMarkdownShortcuts } from '@lexical/markdown';
import { HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import {
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
	createEditor,
	type LexicalEditor
} from 'lexical';
import type { RichTextInputFormat, RichTextInputSubmitShortcut } from '../richTextInput.props.js';
import { getAIComposerMarkdownTransformers } from './markdown.js';
import { AIComposerTokenNode } from './token-node.js';
import { EXTERNAL_MARKDOWN_UPDATE, loadComposerMarkdown } from './editor-markdown.js';
import { RICH_TEXT_INPUT_LEXICAL_THEME } from './editor.lexicalTheme.js';
import { registerAIComposerKeyboard, type AIComposerSuggestionHandle } from './keyboard.js';
import { registerAIComposerPaste } from './editor-paste.js';
import type { TriggerState } from './trigger.js';

type MountAIComposerEditorOptions = {
	rootElement: HTMLDivElement | null;
	value: string;
	disabled: boolean;
	getMenu: () => TriggerState | null;
	getSuggestions: () => AIComposerSuggestionHandle | undefined;
	getSubmitShortcut: () => RichTextInputSubmitShortcut;
	getFormats: () => readonly RichTextInputFormat[];
	closeMenu: () => void;
	onSubmitShortcut?: (event: KeyboardEvent) => void;
	onUpdate: (isExternal: boolean) => void;
	onSelectionChange: () => void;
};

export function mountAIComposerLexicalEditor(options: MountAIComposerEditorOptions) {
	const editor = createEditor({
		namespace: 'AIComposer',
		nodes: [ListNode, ListItemNode, LinkNode, HeadingNode, QuoteNode, AIComposerTokenNode],
		onError(error) {
			throw error;
		},
		theme: RICH_TEXT_INPUT_LEXICAL_THEME
	});

	editor.setRootElement(options.rootElement);
	const cleanup = mergeRegister(
		registerRichText(editor),
		registerList(editor),
		registerHistory(editor, createEmptyHistoryState(), 300),
		registerMarkdownShortcuts(editor, getAIComposerMarkdownTransformers(options.getFormats())),
		registerAIComposerKeyboard(editor, {
			getMenu: options.getMenu,
			getSuggestions: options.getSuggestions,
			getSubmitShortcut: options.getSubmitShortcut,
			closeMenu: options.closeMenu,
			onSubmitShortcut: options.onSubmitShortcut
		}),
		registerAIComposerPaste(editor, {
			closeMenu: options.closeMenu,
			getFormats: options.getFormats
		}),
		editor.registerUpdateListener(({ editorState, tags }) => {
			editorState.read(() => options.onUpdate(tags.has(EXTERNAL_MARKDOWN_UPDATE)));
		}),
		editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				editor.getEditorState().read(options.onSelectionChange);
				return false;
			},
			COMMAND_PRIORITY_LOW
		)
	);

	loadComposerMarkdown(editor, options.value, options.getFormats(), {
		tag: EXTERNAL_MARKDOWN_UPDATE,
		discrete: true
	});
	editor.setEditable(!options.disabled);

	return {
		editor,
		cleanup() {
			cleanup();
			editor.setRootElement(null);
		}
	};
}
