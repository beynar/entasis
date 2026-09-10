import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density } from '$lib/types/theme.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIMarkerVariant } from '$lib/components/AIMarker/aiMarker.props.js';
import type {
	AIAskAnswers,
	AIAskQuestion,
	AIAskUserQuestionAnswer
} from '$lib/components/AIAskUserQuestion/aiAskUserQuestion.props.js';
import type { AIComposerAttachment } from '$lib/components/AIComposer/aiComposer.props.js';
import type { AIMcpAppHostConfig, AIMcpToolCall } from '$lib/components/AIMcpApp/aiMcpApp.props.js';
import type { AIToolCall, AIToolProps, AIToolStatus } from '$lib/components/AITool/aiTool.props.js';
import type {
	AIMessageActionHandler,
	AIMessageActionSnippet,
	AIMessageActionVisibility
} from '$lib/components/AIMessageActions/aiMessageActions.props.js';
import type { AIMessageSize, AIMessageVariant } from '$lib/components/AIMessage/aiMessage.props.js';
import type { AIThreadTocThemeProps } from '$lib/components/AIThreadToc/aiThreadToc.theme.js';
import type { AIThreadThemeProps } from './aiThread.theme.js';

export type AIThreadMessageKey = string | number | bigint;
export type AIThreadRole = 'user' | 'assistant' | 'system' | 'tool' | (string & {});

export type AIFileSource =
	| File
	| {
			id?: AIThreadMessageKey;
			name: string;
			size?: number;
			type?: string;
			previewUrl?: string;
	  };

export type AIThreadToolPart = {
	type: 'dynamic-tool' | `tool-${string}`;
	toolName?: string;
	toolCallId?: string;
	state?: string;
	input?: unknown;
	output?: unknown;
	structuredContent?: unknown;
	result?: unknown;
	error?: unknown;
	errorText?: string;
	_meta?: Record<string, unknown>;
};

export type AIThreadPart = {
	type?: string;
	text?: string;
	tool?: AIToolCall;
	content?: string;
	variant?: AIMarkerVariant;
	toolName?: string;
	toolCallId?: string;
	state?: string;
	input?: unknown;
	output?: unknown;
	structuredContent?: unknown;
	result?: unknown;
	error?: unknown;
	errorText?: string;
	_meta?: Record<string, unknown>;
	[key: string]: unknown;
};

export type AIThreadItem = {
	id?: AIThreadMessageKey;
	role?: AIThreadRole;
	type?: 'message' | 'marker' | 'context' | 'tool' | (string & {});
	name?: string;
	content?: string;
	files?: AIFileSource[];
	attachments?: AIComposerAttachment[];
	markerVariant?: AIMarkerVariant;
	parts?: AIThreadPart[];
	tool?: AIToolCall;
	tools?: AIToolCall[];
	toolName?: string;
	status?: AIToolStatus;
	input?: unknown;
	output?: unknown;
	error?: unknown;
};

export type AIThreadAskUserQuestionState = 'pending' | 'completed' | 'discarded';
export type AIThreadAskUserQuestion<TMessage extends AIThreadItem = AIThreadItem> = {
	key: string;
	message: TMessage;
	messageIndex: number;
	tool: AIToolCall;
	toolIndex?: number;
	state?: AIThreadAskUserQuestionState;
	questions: readonly AIAskQuestion[];
	value?: AIAskAnswers;
	title?: string;
	requester?: string;
	context?: string;
	submitLabel?: string;
	submittingLabel?: string;
	nextLabel?: string;
	previousLabel?: string;
	discardLabel?: string;
};
export type AIThreadAskUserQuestionStateChange<TMessage extends AIThreadItem = AIThreadItem> = {
	request: AIThreadAskUserQuestion<TMessage>;
	state: Exclude<AIThreadAskUserQuestionState, 'pending'>;
	detail?: { answers: AIAskUserQuestionAnswer[]; values: AIAskAnswers };
};

export type AIThreadRenderPayload<TMessage extends AIThreadItem = AIThreadItem> = {
	message: TMessage;
	index: number;
};

export type AIThreadMessageRenderPayload<TMessage extends AIThreadItem = AIThreadItem> =
	AIThreadRenderPayload<TMessage> & {
		/** Visibility resolved by the thread for this message's action region. */
		actionsVisibility: AIMessageActionVisibility;
	};

export type AIThreadScrollBehavior = 'auto' | 'smooth' | 'instant';
export type AIThreadScrollButtonPosition = 'left' | 'center' | 'right';
export type AIThreadDensity = Density;
export type AIThreadTocSide = 'left' | 'right';
export type AIThreadTocPreviewSide = 'left' | 'right';
export type AIThreadTocPreviewAlign = 'start' | 'center' | 'end';

export type AIThreadTocEntry<TMessage extends AIThreadItem = AIThreadItem> = {
	key: string;
	index: number;
	messageIndex: number;
	message: TMessage;
	role?: AIThreadRole;
	name?: string;
	/** Normalized user prompt shown as the preview's first line. */
	title: string;
	/** Latest assistant response before the next user turn. */
	excerpt: string;
	fileCount: number;
	files: readonly AIFileSource[];
	attachments: readonly AIComposerAttachment[];
	offset: number;
	size: number;
};

export type AIThreadTocRange = {
	startOffset: number;
	endOffset: number;
	totalSize: number;
};

export type AIThreadTocState<TMessage extends AIThreadItem = AIThreadItem> = {
	entries: readonly AIThreadTocEntry<TMessage>[];
	range: AIThreadTocRange;
	activeIndex?: number;
	visibleStartOffset: number;
	visibleEndOffset: number;
	scrollToIndex: (index: number) => void;
	scrollToOffset: (offset: number) => void;
};

export type AIThreadTocPin<TMessage extends AIThreadItem = AIThreadItem> = {
	key: string;
	entry: AIThreadTocEntry<TMessage>;
	entryIndex: number;
	isBucket: boolean;
};

export type AIThreadTocPinPayload<TMessage extends AIThreadItem = AIThreadItem> = {
	entry: AIThreadTocEntry<TMessage>;
	active: boolean;
};

type AIThreadRootAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'role'>;

export type AIThreadProps<TMessage extends AIThreadItem = AIThreadItem> = WithAttachments<
	AIThreadRootAttributes & {
		/** Bindable reference to the thread root. */
		ref?: HTMLDivElement | null;
		/** Transcript items; falls back to the nearest conversation state. */
		messages?: readonly TMessage[];
		/** Returns a stable key when messages do not expose a unique `id`. */
		getMessageKey?: (message: TMessage, index: number) => AIThreadMessageKey | undefined;
		/** Text announced through the internal polite live region. */
		liveText?: string;
		/** Whether an assistant response is currently streaming. */
		isStreaming?: boolean;
		/** Transcript row and edge spacing. @default 'normal' */
		density?: AIThreadDensity;
		/** Size forwarded to default AIMessage rows. @default 'normal' */
		messageSize?: AIMessageSize;
		/** Presentation forwarded to default AIMessage rows. @default 'bubble' */
		messageVariant?: AIMessageVariant;
		/** Follows appended output while the viewport remains pinned to the bottom. */
		followOutput?: boolean;
		/** Distance from the bottom, in pixels, considered pinned. */
		bottomThreshold?: number;
		/** Estimated virtual row height in pixels. */
		estimateSize?: number;
		/** Number of virtual rows rendered beyond the visible range. */
		overscan?: number;
		/** Shared vertical virtualizer padding in pixels. */
		padding?: number;
		/** Virtualizer padding before the first item. Overrides `padding`. */
		paddingStart?: number;
		/** Virtualizer padding after the final item. Overrides `padding`. */
		paddingEnd?: number;
		/** Scroll behavior used by transcript navigation. */
		scrollBehavior?: AIThreadScrollBehavior;
		/** Displays the floating scroll-to-latest action. */
		showScrollButton?: boolean;
		/** Horizontal alignment of the scroll-to-latest action. */
		scrollButtonPosition?: AIThreadScrollButtonPosition;
		/** Displays the user-turn minimap when multiple turns overflow the viewport. */
		showToc?: boolean;
		/** Side occupied by the default user-turn minimap. @default 'left' */
		tocSide?: AIThreadTocSide;
		/** Maximum visible minimap pins before compaction. */
		tocMaxPins?: number;
		/** Theme overrides forwarded to the default AIThreadToc. */
		tocTheme?: AIThreadTocThemeProps;
		/** MCP Apps host used for application tool calls. */
		mcpHost?: AIMcpAppHostConfig;
		/** Direct ask-user-question request. `null` explicitly suppresses auto-detection. */
		activeAskUserQuestion?: AIThreadAskUserQuestion<TMessage> | null;
		/** Renders detected ask-user-question tools as an interactive question flow. */
		renderAskUserQuestion?: boolean;
		/** Disables the active ask-user-question flow. */
		askUserQuestionDisabled?: boolean;
		/** Suggestions used as the default empty state. */
		suggestions?: readonly string[];
		/** Handles selection from the default empty-state suggestions. */
		onSuggestionSelect?: (suggestion: string) => void;
		/** Content rendered above the virtual transcript. */
		header?: Slot;
		/** Content rendered below the virtual transcript. */
		footer?: Slot;
		/** Replaces the default user-turn minimap. */
		toc?: Slot<AIThreadTocState<TMessage>>;
		/** Replaces the default empty transcript state. */
		empty?: Slot;
		/** Custom message renderer. */
		message?: Slot<AIThreadMessageRenderPayload<TMessage>>;
		/** Custom action renderer shared by default message rows. */
		messageActions?: AIMessageActionSnippet<TMessage> | false;
		/** Controls default message action visibility. @default 'always' */
		messageActionsVisibility?: AIMessageActionVisibility;
		/** Enables or disables copy actions. */
		messageCopyable?: boolean;
		/** Enables or disables edit actions. */
		messageEditable?: boolean;
		/** Enables or disables retry actions. */
		messageRetryable?: boolean;
		/** Handles message copy actions. */
		onMessageCopy?: AIMessageActionHandler<TMessage>;
		/** Handles message edit actions. */
		onMessageEdit?: AIMessageActionHandler<TMessage>;
		/** Handles message retry actions. */
		onMessageRetry?: AIMessageActionHandler<TMessage>;
		/** Custom renderer for grouped consecutive tool calls. */
		tool?: Slot<{ tools: readonly AIToolCall[]; message: TMessage; index: number }>;
		/** Custom icon renderer forwarded to default tool groups. */
		toolIcon?: AIToolProps['icon'];
		/** Custom title renderer forwarded to default tool groups. */
		toolTitle?: AIToolProps['title'];
		/** Custom input renderer forwarded to default tool groups. */
		toolInput?: AIToolProps['input'];
		/** Custom output renderer forwarded to default tool groups. */
		toolOutput?: AIToolProps['output'];
		/** Replaces the complete body of each default tool call. */
		toolContent?: AIToolProps['content'];
		/** Custom error renderer forwarded to default tool groups. */
		toolError?: AIToolProps['error'];
		/** Custom status renderer forwarded to default tool groups. */
		toolStatus?: AIToolProps['status'];
		/** Custom marker renderer. */
		marker?: Slot<AIThreadRenderPayload<TMessage>>;
		/** Custom icon rendered by the default marker. */
		markerIcon?: Slot<AIThreadRenderPayload<TMessage>>;
		/** Custom content rendered by the default marker. */
		markerContent?: Slot<AIThreadRenderPayload<TMessage>>;
		/** Custom renderer for individual MCP App tool calls. */
		app?: Slot<{ tool: AIMcpToolCall; message: TMessage; index: number }>;
		/** Handles completion or dismissal of an ask-user-question request. */
		onAskUserQuestionStateChange?: (
			change: AIThreadAskUserQuestionStateChange<TMessage>
		) => void | Promise<void>;
		/** Class applied to the thread root. */
		class?: string;
		/** ARIA role applied to the thread root. */
		role?: HTMLAttributes<HTMLDivElement>['role'];
		/** Accessible label applied to the focusable transcript viewport. */
		viewportLabel?: string;
		/** Theme overrides for transcript rows and the minimap. */
		theme?: AIThreadThemeProps;
	}
>;
