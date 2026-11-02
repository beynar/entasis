// Edits the input makes itself, outside typing: a new value from the parent, text or a token placed
// at the selection, a suggestion's token over its trigger, the caret at the end.
import type { EdytorInstance as Edytor, JSONBlock, JSONDoc } from 'edytor';
import { toBlockSpec } from 'edytor/crdt/edytor';
import { tokenAtom, type AIComposerTokenData } from './markdown.js';
import type { TriggerState } from './trigger.js';

const contentLength = (content: JSONBlock['content']) =>
	(content ?? []).reduce((length, part) => length + ('text' in part ? part.text.length : 1), 0);

/** The last block in document order (a list's last nested item). */
function lastBlock(doc: JSONDoc): JSONBlock | null {
	let last: JSONBlock | null = null;
	let blocks: JSONBlock[] | undefined = doc.children;
	while (blocks?.length) {
		last = blocks[blocks.length - 1];
		blocks = last.children;
	}
	return last;
}

function setCaret(edytor: Edytor, blockId: string | undefined, offset: number) {
	const block = blockId ? edytor.idToBlock.get(blockId) : undefined;
	if (block) edytor.selection.setCaret({ block, offset });
}

export function placeCaretAtEnd(edytor: Edytor) {
	const block = lastBlock(edytor.value);
	setCaret(edytor, block?.id, contentLength(block?.content));
}

/**
 * Replace the whole document, as a parent's new value. Written on the document itself, so it
 * also lands while the input is read-only or disabled, and runs no typing rule.
 */
export function replaceDocument(edytor: Edytor, doc: JSONDoc) {
	const { document } = edytor;
	const blocks = doc.children.length ? doc.children : [{ type: 'paragraph', content: [] }];
	document.transact(() => {
		for (const id of document.childrenIds(null)) document.deleteBlock(id, { keepChildren: false });
		document.insertBlocks({ parent: null, index: 0 }, blocks);
	});
}

/**
 * Place a document at the selection, over a selected range: one paragraph as inline content at
 * the caret, more as blocks. With no selection yet, at the document's end. Returns whether it
 * was written.
 */
export function insertDocAtSelection(edytor: Edytor, doc: JSONDoc) {
	if (doc.children.length === 0) return false;
	if (edytor.selection.value.kind === 'none') placeCaretAtEnd(edytor);
	const { start, end, isCollapsed, kind } = edytor.selection.projection;
	if (kind !== 'text' || !start || !end) return false;

	const [first] = doc.children;
	const inline = doc.children.length === 1 && first.type === 'paragraph' && !first.children?.length;
	const specs = doc.children.map((block) => toBlockSpec(block));
	// A line without a kind is an inline run: it joins the block at the caret.
	const lines = inline ? specs.map(({ id, content }) => ({ id, content })) : specs;
	// Blocks pasted into an empty paragraph take its place, rather than following it.
	const caretBlock = edytor.document.blockJSON(start.block);
	const fillsEmptyParagraph =
		!inline &&
		isCollapsed &&
		caretBlock.type === 'paragraph' &&
		!caretBlock.content?.length &&
		!caretBlock.children?.length;
	const written = edytor.transact(() => {
		if (!isCollapsed) edytor.deleteRange(start, end);
		const target = fillsEmptyParagraph ? { replace: [start.block] } : start;
		return edytor.insertFlow(target, { lines }).status === 'applied';
	});
	if (!written) return false;
	if (inline) setCaret(edytor, start.block, start.offset + contentLength(first.content));
	else {
		const last = specs[specs.length - 1];
		setCaret(edytor, last.id, contentLength(doc.children[doc.children.length - 1].content));
	}
	return true;
}

/** Text at the selection, as typed: no markdown read. */
export function insertTextAtSelection(edytor: Edytor, text: string) {
	if (!text) return false;
	return insertDocAtSelection(edytor, {
		children: [{ type: 'paragraph', content: [{ text }] }]
	});
}

/** A token at the selection, a space after it so typing goes on beside it. */
export function insertTokenAtSelection(edytor: Edytor, data: AIComposerTokenData) {
	return insertDocAtSelection(edytor, {
		children: [{ type: 'paragraph', content: [tokenAtom(data), { text: ' ' }] }]
	});
}

/** A suggestion's token over its trigger and query, one undo step, the caret after its space. */
export function insertTokenForTrigger(
	edytor: Edytor,
	menu: TriggerState,
	data: AIComposerTokenData
) {
	const { blockId, startOffset, endOffset } = menu;
	const written = edytor.transact(() => {
		if (endOffset > startOffset) edytor.deleteText(blockId, startOffset, endOffset - startOffset);
		if (edytor.insertInline(blockId, startOffset, tokenAtom(data)).status !== 'applied')
			return false;
		edytor.insertText(blockId, startOffset + 1, ' ');
		return true;
	});
	if (written) setCaret(edytor, blockId, startOffset + 2);
	return written;
}
