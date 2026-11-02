import { richTextOperations, type EdytorInstance as Edytor } from 'edytor';
import type { AnchoredReference } from '../anchored-reference.js';
import type { RichTextInputFormat } from '../richTextInput.props.js';

export type AIComposerSelectionFormat = 'bold' | 'italic' | 'code' | 'strikethrough' | 'highlight';
export type AIComposerSelectionListType = 'bullet' | 'number';
export type AIComposerSelectionBlockType =
	'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote';

export type AIComposerSelectionFormats = Record<AIComposerSelectionFormat, boolean>;

/** The editor's selection, kept so a toolbar can act on it after taking focus (the link field). */
type SavedSelection = Edytor['selection']['value'];

export type AIComposerSelectionState = {
	anchor: AnchoredReference | null;
	selection: SavedSelection;
	signature: string;
	linkUrl: string;
	formats: AIComposerSelectionFormats;
	blockType: AIComposerSelectionBlockType;
	listType: AIComposerSelectionListType | null;
};

type ReadSelectionOptions = {
	requireText?: boolean;
	requireAnchor?: boolean;
};

export const AI_COMPOSER_DEFAULT_RICH_TEXT_FORMATS: RichTextInputFormat[] = [
	'bold',
	'italic',
	'code',
	'link',
	'bulletList',
	'orderedList'
];

export const AI_COMPOSER_ALL_RICH_TEXT_FORMATS: RichTextInputFormat[] = [
	'bold',
	'italic',
	'code',
	'strikethrough',
	'highlight',
	'link',
	'bulletList',
	'orderedList',
	'heading1',
	'heading2',
	'heading3',
	'quote'
];

/** The editor's mark for each toolbar format. */
const MARKS: Record<AIComposerSelectionFormat, string> = {
	bold: 'bold',
	italic: 'italic',
	code: 'code',
	strikethrough: 'strike',
	highlight: 'highlight'
};

const LIST_TYPES: Record<AIComposerSelectionListType, string> = {
	bullet: 'bulleted-list-item',
	number: 'numbered-list-item'
};

const isSet = (value: unknown) => value !== undefined && value !== null && value !== false;

function blockTypeOf(edytor: Edytor, blockId: string): AIComposerSelectionBlockType {
	const block = edytor.idToBlock.get(blockId);
	if (block?.type === 'quote') return 'quote';
	if (block?.type === 'heading') {
		const level = String(block.data?.level ?? 'h1');
		if (level === 'h2') return 'heading2';
		if (level === 'h3') return 'heading3';
		return 'heading1';
	}
	return 'paragraph';
}

function listTypeOf(edytor: Edytor, blockId: string): AIComposerSelectionListType | null {
	const type = edytor.idToBlock.get(blockId)?.type;
	if (type === LIST_TYPES.bullet) return 'bullet';
	if (type === LIST_TYPES.number) return 'number';
	return null;
}

export function readAIComposerSelectionState(
	edytor: Edytor | null,
	rootElement: HTMLElement | null,
	options: ReadSelectionOptions = {}
): AIComposerSelectionState | null {
	if (!edytor || !rootElement || typeof window === 'undefined') return null;
	const projection = edytor.selection.projection;
	const { start, end, isCollapsed } = projection;
	if (projection.kind !== 'text' || !start || !end) return null;
	if (options.requireText !== false) {
		if (isCollapsed || projection.content.trim().length === 0) return null;
	}
	// A range over a token formats nothing the token shows: no toolbar for it.
	if (!isCollapsed && projection.segments.some((segment) => segment.kind === 'inline')) return null;

	const anchor = createSelectedTextAnchor(rootElement);
	if (!anchor && options.requireAnchor !== false) return null;

	// At a caret, the marks the next character takes (a toolbar press stages them there).
	const marks = { ...projection.marks, ...(edytor.selection.pending ?? {}) };
	const link = marks.link as { href?: string } | null | undefined;
	return {
		anchor,
		selection: edytor.selection.value,
		signature: [start.block, start.offset, end.block, end.offset, projection.content].join(':'),
		linkUrl: isSet(link) ? (link?.href ?? '') : '',
		formats: {
			bold: isSet(marks.bold),
			italic: isSet(marks.italic),
			code: isSet(marks.code),
			strikethrough: isSet(marks.strike),
			highlight: isSet(marks.highlight)
		},
		blockType: blockTypeOf(edytor, start.block),
		listType: listTypeOf(edytor, start.block)
	};
}

/** Put the toolbar's selection back when focus left the editor (the link field took it). */
function restoreSelection(edytor: Edytor, selection: SavedSelection) {
	if (edytor.selection.value !== selection) edytor.selection.select(selection);
	return edytor.selection.projection.kind === 'text';
}

export function applyAIComposerSelectionFormat(
	edytor: Edytor,
	selection: SavedSelection,
	format: AIComposerSelectionFormat
) {
	if (!restoreSelection(edytor, selection)) return;
	richTextOperations(edytor).setMarkAtRange(MARKS[format]);
}

export function applyAIComposerSelectionList(
	edytor: Edytor,
	selection: SavedSelection,
	listType: AIComposerSelectionListType
) {
	if (!restoreSelection(edytor, selection)) return;
	const blocks = edytor.selection.projection.blocks;
	// Every selected block already in this list leaves it; otherwise they all join it.
	const leave = blocks.every((id) => listTypeOf(edytor, id) === listType);
	edytor.transact(() => {
		for (const id of blocks) edytor.setBlockType(id, leave ? 'paragraph' : LIST_TYPES[listType]);
	});
}

export function applyAIComposerSelectionBlock(
	edytor: Edytor,
	selection: SavedSelection,
	blockType: AIComposerSelectionBlockType
) {
	if (!restoreSelection(edytor, selection)) return;
	const blocks = edytor.selection.projection.blocks;
	edytor.transact(() => {
		for (const id of blocks) {
			if (blockType === 'paragraph' || blockType === 'quote') {
				edytor.setBlock(id, { type: blockType });
			} else {
				edytor.setBlock(id, { type: 'heading', data: { level: `h${blockType.slice(-1)}` } });
			}
		}
	});
}

export function applyAIComposerSelectionLink(
	edytor: Edytor,
	selection: SavedSelection,
	url: string | null
) {
	if (!restoreSelection(edytor, selection)) return;
	const href = url?.trim();
	const operations = richTextOperations(edytor);
	if (href) operations.setLinkAtRange({ href });
	else operations.removeLinkAtRange();
}

function createSelectedTextAnchor(rootElement: HTMLElement): AnchoredReference | null {
	const domSelection = window.getSelection();
	if (!domSelection || domSelection.rangeCount === 0) return null;
	if (!domSelection.anchorNode || !domSelection.focusNode) return null;
	if (
		!rootElement.contains(domSelection.anchorNode) ||
		!rootElement.contains(domSelection.focusNode)
	) {
		return null;
	}

	const range = domSelection.getRangeAt(0).cloneRange();
	if (range.collapsed) return null;

	return {
		contextElement: rootElement,
		getBoundingClientRect: () => getRangeRect(range, rootElement),
		getClientRects: () => {
			const rects = Array.from(range.getClientRects()).filter(hasRectSize);
			return rects.length > 0 ? rects : [rootElement.getBoundingClientRect()];
		}
	};
}

function getRangeRect(range: Range, rootElement: HTMLElement) {
	const rects = Array.from(range.getClientRects()).filter(hasRectSize);
	if (rects.length === 0) return rootElement.getBoundingClientRect();

	const left = Math.min(...rects.map((rect) => rect.left));
	const top = Math.min(...rects.map((rect) => rect.top));
	const right = Math.max(...rects.map((rect) => rect.right));
	const bottom = Math.max(...rects.map((rect) => rect.bottom));
	return new DOMRect(left, top, right - left, bottom - top);
}

function hasRectSize(rect: DOMRect) {
	return rect.width > 0 || rect.height > 0;
}
