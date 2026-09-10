import type {
	RichTextInputFormat,
	RichTextInputHandle,
	RichTextInputItem,
	RichTextInputSearchResult,
	RichTextInputSubmitShortcut,
	RichTextInputSuggestionLifecycleState,
	RichTextInputToken,
	RichTextInputTokenKind,
	RichTextInputToolbar,
	RichTextInputTriggerConfig,
	RichTextInputTriggerContext
} from '$lib/components/RichTextInput/richTextInput.props.js';
import type { FileRejection } from '$lib/components/Form/File/fileAcceptance.js';
import type { FileDropzoneState } from '$lib/components/Form/File/fileDropzone.svelte.js';
import type { VoiceInputVariant } from '$lib/components/Form/VoiceInput/voiceInput.props.js';
import type { VoiceInputThemeProps } from '$lib/components/Form/VoiceInput/voiceInput.theme.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors } from '$lib/types/theme.js';
import type { AIComposerThemeProps } from './aiComposer.theme.js';
import type { HTMLFormAttributes } from 'svelte/elements';

export type AIComposerAttachmentStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export type AIComposerAttachment = {
	id: string;
	file: File;
	name: string;
	size: number;
	type: string;
	status: AIComposerAttachmentStatus;
	previewUrl?: string;
	remoteId?: string;
	remoteUrl?: string;
	error?: string;
};

export type AIComposerSubmitState = {
	value: string;
	files: File[];
	attachments: AIComposerAttachment[];
	isEmpty: boolean;
	isBusy: boolean;
};

export type AIComposerDropzoneState = {
	state: FileDropzoneState;
	files: File[];
	accept: readonly string[];
	multiple: boolean;
	maxFiles: number;
	maxFileSize: number;
};

export type AIComposerCommand = RichTextInputItem & {
	kind?: 'command';
	prompt?: string | ((state: AIComposerSubmitState) => string);
};

export type AIComposerMentionType = 'file' | 'reference' | 'skill';
export type AIComposerMentionSearchType = AIComposerMentionType | 'all';
export type AIComposerSearchResult<T> = T[] | Promise<T[]>;

export type AIComposerMentionItem = RichTextInputItem & {
	kind?: 'mention' | 'file' | 'reference' | 'skill';
	type?: AIComposerMentionType;
};

export type AIComposerSkillItem = RichTextInputItem & {
	kind?: 'skill';
	type?: 'skill';
};

export type AIComposerCommandSearch = (query: string) => AIComposerSearchResult<AIComposerCommand>;
/** Query and mention category passed to compatibility mention searches. */
export type AIComposerMentionSearchPayload = {
	query: string;
	type: AIComposerMentionSearchType;
};
export type AIComposerMentionSearch = (
	payload: AIComposerMentionSearchPayload
) => AIComposerSearchResult<AIComposerMentionItem>;
export type AIComposerSkillSearch = (query: string) => AIComposerSearchResult<AIComposerSkillItem>;
export type AIComposerSubmitToken = Omit<RichTextInputToken, 'markdown'> & { markdown: string };

export type AIComposerSubmitMeta = {
	markdown: string;
	modelInput: string;
	files: File[];
	attachments: AIComposerAttachment[];
	tokens: AIComposerSubmitToken[];
	commandIds: string[];
	fileIds: string[];
	mentionIds: string[];
	referenceIds: string[];
	skillIds: string[];
};

export type AIComposerSubmitEvent = SubmitEvent | KeyboardEvent;
export type AIComposerSubmitShortcut = RichTextInputSubmitShortcut;
export type AIComposerSubmitDetail = AIComposerSubmitMeta & {
	event?: AIComposerSubmitEvent;
	steered?: boolean;
};

export type AIComposerQueuedMessage = AIComposerSubmitMeta & {
	id: string;
	createdAt: number;
	steered?: boolean;
};

/** Queued message and its current queue index. */
export type AIComposerQueuedMessagePayload = {
	message: AIComposerQueuedMessage;
	index: number;
};

/** Committed queue edit and the message it replaced. */
export type AIComposerQueuedMessageEditPayload = AIComposerQueuedMessagePayload & {
	previousMessage: AIComposerQueuedMessage;
};

export type AIComposerHandle = RichTextInputHandle & {
	insertCommand: (item: AIComposerCommand) => void;
	insertMention: (item: AIComposerMentionItem) => void;
	insertReference: (item: AIComposerMentionItem) => void;
	insertSkill: (item: AIComposerSkillItem) => void;
};

export type AIComposerTriggerSource<Item extends RichTextInputItem = RichTextInputItem> = Omit<
	RichTextInputTriggerConfig,
	'items' | 'onSearch' | 'onSelect' | 'toToken' | 'tokenKind'
> & {
	items?: Item[];
	tokenKind?: RichTextInputTokenKind | ((item: Item) => RichTextInputTokenKind);
	onSearch?: (context: RichTextInputTriggerContext) => RichTextInputSearchResult<Item>;
	onSelect?(payload: { item: Item; context: RichTextInputTriggerContext }): void;
	toToken?(payload: { item: Item; context: RichTextInputTriggerContext }): RichTextInputToken;
};

export type AIComposerSuggestionKind = 'command' | 'mention' | 'skill';
export type AIComposerSuggestionTrigger = '/' | '@' | '$';
export type AIComposerSuggestionLifecycleState = RichTextInputSuggestionLifecycleState & {
	kind: AIComposerSuggestionKind;
	trigger: AIComposerSuggestionTrigger;
};
export type AIComposerSuggestionLifecycleCallback = (
	state: AIComposerSuggestionLifecycleState
) => void;

export type AIComposerVoiceInputVariant = Exclude<VoiceInputVariant, 'default'>;
export type AIComposerVoiceInputHandler = (audioBuffer: ArrayBuffer) => Promise<void>;

export type AIComposerProps = WithAttachments<
	Omit<
		HTMLFormAttributes,
		| 'children'
		| 'class'
		| 'onsubmit'
		| 'onpaste'
		| 'ondragenter'
		| 'ondragover'
		| 'ondragleave'
		| 'ondrop'
	> & {
		/** Bindable reference to the composer form. */
		ref?: HTMLFormElement | null;
		/** Bindable Markdown source for the editor. */
		value?: string;
		/** Initial Markdown source when no value or conversation input is provided. */
		defaultValue?: string;
		/** Called once for each library-originated Markdown value change. */
		onValueChange?: (value: string) => void;
		/** Bindable files currently selected for submission. */
		files?: File[];
		/** Bindable attachment records, including upload state. */
		attachments?: AIComposerAttachment[];
		/** Bindable ordered submissions waiting while busy. */
		queue?: AIComposerQueuedMessage[];
		/** Whether a response is active and the composer should submit, queue, steer, or stop. */
		busy?: boolean;
		/** Disables editing and composer actions. */
		disabled?: boolean;
		/** Queues submissions made while busy instead of steering immediately. */
		queueWhileBusy?: boolean;
		/** Enables the file chooser, paste handling, and drag-and-drop surface. */
		fileDropzone?: boolean;
		/** Allows more than one file to be selected. */
		fileMultiple?: boolean;
		/** Accepted file extensions or MIME patterns. */
		accept?: readonly string[];
		/** Maximum number of accepted files. Unlimited when omitted. */
		maxFiles?: number;
		/** Maximum accepted size for one file in bytes. Unlimited when omitted. */
		maxFileSize?: number;
		/** Slash-command trigger source. */
		commands?: AIComposerTriggerSource<AIComposerCommand> | readonly AIComposerCommand[];
		/** Svelte Pro-compatible mention list. Prefer `mentions` and `references` for new code. */
		mentionItems?: readonly AIComposerMentionItem[];
		/** Mention trigger source. */
		mentions?: AIComposerTriggerSource<AIComposerMentionItem>;
		/** Reference trigger source. */
		references?: AIComposerTriggerSource<AIComposerMentionItem>;
		/** Skill trigger source. */
		skills?: AIComposerTriggerSource<AIComposerSkillItem> | readonly AIComposerSkillItem[];
		/** Keyboard shortcut that submits when the suggestion popup has not handled the key. */
		submitShortcut?: RichTextInputSubmitShortcut;
		/** Formatting toolbar mode forwarded to RichTextInput. */
		toolbar?: RichTextInputToolbar;
		/** Formatting controls and Markdown shortcuts enabled in RichTextInput. */
		formats?: RichTextInputFormat[];
		/** Lets the editor grow with content; false fixes the editor to a compact multiline height. */
		autoresize?: boolean;
		/** Enables the existing VoiceInput control in the default composer footer. */
		voiceInput?: boolean;
		/** Chooses a mic-only control or a control that expands into a waveform. @default 'compact' */
		voiceInputVariant?: AIComposerVoiceInputVariant;
		/** Minimum accepted voice recording duration in seconds. */
		voiceInputMinDuration?: number;
		/** Maximum voice recording duration in seconds. Recording stops at this limit. */
		voiceInputMaxDuration?: number;
		/** Semantic color used while recording. */
		voiceInputColor?: Colors;
		/** Accessible label and tooltip for starting voice capture. */
		voiceInputAriaLabel?: string;
		/** Accessible label and tooltip for stopping voice capture. */
		voiceInputStopLabel?: string;
		/** Accessible label shown while the voice callback is pending. */
		voiceInputProcessingLabel?: string;
		/** Editor placeholder, inherited from the conversation when omitted. */
		placeholder?: string;
		/** Accessible label for the submit action. */
		submitLabel?: string;
		/** Accessible label for the stop action. */
		stopLabel?: string;
		/** Accessible label for the file chooser action. */
		attachLabel?: string;
		/** Message shown while accepted files are dragged over the composer. */
		dropLabel?: string;
		/** Message shown while rejected files are dragged over the composer. */
		dropInvalidLabel?: string;
		/** Content rendered above the editor and attachments. */
		header?: Slot;
		/** Custom content rendered over the composer while files are dragged over it. */
		dropzone?: Slot<AIComposerDropzoneState>;
		/** Content rendered below the composer controls. */
		footer?: Slot<AIComposerSubmitState>;
		/** Content rendered at the start of the default footer. */
		footerStart?: Slot<AIComposerSubmitState>;
		/** Additional actions rendered before the default submit or stop control. */
		actions?: Slot<AIComposerSubmitState>;
		/** Content rendered before the default composer actions. */
		prefix?: Slot;
		/** Content rendered after the default composer actions. */
		suffix?: Slot;
		/** Model selector rendered in the default action row. */
		modelSelector?: Slot;
		/** Handles a submission, queued submission, or steering message. */
		onSubmit?: (detail: AIComposerSubmitDetail) => void | Promise<void>;
		/** Requests that the active response stop. */
		onStop?: () => void | Promise<void>;
		/** Called with files rejected by count, type, or size constraints. */
		onFilesRejected?: (files: File[]) => void;
		/** Called whenever the accepted file list changes. */
		onFilesChange?: (files: File[]) => void;
		/** Called with detailed file rejection reasons. */
		onFileReject?: (rejections: FileRejection[]) => void;
		/** Called for each new attachment record. */
		onAttachmentAdd?: (attachment: AIComposerAttachment) => void;
		/** Retries a failed attachment. */
		onAttachmentRetry?: (attachment: AIComposerAttachment) => void | Promise<void>;
		/** Removes an attachment from the composer. */
		onAttachmentRemove?: (attachment: AIComposerAttachment) => void;
		/** Called after queued submissions are added, reordered, or removed. */
		onQueueChange?: (queue: AIComposerQueuedMessage[]) => void;
		/** Called after a queued message is added. */
		onQueuedMessageAdd?: (payload: AIComposerQueuedMessagePayload) => void;
		/** Called after a queued message is cancelled. */
		onQueuedMessageCancel?: (payload: AIComposerQueuedMessagePayload) => void;
		/** Called when a queued message begins editing. */
		onQueuedMessageEditStart?: (payload: AIComposerQueuedMessagePayload) => void;
		/** Called after a queued-message edit is committed. */
		onQueuedMessageEditCommit?: (payload: AIComposerQueuedMessageEditPayload) => void;
		/** Called when a queued-message edit is cancelled. */
		onQueuedMessageEditCancel?: (payload: AIComposerQueuedMessagePayload) => void;
		/** Called after drag-and-drop changes queue order. */
		onQueuedMessageReorder?: (queue: AIComposerQueuedMessage[]) => void;
		/** Called when a queued message is marked for steering. */
		onSteer?: (payload: AIComposerQueuedMessagePayload) => void;
		/** Called after a slash command is inserted. Trigger-source `onSelect` runs first. */
		onCommandSelect?: (command: AIComposerCommand) => void;
		/** Called after a mention or reference is inserted. Trigger-source `onSelect` runs first. */
		onMentionSelect?: (item: AIComposerMentionItem) => void;
		/** Called after a skill is inserted. Trigger-source `onSelect` runs first. */
		onSkillSelect?: (skill: AIComposerSkillItem) => void;
		/** Svelte Pro-compatible slash-command search callback. */
		onCommandSearch?: AIComposerCommandSearch;
		/** Svelte Pro-compatible mention/reference search callback. */
		onMentionSearch?: AIComposerMentionSearch;
		/** Svelte Pro-compatible skill search callback. */
		onSkillSearch?: AIComposerSkillSearch;
		/** Called when the suggestion popup opens. */
		onSuggestionOpen?: AIComposerSuggestionLifecycleCallback;
		/** Called when the suggestion popup closes. */
		onSuggestionClose?: AIComposerSuggestionLifecycleCallback;
		/** Called when the active suggestion query changes. */
		onSuggestionQueryChange?: AIComposerSuggestionLifecycleCallback;
		/** Called when the highlighted suggestion changes. */
		onSuggestionHighlightChange?: AIComposerSuggestionLifecycleCallback;
		/** Receives finalized microphone audio. The voice control shows a spinner until it resolves. */
		onVoiceInput?: AIComposerVoiceInputHandler;
		/** Class applied to the composer form. */
		class?: string;
		/** Theme overrides for the editor, attachments, queue, and action row. */
		theme?: AIComposerThemeProps;
		/** Theme overrides forwarded to the integrated VoiceInput primitive. */
		voiceInputTheme?: VoiceInputThemeProps;
	}
>;
