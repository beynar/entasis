import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import {
	$getRoot,
	$isParagraphNode,
	$isTextNode,
	$nodesOfType,
	type LexicalNode,
	type LexicalEditor,
	type EditorUpdateOptions
} from 'lexical';
import type { RichTextInputFormat } from '../richTextInput.props.js';
import { getAIComposerMarkdownTransformers } from './markdown.js';
import type { AIComposerEditorChange } from './editor-change.js';
import { AIComposerTokenNode } from './token-node.js';

export const EXTERNAL_MARKDOWN_UPDATE = 'svelai:external-markdown';

export function loadComposerMarkdown(
	editor: LexicalEditor,
	markdown: string,
	formats?: readonly RichTextInputFormat[],
	options?: EditorUpdateOptions
) {
	editor.update(() => {
		const root = $getRoot();
		root.clear();
		$convertFromMarkdownString(markdown, getAIComposerMarkdownTransformers(formats), root, true);
		const selection = root.selectEnd();
		selection.setFormat(0);
		selection.setStyle('');
	}, options);
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
