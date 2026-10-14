import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { normalizeDigits, stripBidiMarks } from '$lib/utils/number.js';

export const PIN_INPUT_DIGITS_PATTERN = '^\\d+$';
export const PIN_INPUT_CHARS_PATTERN = '^[a-zA-Z]+$';
/**
 * Extra characters the native input accepts beyond the code length. Autofilled or inserted text
 * such as `123-456` reaches the pipeline whole, so it can strip separators before clamping to
 * `length`, instead of the browser truncating it first.
 */
export const PIN_INPUT_TEXT_MARGIN = 32;

export const PIN_INPUT_ALPHANUMERIC_PATTERN = '^[a-zA-Z0-9]+$';

const KEYS_TO_IGNORE = new Set([
	'Backspace',
	'Delete',
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'ArrowDown',
	'Home',
	'End',
	'Escape',
	'Enter',
	'Tab',
	'Shift',
	'Control',
	'Meta',
	'Alt'
]);

/** Folds the full-width ASCII forms that CJK input methods produce (`１２`) to ASCII (`12`). */
const toHalfWidth = (text: string) =>
	text.replace(/[\uFF01-\uFF5E]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));

/** Whitespace, which never belongs to a code. */
const WHITESPACE_RE = /[\p{Z}\s]/u;
/** Dashes, dots, slashes and the like that group a code for reading (`123-456`, `123.456`). */
const SEPARATOR_RE = /[\p{Pd}\u2212._\u00b7\u2022/\\,:;|]/u;

/** Where the root node of `node` is: the document, or the shadow root it lives in. */
const rootOf = (node: Node) => node.getRootNode() as Document | ShadowRoot;

/** Some Android keyboards report all typing as one long composition, so they commit on input. */
const isAlwaysComposingKeyboard = (node: Element) =>
	/android/i.test(node.ownerDocument.defaultView?.navigator.userAgent ?? '');

export type PinInputPattern = string | RegExp;

export type PinInputCell = {
	index: number;
	char: string | null;
	isActive: boolean;
	hasFakeCaret: boolean;
};

type PinInputStateOptions = {
	value: () => string | null | undefined;
	setValue: (value: string) => void;
	setFocused: (focused: boolean) => void;
	length: () => number;
	pattern: () => PinInputPattern | undefined;
	pasteTransformer: () => ((text: string) => string) | undefined;
	normalizeValue: () => ((text: string) => string) | undefined;
	onRejectInput: () => ((detail: PinInputRejectDetail) => void) | undefined;
	onComplete: () => ((value: string) => void) | undefined;
	/** Submits the owning form; called when a typed, pasted or autofilled code completes. */
	submit: () => (() => void) | undefined;
	submitOnComplete: () => boolean | undefined;
	disabled: () => boolean | undefined;
	readOnly: () => boolean | undefined;
};

/** Text the pattern turned away, and where it came from. */
export type PinInputRejectDetail = { text: string; source: 'paste' | 'input' };

type SelectionDirection = 'forward' | 'backward' | 'none';
/** The value and the selection the active IME composition replaces. */
type Composition = { value: string; start: number; end: number };
type PreviousSelection = [number | null, number | null, SelectionDirection];
type NormalizedSelection = [number, number, SelectionDirection];

export class PinInputState {
	input = $state<HTMLInputElement | null>(null);
	isFocused = $state(false);
	selectionStart = $state<number | null>(null);
	selectionEnd = $state<number | null>(null);
	/** The input text while an IME composition is in progress; the cells display it. */
	composingValue = $state<string | null>(null);
	inputAttachment: Attachment<HTMLInputElement>;
	#previousValue: string;
	#previousSelection: PreviousSelection = [null, null, 'none'];
	#composition: Composition | null = null;
	/** A complete pasted or autofilled value to report even when the previous code was complete. */
	#pendingCompleteValue: string | null = null;
	/** The value the last user edit asked for; completing with it may submit the form. */
	#userCommit: string | null = null;
	/** What the controlled-value normalization last wrote, so it never re-normalizes its own output. */
	#normalizedValue: string | null = null;

	constructor(private options: PinInputStateOptions) {
		this.#previousValue = this.value.slice(0, this.length);
		this.inputAttachment = (node) =>
			untrack(() => {
				this.input = node;
				this.syncInputValue(this.value.slice(0, this.length));
				this.normalizeSelection();

				// `selectionchange` does not cross a shadow boundary, so the root node listens, and the
				// document too for engines that report it there.
				const root = rootOf(node);
				const targets = root === node.ownerDocument ? [root] : [root, node.ownerDocument];
				for (const target of targets) {
					target.addEventListener('selectionchange', this.normalizeSelection, { capture: true });
				}

				return () => {
					for (const target of targets) {
						target.removeEventListener('selectionchange', this.normalizeSelection, {
							capture: true
						});
					}
					if (this.input === node) {
						this.input = null;
						this.selectionStart = null;
						this.selectionEnd = null;
						this.#previousSelection = [null, null, 'none'];
						this.endComposition();
					}
				};
			});

		$effect(() => {
			const value = this.value;
			// A controlled value goes through the same pipeline as typed text, once: what the
			// pipeline wrote is accepted as it is, so an unstable `normalizeValue` cannot loop.
			const normalizedValue = value === this.#normalizedValue ? value : this.normalizeText(value);
			const clippedValue = normalizedValue.slice(0, this.length);
			if (value !== clippedValue) {
				this.#normalizedValue = clippedValue;
				this.options.setValue(clippedValue);
			}
			this.syncInputValue(clippedValue);
			this.notifyComplete(clippedValue);
		});
	}

	get value() {
		return this.options.value() ?? '';
	}

	/** Whether an IME composition the cells display is in progress. */
	get isComposing() {
		return this.composingValue !== null;
	}

	get length() {
		const length = this.options.length();
		if (!Number.isFinite(length)) return 6;
		return Math.max(1, Math.floor(length));
	}

	/**
	 * The one pipeline typed, pasted, autofilled, composed and controlled text goes through:
	 * format controls and whitespace go, full-width and other numeral systems become ASCII,
	 * grouping separators go where the pattern does not accept them, then `normalizeValue` runs.
	 * The pattern and the length are applied by the caller.
	 */
	normalizeText(text: string) {
		const folded = normalizeDigits(toHalfWidth(stripBidiMarks(text)));
		const stripped = Array.from(folded)
			.filter(
				(char) =>
					!WHITESPACE_RE.test(char) &&
					!(SEPARATOR_RE.test(char) && this.options.pattern() && !this.isValueAllowed(char))
			)
			.join('');
		return this.options.normalizeValue()?.(stripped) ?? stripped;
	}

	get cells() {
		const value = this.composingValue ?? this.value;
		const selectionStart = this.selectionStart ?? Math.min(value.length, this.length - 1);
		const selectionEnd = this.selectionEnd ?? selectionStart;
		const lowerSelection = Math.min(selectionStart, selectionEnd);
		const upperSelection = Math.max(selectionStart, selectionEnd);
		const cursorIndex = Math.min(lowerSelection, this.length - 1);
		const hasRange = upperSelection > lowerSelection;

		return Array.from({ length: this.length }, (_, index) => {
			const char = value[index] ?? null;
			const isActive =
				this.isFocused &&
				(hasRange ? index >= lowerSelection && index < upperSelection : index === cursorIndex);

			return {
				index,
				char,
				isActive,
				hasFakeCaret: isActive && char === null
			} satisfies PinInputCell;
		});
	}

	/** Whether the field refuses edits: disabled, or read-only. */
	get isLocked() {
		return Boolean(this.options.disabled() || this.options.readOnly());
	}

	focus = () => {
		if (this.options.disabled()) return;
		this.input?.focus();
	};

	handlePointerDown = (event: PointerEvent) => {
		if (this.options.disabled()) return;

		event.preventDefault();
		// Moving the caret would end the composition; the input method keeps it until it commits.
		if (this.#composition) return;
		this.input?.focus({ preventScroll: true });
		this.selectCellFromPointer(event);
	};

	handleKeydown = (event: KeyboardEvent) => {
		if (
			this.#composition ||
			event.isComposing ||
			// 229 marks a keystroke the input method consumes; its text is checked on compositionend.
			event.keyCode === 229 ||
			event.ctrlKey ||
			event.metaKey ||
			KEYS_TO_IGNORE.has(event.key)
		) {
			return;
		}

		if (event.key.length === 1) {
			// A key the pipeline drops (a separator, a space) never reaches the input.
			const typed = this.normalizeText(event.key);
			if (typed === '') {
				event.preventDefault();
			} else if (!this.isValueAllowed(typed)) {
				event.preventDefault();
				// The browser never raises an input event for a key that is refused here.
				if (!this.isLocked) this.reject(event.key, 'input');
			}
		}
	};

	handleInput = (event: Event) => {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;

		// The input method owns the text until compositionend; intermediate text is only displayed.
		if (this.#composition) {
			this.composingValue = input.value;
			this.normalizeSelection();
			return;
		}

		const text = input.value;
		const nextValue = this.normalizeText(text).slice(0, this.length);
		if (this.isLocked || !this.isValueAllowed(nextValue)) {
			if (!this.isLocked) this.reject(text, 'input');
			input.value = this.value;
			this.normalizeSelection();
			return;
		}

		this.commitValue(
			nextValue,
			Math.min(input.selectionStart ?? nextValue.length, nextValue.length)
		);
		if (isReplacementInput(event)) this.requestComplete(nextValue);
		this.normalizeSelection();
	};

	handleCompositionStart = () => {
		const input = this.input;
		if (!input || this.options.disabled() || isAlwaysComposingKeyboard(input)) return;

		const value = this.value;
		const start = Math.min(input.selectionStart ?? value.length, value.length);
		const end = Math.min(Math.max(input.selectionEnd ?? start, start), value.length);
		this.#composition = { value, start, end };
		this.composingValue = input.value;
	};

	handleCompositionEnd = (event: CompositionEvent) => {
		const composition = this.#composition;
		const input = this.input;
		if (!composition || !input) return;
		this.endComposition();

		const value = this.value;
		const composedText = this.normalizeText(
			event.data || readComposedText(input.value, composition)
		);
		const caret = composition.start + composedText.length;
		// Composed text overwrites the selected cell and the cells after it, as typing does.
		const nextValue = (
			value.slice(0, composition.start) +
			composedText +
			value.slice(Math.max(composition.end, caret))
		).slice(0, this.length);

		if (
			// A field disabled or locked mid-composition refuses the commit, as any other edit.
			this.isLocked ||
			!composedText ||
			// A paste, or a parent value whose effect has not run yet, replaced the composed text.
			value !== composition.value ||
			!this.isValueAllowed(nextValue)
		) {
			input.value = value;
			this.setSelectionRange(composition.start, composition.end);
			return;
		}

		this.commitValue(nextValue, caret);
		this.normalizeSelection();
	};

	handlePaste = (event: ClipboardEvent) => {
		const input = this.input;
		if (!input) return;

		event.preventDefault();
		if (this.isLocked) return;
		const rawText = event.clipboardData?.getData('text/plain') ?? '';
		const transformer = this.options.pasteTransformer();
		// The transformer is a paste-only first step; the shared pipeline follows it.
		const pastedText = this.normalizeText(transformer ? transformer(rawText) : rawText);
		if (pastedText === '') {
			if (rawText !== '') this.reject(rawText, 'paste');
			return;
		}
		const selectionStart = input.selectionStart ?? this.value.length;
		const selectionEnd = input.selectionEnd ?? selectionStart;
		// A paste that fills every cell is a whole new code, wherever the caret was.
		const nextValue =
			pastedText.length >= this.length
				? pastedText.slice(0, this.length)
				: (this.value.slice(0, selectionStart) + pastedText + this.value.slice(selectionEnd)).slice(
						0,
						this.length
					);

		if (!this.isValueAllowed(nextValue)) {
			this.reject(rawText, 'paste');
			return;
		}

		const selectionEndAfterPaste = nextValue.length;
		const selectionStartAfterPaste =
			nextValue.length === this.length
				? Math.max(selectionEndAfterPaste - 1, 0)
				: selectionEndAfterPaste;
		this.commitValue(nextValue, selectionStartAfterPaste, selectionEndAfterPaste);
		this.requestComplete(nextValue);
	};

	handleFocus = () => {
		// A composition cannot outlive focus; drop one whose compositionend never arrived.
		this.endComposition();
		this.isFocused = true;
		this.options.setFocused(true);

		const selectionEnd = this.value.length;
		const selectionStart = Math.min(selectionEnd, this.length - 1);
		this.setSelectionRange(selectionStart, selectionEnd);
	};

	handleBlur = () => {
		this.isFocused = false;
		this.options.setFocused(false);
		this.selectionStart = null;
		this.selectionEnd = null;
	};

	normalizeSelection = () => {
		const input = this.input;
		if (!input) return;

		// Inside a shadow root the document's active element is the host, not the input.
		if (rootOf(input).activeElement !== input) {
			this.selectionStart = null;
			this.selectionEnd = null;
			return;
		}

		// Moving the native selection mid-composition would cancel it, so only mirror the caret.
		if (this.#composition) {
			this.selectionStart = this.clampSelection(input.selectionStart ?? 0);
			this.selectionEnd = this.clampSelection(input.selectionEnd ?? this.selectionStart);
			return;
		}

		const nativeStart = this.clampSelection(input.selectionStart ?? this.value.length);
		const nativeEnd = this.clampSelection(input.selectionEnd ?? nativeStart);
		const nativeDirection = input.selectionDirection ?? 'none';
		const previousSelection = this.#previousSelection;
		let selectionStart = nativeStart;
		let selectionEnd = nativeEnd;
		let selectionDirection = nativeDirection;

		if (this.value.length > 0 && nativeStart === nativeEnd) {
			const isInsertMode = nativeStart === this.value.length && this.value.length < this.length;
			if (!isInsertMode) {
				const normalizedSelection = this.getNormalizedSelectionRange(
					nativeStart,
					previousSelection
				);
				if (normalizedSelection) {
					[selectionStart, selectionEnd, selectionDirection] = normalizedSelection;
					this.applyNativeSelection(selectionStart, selectionEnd, selectionDirection);
				}
			}
		}

		this.selectionStart = selectionStart;
		this.selectionEnd = selectionEnd;
		this.#previousSelection = [selectionStart, selectionEnd, selectionDirection];
	};

	private commitValue(nextValue: string, selectionStart: number, selectionEnd = selectionStart) {
		this.#userCommit = nextValue;
		this.options.setValue(nextValue);
		// The field can refuse the change (while disabled); the input shows the value it holds.
		const acceptedValue = this.value;
		if (acceptedValue !== nextValue) this.#userCommit = null;
		if (this.input && this.input.value !== acceptedValue) {
			this.input.value = acceptedValue;
		}
		this.setSelectionRange(selectionStart, selectionEnd);
	}

	private setSelectionRange(start: number, end: number, direction: SelectionDirection = 'none') {
		const selectionStart = this.clampSelection(start);
		const selectionEnd = this.clampSelection(end);
		this.selectionStart = selectionStart;
		this.selectionEnd = selectionEnd;
		this.#previousSelection = [selectionStart, selectionEnd, direction];
		this.applyNativeSelection(selectionStart, selectionEnd, direction);
	}

	private applyNativeSelection(start: number, end: number, direction: SelectionDirection) {
		if (!this.input) return;
		try {
			this.input.setSelectionRange(start, end, direction);
		} catch {
			// Some input modes can reject selection ranges. The mirrored cell state above is enough.
		}
	}

	private getNormalizedSelectionRange(
		caretIndex: number,
		previousSelection: PreviousSelection
	): NormalizedSelection | null {
		if (caretIndex === 0) return [0, 1, 'forward'];
		if (caretIndex === this.length) return [caretIndex - 1, caretIndex, 'backward'];
		if (this.length <= 1 || this.value.length <= 1) return null;

		let offset = 0;
		let direction: SelectionDirection = 'forward';
		const [previousStart, previousEnd] = previousSelection;
		if (previousStart !== null && previousEnd !== null) {
			direction = caretIndex < previousEnd ? 'backward' : 'forward';
			const wasPreviouslyInserting = previousStart === previousEnd && previousStart < this.length;
			if (direction === 'backward' && !wasPreviouslyInserting) {
				offset = -1;
			}
		}

		const start = this.clampSelection(caretIndex + offset);
		return [start, this.clampSelection(start + 1), direction];
	}

	private selectCellFromPointer(event: PointerEvent) {
		const cellIndex = this.getPointerCellIndex(event);
		if (cellIndex === null) {
			const selectionIndex = Math.min(this.value.length, this.length);
			this.setSelectionRange(selectionIndex, selectionIndex);
			return;
		}

		const selectionIndex = Math.min(Math.max(cellIndex, 0), this.length - 1);
		const shouldInsertAtEnd =
			selectionIndex >= this.value.length && this.value.length < this.length;
		if (shouldInsertAtEnd) {
			this.setSelectionRange(this.value.length, this.value.length);
			return;
		}

		const start = Math.min(selectionIndex, Math.max(this.value.length - 1, 0));
		this.setSelectionRange(start, start + 1);
	}

	private getPointerCellIndex(event: PointerEvent) {
		const root = this.input?.parentElement;
		if (!root) return null;

		const cells = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="pin-input-cell"]'));
		if (cells.length === 0) return null;

		const directCellIndex = cells.findIndex((cell) => {
			const rect = cell.getBoundingClientRect();
			return event.clientX >= rect.left && event.clientX <= rect.right;
		});
		if (directCellIndex !== -1) return directCellIndex;

		let closestIndex = 0;
		let closestDistance = Number.POSITIVE_INFINITY;
		for (const [index, cell] of cells.entries()) {
			const rect = cell.getBoundingClientRect();
			const center = rect.left + rect.width / 2;
			const distance = Math.abs(event.clientX - center);
			if (distance < closestDistance) {
				closestIndex = index;
				closestDistance = distance;
			}
		}

		return closestIndex;
	}

	private syncInputValue(value: string) {
		// A value set from outside mid-composition replaces the text the input method was composing.
		if (this.#composition && this.#composition.value !== value) this.endComposition();
		if (!this.input || this.input.value === value) return;
		this.input.value = value;
		if (this.isFocused) {
			queueMicrotask(this.normalizeSelection);
		}
	}

	private endComposition() {
		this.#composition = null;
		this.composingValue = null;
	}

	/**
	 * Reports a committed complete paste or autofill even when the code was already complete. A
	 * changed value is reported by the value effect after the update; an unchanged one right away.
	 */
	private requestComplete(value: string) {
		if (value.length !== this.length || this.value !== value) return;
		if (value === this.#previousValue) {
			this.complete(value, true);
			return;
		}
		this.#pendingCompleteValue = value;
	}

	private reject(text: string, source: PinInputRejectDetail['source']) {
		this.options.onRejectInput()?.({ text, source });
	}

	/** Reports a complete code, and submits the form after one the user typed, pasted or filled. */
	private complete(value: string, byUser: boolean) {
		this.options.onComplete()?.(value);
		if (byUser && this.options.submitOnComplete() && !this.isLocked) this.options.submit()?.();
	}

	private notifyComplete(value: string) {
		const previousValue = this.#previousValue;
		const isRequested = this.#pendingCompleteValue === value;
		const byUser = this.#userCommit === value;
		this.#pendingCompleteValue = null;
		this.#userCommit = null;
		if (
			previousValue !== value &&
			value.length === this.length &&
			(isRequested || previousValue.length < this.length)
		) {
			this.complete(value, byUser);
		}
		this.#previousValue = value;
	}

	private clampSelection(index: number) {
		return Math.min(Math.max(index, 0), this.length);
	}

	private isValueAllowed(value: string) {
		if (!value) return true;
		const pattern = this.options.pattern();
		if (!pattern) return true;
		const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
		regex.lastIndex = 0;
		return regex.test(value);
	}
}

/** Whether an input event replaced the whole text, as autofill does, rather than typed into it. */
const isReplacementInput = (event: Event) => {
	const inputType = (event as Partial<InputEvent>).inputType;
	// Some browsers autofill with a plain `input` Event that carries no input type.
	return inputType === undefined || inputType === 'insertReplacementText';
};

/** Recovers the composed text from the input when compositionend carries no data. */
const readComposedText = (inputValue: string, { value, start, end }: Composition) => {
	const prefix = value.slice(0, start);
	const suffix = value.slice(end);
	if (
		inputValue.length < prefix.length + suffix.length ||
		!inputValue.startsWith(prefix) ||
		!inputValue.endsWith(suffix)
	) {
		return '';
	}
	return inputValue.slice(prefix.length, inputValue.length - suffix.length);
};
