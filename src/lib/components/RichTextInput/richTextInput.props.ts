import type { Slot } from '$lib/components/Slot/slot.js';
import type { InputProps } from '$lib/components/Form/Field/field.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { RichTextInputThemeProps } from './richTextInput.theme.js';

export type RichTextInputSearchResult<T> = T[] | Promise<T[]>;
export type RichTextInputTokenKind = 'file' | 'reference' | 'mention' | 'skill' | 'command';
export type RichTextInputToolbar = 'hover' | 'fixed' | 'both' | 'none';
export type RichTextInputSubmitShortcut = 'enter' | 'shift-enter' | 'command-enter' | 'none';
export type RichTextInputMaxHeight = number | string | false;
export type RichTextInputFormat =
	| 'bold'
	| 'italic'
	| 'code'
	| 'strikethrough'
	| 'highlight'
	| 'link'
	| 'bulletList'
	| 'orderedList'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'quote';

export type RichTextInputToken = {
	kind: RichTextInputTokenKind;
	id: string;
	label: string;
	path?: string;
	markdown?: string;
	promptText?: string;
};

export type RichTextInputChange = {
	markdown: string;
	tokens: RichTextInputToken[];
	isEmpty: boolean;
};

export type RichTextInputItem = {
	id: string;
	label: string;
	description?: string;
	icon?: Slot;
	keywords?: string[];
	group?: string;
	kind?: RichTextInputTokenKind;
	path?: string;
	markdown?: string | ((item: RichTextInputItem) => string);
	promptText?: string | ((item: RichTextInputItem) => string);
};

export type RichTextInputTriggerContext = {
	trigger: string;
	query: string;
};

/** Selected suggestion and the trigger state that produced it. */
export type RichTextInputItemContext = {
	item: RichTextInputItem;
	context: RichTextInputTriggerContext;
};

export type RichTextInputTriggerConfig = {
	title?: string;
	empty?: string;
	items?: RichTextInputItem[];
	tokenKind?: RichTextInputTokenKind | ((item: RichTextInputItem) => RichTextInputTokenKind);
	group?: string | ((item: RichTextInputItem) => string | undefined);
	onSearch?: (context: RichTextInputTriggerContext) => RichTextInputSearchResult<RichTextInputItem>;
	onSelect?: (payload: RichTextInputItemContext) => void;
	toToken?: (payload: RichTextInputItemContext) => RichTextInputToken;
};

export type RichTextInputTriggers = Record<string, RichTextInputTriggerConfig>;

export type RichTextInputSuggestionLifecycleState = {
	trigger: string;
	query: string;
	requestId: number | null;
	isLoading: boolean;
	error: unknown | null;
	highlightedValue: string | null;
	itemCount: number;
};

export type RichTextInputSuggestionLifecycleCallback = (
	state: RichTextInputSuggestionLifecycleState
) => void;

export type RichTextInputHandle = {
	focus: () => void;
	clear: () => void;
	insertText: (text: string) => void;
	insertItem: (trigger: string, item: RichTextInputItem) => void;
	insertToken: (token: RichTextInputToken) => void;
};

type RichTextInputFieldProps = Omit<InputProps<'rich-text'>, 'theme' | 'onValueChange'>;

export type RichTextInputProps = WithAttachments<
	RichTextInputFieldProps & {
		/** Bindable markdown value. Plain text is valid markdown. */
		value?: string | null;
		/** Initial markdown value when `value` is not bound. */
		defaultValue?: string | null;
		/** Bindable reference to the editable Lexical root. */
		ref?: HTMLDivElement | null;
		/** Stable id applied to the editable root. */
		id?: string;
		/** Trigger configuration keyed by one-character trigger strings such as `/`, `@`, or `$`. */
		triggers?: RichTextInputTriggers;
		/** Called when a suggestion popup opens. */
		onSuggestionOpen?: RichTextInputSuggestionLifecycleCallback;
		/** Called when the active suggestion popup closes. */
		onSuggestionClose?: RichTextInputSuggestionLifecycleCallback;
		/** Called when the active suggestion query changes. */
		onSuggestionQueryChange?: RichTextInputSuggestionLifecycleCallback;
		/** Called when keyboard, pointer, or result updates move the highlighted suggestion. */
		onSuggestionHighlightChange?: RichTextInputSuggestionLifecycleCallback;
		/** Called after editor updates with markdown, token metadata, and empty state. */
		onValueChange?: (change: RichTextInputChange) => void;
		/** Called when `submitShortcut` is pressed and the suggestion popup did not handle it first. */
		onSubmitShortcut?: (event: KeyboardEvent) => void;
		/** Keyboard shortcut that calls `onSubmitShortcut`. */
		submitShortcut?: RichTextInputSubmitShortcut;
		/** Formatting toolbar mode: selected text, fixed top, both, or none. */
		toolbar?: RichTextInputToolbar;
		/** Render only the editor chrome, without the Field wrapper or input surface. */
		standalone?: boolean;
		/** Caps the editor height. Defaults to false, so the editor grows with content. */
		maxHeight?: RichTextInputMaxHeight;
		/** Allowed formatting controls and markdown shortcuts. */
		formats?: RichTextInputFormat[];
		/** Placeholder text and textbox aria-label. */
		placeholder?: string;
		/** Additional classes on the fixed toolbar container. */
		toolbarClass?: string;
		/** Per-instance theme overrides for the rich text input and field wrapper. */
		theme?: RichTextInputThemeProps & InputProps<'rich-text'>['theme'];
	}
>;
