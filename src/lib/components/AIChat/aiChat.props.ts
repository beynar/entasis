import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type {
	AIComposerAttachment,
	AIComposerProps,
	AIComposerQueuedMessage
} from '../AIComposer/aiComposer.props.js';
import type { AIContextUsage } from '../AIContext/aiContext.props.js';
import type { AIConversationApi } from '../AIConversation/aiConversation.props.js';
import type {
	AIConversationLabelOverrides,
	AIConversationState,
	AIConversationStateEvents,
	AIConversationStatus
} from '../AIConversation/aiConversation.state.svelte.js';
import type {
	AIMessageActionHandler,
	AIMessageActionState
} from '../AIMessageActions/aiMessageActions.props.js';
import type {
	AIModelSelectorGroup,
	AIModelSelectorModel
} from '../AIModelSelector/aiModelSelector.props.js';
import type { Colors } from '$lib/types/theme.js';
import type {
	AIThreadDensity,
	AIThreadAskUserQuestion,
	AIThreadMessageActionsVisibility,
	AIThreadItem,
	AIThreadMessageRenderPayload,
	AIThreadRenderPayload,
	AIThreadTocSide,
	AIThreadTocState
} from '../AIThread/aiThread.props.js';
import type { AIMessageSize, AIMessageVariant } from '../AIMessage/aiMessage.props.js';
import type { AIToolCall } from '../AITool/aiTool.props.js';
import type { AIChatThemeProps } from './aiChat.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

/** Product-level snippets receive the central conversation state directly. */
export type AIChatState<TMessage extends AIThreadItem = AIThreadItem> =
	AIConversationState<TMessage>;

export type AIChatToolPayload<TMessage extends AIThreadItem = AIThreadItem> = {
	tools: readonly AIToolCall[];
	message: TMessage;
	index: number;
};

type AIChatComposerBehaviorProps = Pick<
	AIComposerProps,
	| 'disabled'
	| 'queueWhileBusy'
	| 'fileDropzone'
	| 'fileMultiple'
	| 'accept'
	| 'maxFiles'
	| 'maxFileSize'
	| 'commands'
	| 'mentions'
	| 'references'
	| 'skills'
	| 'onFilesRejected'
	| 'onFileReject'
	| 'onAttachmentAdd'
	| 'onAttachmentRetry'
	| 'onAttachmentRemove'
	| 'onQueueChange'
	| 'onQueuedMessageAdd'
	| 'onQueuedMessageCancel'
	| 'onQueuedMessageEditStart'
	| 'onQueuedMessageEditCommit'
	| 'onQueuedMessageEditCancel'
	| 'onQueuedMessageReorder'
	| 'onSteer'
	| 'submitShortcut'
	| 'toolbar'
>;

type AIChatRootAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'>;

type AIChatBaseProps<TMessage extends AIThreadItem> = AIChatComposerBehaviorProps & {
	/** Bindable reference to the assembled chat root. */
	ref?: HTMLDivElement | null;
	/** Bindable instance handle: the conversation state created by the assembled provider. */
	api?: AIConversationApi<TMessage>;
	/** Bindable lifecycle status derived and updated by conversation mutations. */
	status?: AIConversationStatus;
	/** Failure displayed by the default error region. */
	error?: unknown;
	/** Transcript messages. */
	messages?: TMessage[];
	/** Message waiting for the active response to finish. */
	queuedMessage?: TMessage | null;
	/** Composer input shared with the conversation state. */
	currentInput?: string;
	/** Files selected in the composer. */
	files?: File[];
	/** Composer attachment records, including upload state. */
	attachments?: AIComposerAttachment[];
	/** Ordered queue displayed and managed by the composer. */
	queue?: AIComposerQueuedMessage[];
	/** Assistant text that is still streaming. */
	liveText?: string;
	/**
	 * Prompt suggestions: chips under the empty-state greeting, then follow-ups above the composer
	 * after a finished assistant turn.
	 */
	suggestions?: string[];
	/** Context-window usage displayed by `AIContext`. */
	contextUsage?: AIContextUsage;
	/** Selected model identifier. */
	selectedModel?: string;
	/** Whether the assistant response is currently streaming. */
	streaming?: boolean;
	/** Active ask-user-question tool request rendered in place of the composer. */
	activeAskUserQuestion?: AIThreadAskUserQuestion<TMessage> | null;
	/** Conversation-aware label overrides. */
	labels?: AIConversationLabelOverrides;
	/** Flat models shown by the default model selector. */
	models?: readonly AIModelSelectorModel[];
	/** Nested model groups shown by the default model selector. */
	modelGroups?: readonly AIModelSelectorGroup[];
	/**
	 * Context-window limit used by the default context indicator. The indicator renders only when
	 * this is set or the conversation reports `contextUsage` (then measured against 128000).
	 */
	maxTokens?: number;
	/** Displays the default context indicator when no `context` snippet is provided. */
	showContext?: boolean;
	/** Displays the default model selector when models exist and no snippet is provided. */
	showModelSelector?: boolean;
	/** Displays the user-turn table of contents. */
	showToc?: boolean;
	/** Side occupied by the default table of contents. */
	tocSide?: AIThreadTocSide;
	/** Transcript row and edge spacing. @default 'normal' */
	density?: AIThreadDensity;
	/** Size forwarded to default message rows. @default 'normal' */
	messageSize?: AIMessageSize;
	/** Presentation forwarded to default message rows. @default 'minimal' */
	messageVariant?: AIMessageVariant;
	/**
	 * User-bubble colour forwarded to default message rows. Neutral is a quiet grey bubble; any
	 * other role paints a solid bubble. Defaults to the theme's default colour.
	 */
	messageColor?: Colors;
	/**
	 * Maximum width of the centred column shared by the transcript and the composer, as a CSS
	 * length or pixels. Exposed as `--ai-chat-content-width`; `'none'` spans the chat.
	 * @default '48rem'
	 */
	contentWidth?: string | number;
	/** Shows `suggestions` as follow-ups above the composer after an assistant turn. @default true */
	showFollowUps?: boolean;
	/** Custom action renderer shared by default message rows. */
	messageActions?: Slot<AIMessageActionState<TMessage>> | false;
	/**
	 * When default message actions show. `latest` keeps the final assistant turn's bar visible and
	 * reveals the rest on hover or focus (always on touch screens). @default 'latest'
	 */
	messageActionsVisibility?: AIThreadMessageActionsVisibility;
	/** Enables or disables default copy actions. */
	messageCopyable?: boolean;
	/** Enables or disables default edit actions. */
	messageEditable?: boolean;
	/** Enables or disables default retry actions. */
	messageRetryable?: boolean;
	/** Handles message copy actions. */
	onMessageCopy?: AIMessageActionHandler<TMessage>;
	/** Handles message edit actions. */
	onMessageEdit?: AIMessageActionHandler<TMessage>;
	/** Handles message retry actions. */
	onMessageRetry?: AIMessageActionHandler<TMessage>;
	/** Called instead of the default input update when a suggestion or follow-up is selected. */
	onSelect?: (suggestion: string) => void;
	/** Replaces the complete default surface while retaining the conversation provider. */
	children?: Slot<AIChatState<TMessage>>;
	/** Optional content above the default transcript. */
	header?: Slot<AIChatState<TMessage>>;
	/** Content inserted immediately before the transcript region. */
	beforeThread?: Slot<AIChatState<TMessage>>;
	/** Replaces the model and context controls in the default composer. */
	controls?: Slot<AIChatState<TMessage>>;
	/** Replaces the default context control. */
	context?: Slot<AIChatState<TMessage>>;
	/** Replaces the default model selector. */
	modelSelector?: Slot<AIChatState<TMessage>>;
	/**
	 * Replaces the default error, which otherwise shows as a row at the end of the transcript with
	 * a Retry button wired to the conversation's `retry`. A replacement renders above the transcript.
	 */
	errorRegion?: Slot<AIChatState<TMessage>>;
	/** Replaces the complete transcript region. */
	thread?: Slot<AIChatState<TMessage>>;
	/** Content inserted immediately after the transcript region. */
	afterThread?: Slot<AIChatState<TMessage>>;
	/** Replaces the default empty transcript state. */
	empty?: Slot<AIChatState<TMessage>>;
	/** Custom renderer for message rows. */
	message?: Slot<AIThreadMessageRenderPayload<TMessage>>;
	/** Custom renderer for grouped normal tool calls. */
	tool?: Slot<AIChatToolPayload<TMessage>>;
	/** Custom renderer for transcript markers. */
	marker?: Slot<AIThreadRenderPayload<TMessage>>;
	/** Replaces default suggestions inside the empty transcript state. */
	suggestionsRegion?: Slot<AIChatState<TMessage>>;
	/** Replaces the user-turn table of contents. */
	toc?: Slot<AIThreadTocState<TMessage>>;
	/** Replaces the complete default composer region when no question is active. */
	composer?: Slot<AIChatState<TMessage>>;
	/** Optional content below the default composer. */
	footer?: Slot<AIChatState<TMessage>>;
	/** Class applied to the assembled chat root. */
	class?: string;
	/** Theme overrides for the assembled chat regions. */
	theme?: AIChatThemeProps;
};

export type AIChatProps<TMessage extends AIThreadItem = AIThreadItem> = WithAttachments<
	AIChatRootAttributes & AIChatBaseProps<TMessage> & AIConversationStateEvents<TMessage>
>;
