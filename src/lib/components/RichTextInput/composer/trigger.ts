import type { EdytorInstance as Edytor } from 'edytor';
import type { AnchoredReference } from '../anchored-reference.js';

export type TriggerKind = 'command' | 'mention' | 'skill' | (string & {});

/** An open trigger: its character and query, in block offsets (an inline atom counts 1). */
export type TriggerState = {
	kind: TriggerKind;
	trigger: string;
	query: string;
	blockId: string;
	startOffset: number;
	endOffset: number;
};

export function createCaretAnchor(rootElement: HTMLElement | null): AnchoredReference | null {
	if (!rootElement || typeof window === 'undefined') return null;
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0 || !selection.anchorNode) return null;
	if (!rootElement.contains(selection.anchorNode)) return null;
	const range = selection.getRangeAt(0).cloneRange();
	range.collapse(true);
	const rect = range.getBoundingClientRect();
	const fallbackRect = rootElement.getBoundingClientRect();
	const anchorRect = rect.width || rect.height ? rect : fallbackRect;
	return {
		contextElement: rootElement,
		getBoundingClientRect: () => anchorRect,
		getClientRects: () => [anchorRect]
	};
}

/** The text between the last inline atom (or the block's start) and `offset`, and where it starts. */
function textSegmentBefore(edytor: Edytor, blockId: string, offset: number) {
	let position = 0;
	let segmentStart = 0;
	let text = '';
	for (const part of edytor.document.blockJSON(blockId).content ?? []) {
		if (position >= offset) break;
		if ('text' in part) {
			text += part.text.slice(0, offset - position);
			position += part.text.length;
		} else {
			position += 1;
			segmentStart = position;
			text = '';
		}
	}
	return { text, start: segmentStart };
}

export function readTriggerState(
	edytor: Edytor | null,
	triggerCharacters: string[] = ['@', '/', '$']
): TriggerState | null {
	const caret = edytor?.selection.caret;
	if (!edytor || !caret) return null;
	const triggers = normalizeTriggerCharacters(triggerCharacters);
	if (triggers.length === 0) return null;
	const { text, start } = textSegmentBefore(edytor, caret.block.id, caret.offset);
	const triggerPattern = triggers.map(escapeRegexCharacter).join('');
	const match = text.match(new RegExp(`(^|\\s)([${triggerPattern}])([^\\s${triggerPattern}]*)$`));
	if (!match || match.index === undefined) return null;
	const leading = match[1] ?? '';
	const trigger = match[2];
	return {
		kind: getTriggerKind(trigger),
		trigger,
		query: match[3] ?? '',
		blockId: caret.block.id,
		startOffset: start + match.index + leading.length,
		endOffset: caret.offset
	};
}

export function isSameTriggerState(
	currentMenu: TriggerState | null,
	nextMenu: TriggerState | null
) {
	if (!currentMenu || !nextMenu) return currentMenu === nextMenu;
	return (
		currentMenu.kind === nextMenu.kind &&
		currentMenu.trigger === nextMenu.trigger &&
		currentMenu.query === nextMenu.query &&
		currentMenu.blockId === nextMenu.blockId &&
		currentMenu.startOffset === nextMenu.startOffset &&
		currentMenu.endOffset === nextMenu.endOffset
	);
}

function getTriggerKind(trigger: string): TriggerKind {
	if (trigger === '/') return 'command';
	if (trigger === '$') return 'skill';
	if (trigger === '@') return 'mention';
	return trigger;
}

function normalizeTriggerCharacters(triggerCharacters: string[]) {
	return [...new Set(triggerCharacters.filter((trigger) => trigger.length === 1))];
}

function escapeRegexCharacter(character: string) {
	return character.replace(/[\\^$.*+?()[\]{}|\-/]/g, '\\$&');
}
