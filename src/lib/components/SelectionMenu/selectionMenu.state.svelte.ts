import type { VirtualElement } from '@floating-ui/dom';
import type { Attachment } from 'svelte/attachments';
import type {
	SelectionMenuProps,
	SelectionMenuSelection,
	SelectionMenuTarget
} from './selectionMenu.props.js';

type SelectionMenuOptions = Pick<SelectionMenuProps, 'target' | 'onSelect'>;
type SelectionMenuOptionsSource = () => SelectionMenuOptions;

export class SelectionMenuState {
	private markerElement: HTMLElement | null = null;
	private contentElement: HTMLElement | null = null;
	private dismissedSelection = $state<SelectionMenuSelection | null>(null);

	targetElement = $state<HTMLElement | null>(null);
	selection = $state<SelectionMenuSelection | null>(null);
	revision = $state(0);
	anchor: VirtualElement;

	constructor(private optionsSource: SelectionMenuOptionsSource) {
		// Object-literal getters cannot be arrows, so the instance read goes through one.
		const getContextElement = () => this.targetElement ?? undefined;
		this.anchor = {
			get contextElement() {
				return getContextElement();
			},
			getBoundingClientRect: () => this.getRangeRect(),
			getClientRects: () => this.getRangeRects()
		};
	}

	get isDismissed() {
		return isSameSelection(this.selection, this.dismissedSelection);
	}

	markerReference: Attachment<HTMLElement> = (node) => {
		this.markerElement = node;
		const document = node.ownerDocument;
		document.addEventListener('selectionchange', this.refresh);
		queueMicrotask(this.refresh);

		return () => {
			document.removeEventListener('selectionchange', this.refresh);
			if (this.markerElement === node) this.markerElement = null;
			this.commitSelection(null);
		};
	};

	contentReference: Attachment<HTMLElement> = (node) => {
		this.contentElement = node;
		return () => {
			if (this.contentElement === node) this.contentElement = null;
		};
	};

	refresh = () => {
		const target = this.resolveTarget(this.optionsSource().target);
		this.targetElement = target;
		const nextSelection = target ? readSelection(target) : null;

		if (!nextSelection && this.hasFocusedContent()) return;
		this.commitSelection(nextSelection);
	};

	dismiss() {
		this.dismissedSelection = this.selection;
	}

	preserveSelection = (event: PointerEvent) => {
		if (event.button !== 0) return;
		if (!(event.target instanceof Element)) return;
		if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
		event.preventDefault();
	};

	private resolveTarget(target: SelectionMenuTarget | undefined) {
		if (target === null) return null;
		if (target instanceof HTMLElement) return target;
		if (typeof target !== 'string') return this.markerElement?.parentElement ?? null;

		const root = this.markerElement?.getRootNode();
		if (!(root instanceof Document) && !(root instanceof ShadowRoot)) return null;
		const element = root.querySelector(target);
		return element instanceof HTMLElement ? element : null;
	}

	private hasFocusedContent() {
		const document = this.contentElement?.ownerDocument;
		return !!document?.activeElement && !!this.contentElement?.contains(document.activeElement);
	}

	private commitSelection(selection: SelectionMenuSelection | null) {
		if (isSameSelection(this.selection, selection)) return;
		if (selection && !isSameSelection(selection, this.dismissedSelection)) {
			this.dismissedSelection = null;
		}
		this.selection = selection;
		this.revision += 1;
		this.optionsSource().onSelect?.(selection);
	}

	private getRangeRects() {
		const range = this.selection?.range;
		if (!range) return [];
		return Array.from(range.getClientRects()).filter(hasRectSize);
	}

	private getRangeRect() {
		const rects = this.getRangeRects();
		if (rects.length === 0) {
			return this.targetElement?.getBoundingClientRect() ?? new DOMRect();
		}

		const left = Math.min(...rects.map((rect) => rect.left));
		const top = Math.min(...rects.map((rect) => rect.top));
		const right = Math.max(...rects.map((rect) => rect.right));
		const bottom = Math.max(...rects.map((rect) => rect.bottom));
		return new DOMRect(left, top, right - left, bottom - top);
	}
}

function readSelection(target: HTMLElement): SelectionMenuSelection | null {
	const selection = target.ownerDocument.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
	if (!selection.anchorNode || !selection.focusNode) return null;
	if (!target.contains(selection.anchorNode) || !target.contains(selection.focusNode)) return null;

	const text = selection.toString();
	if (text.trim().length === 0) return null;

	const range = selection.getRangeAt(0).cloneRange();
	if (range.collapsed || !Array.from(range.getClientRects()).some(hasRectSize)) return null;
	return { target, range, text };
}

function isSameSelection(
	left: SelectionMenuSelection | null,
	right: SelectionMenuSelection | null
) {
	if (!left || !right) return left === right;
	return (
		left.target === right.target &&
		left.range.startContainer === right.range.startContainer &&
		left.range.startOffset === right.range.startOffset &&
		left.range.endContainer === right.range.endContainer &&
		left.range.endOffset === right.range.endOffset &&
		left.text === right.text
	);
}

function hasRectSize(rect: DOMRect) {
	return rect.width > 0 || rect.height > 0;
}
