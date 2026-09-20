import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import {
	$getRoot,
	$isParagraphNode,
	$isTextNode,
	$nodesOfType,
	SKIP_DOM_SELECTION_TAG,
	type LexicalNode,
	type LexicalEditor,
	type EditorUpdateOptions
} from 'lexical';
import type { RichTextInputFormat } from '../richTextInput.props.js';
import { getAIComposerMarkdownTransformers } from './markdown.js';
import type { AIComposerEditorChange } from './editor-change.js';
import { AIComposerTokenNode } from './token-node.js';

export const EXTERNAL_MARKDOWN_UPDATE = 'entasis:external-markdown';

export function loadComposerMarkdown(
	editor: LexicalEditor,
	markdown: string,
	formats?: readonly RichTextInputFormat[],
	options?: EditorUpdateOptions
) {
	// `selectEnd()` dirties the selection, and Lexical then writes it into the DOM — which
	// focuses the contenteditable and scrolls it into view. That is right while the user is
	// typing, but seeding an unfocused editor (mount, external `value` change) must stay
	// inert: a page with several composers would otherwise jump to the last one on load.
	const rootElement = editor.getRootElement();
	const hasFocus =
		typeof document !== 'undefined' &&
		rootElement !== null &&
		rootElement.contains(document.activeElement);
	const tags = [options?.tag ?? []].flat();
	editor.update(
		() => {
			const root = $getRoot();
			root.clear();
			$convertFromMarkdownString(markdown, getAIComposerMarkdownTransformers(formats), root, true);
			const selection = root.selectEnd();
			selection.setFormat(0);
			selection.setStyle('');
		},
		{ ...options, tag: hasFocus ? tags : [...tags, SKIP_DOM_SELECTION_TAG] }
	);
}

function isBlankParagraph(node: LexicalNode) {
	return (
		$isParagraphNode(node) &&
		node.getTextContent().trim().length === 0 &&
		node.getChildren().every((child) => $isTextNode(child))
	);
}

function readRootIsEmpty() {
	const root = $getRoot();
	if (root.getTextContent().trim().length > 0) return false;
	const children = root.getChildren();
	return children.length === 0 || (children.length === 1 && isBlankParagraph(children[0]));
}

export function readComposerChange(
	formats?: readonly RichTextInputFormat[]
): AIComposerEditorChange {
	const markdown = $convertToMarkdownString(
		getAIComposerMarkdownTransformers(formats),
		undefined,
		true
	).trimEnd();
	const tokens = $nodesOfType(AIComposerTokenNode).map((node) => node.getData());
	return {
		markdown,
		tokens,
		isEmpty: readRootIsEmpty()
	};
}
