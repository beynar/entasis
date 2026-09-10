import { getContext, setContext } from 'svelte';
import { bind } from '$lib/utils/state.svelte.js';
import type { AIContextUsage } from '../AIContext/aiContext.props.js';
import type {
	AIComposerAttachment,
	AIComposerSubmitEvent,
	AIComposerSubmitMeta
} from '../AIComposer/aiComposer.props.js';
import type {
	AIThreadAskUserQuestion,
	AIThreadAskUserQuestionState,
	AIThreadAskUserQuestionStateChange,
	AIThreadItem,
	AIThreadMessageKey
} from '../AIThread/aiThread.props.js';
import {
	createAskUserQuestionToolMutation,
	updateAIConversationMessageTool,
	type AIConversationToolTarget,
	type AIConversationToolUpdate,
	type AIConversationToolUpdateChange
} from './AIConversationToolLifecycle.js';

export const AI_CONVERSATION_CONTEXT_KEY = 'ai-conversation';

export type AIConversationLabels = {
	composer: { placeholder: string; submitLabel: string; stopLabel: string; attachLabel: string };
	modelSelector: { placeholder: string };
};
export type AIConversationLabelOverrides = {
	composer?: Partial<AIConversationLabels['composer']>;
	modelSelector?: Partial<AIConversationLabels['modelSelector']>;
};
export const DEFAULT_AI_CONVERSATION_LABELS: AIConversationLabels = {
	composer: {
		placeholder: 'Ask anything...',
		submitLabel: 'Send message',
		stopLabel: 'Stop response',
		attachLabel: 'Attach files'
	},
	modelSelector: { placeholder: 'Select model' }
};

export type AIConversationStatus =
	'idle' | 'queued' | 'asking-user' | 'streaming' | 'stopping' | 'error';
export type AIConversationMessageTarget<TMessage extends AIThreadItem = AIThreadItem> =
	| { id: AIThreadMessageKey }
	| { index: number }
	| { where: (message: TMessage, index: number) => boolean };
export type AIConversationMessageUpdate<TMessage extends AIThreadItem = AIThreadItem> =
	TMessage | ((message: TMessage, index: number) => TMessage);
export type AIConversationSubmitDetail<TMessage extends AIThreadItem = AIThreadItem> = {
	message: TMessage;
	value?: string;
	event?: AIComposerSubmitEvent;
	meta?: AIComposerSubmitMeta;
};
export type AIConversationRetryDetail<TMessage extends AIThreadItem = AIThreadItem> = {
	target?: AIConversationMessageTarget<TMessage>;
	message?: TMessage;
};

/** Previous and current value reported by a conversation state callback. */
export type AIConversationValueChangePayload<
	TValue,
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	value: TValue;
	previousValue: TValue;
	conversation: AIConversationState<TMessage>;
}>;

/** Derived status transition reported by `onStatusChange`. */
export type AIConversationStatusChangePayload<
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	status: AIConversationStatus;
	previousStatus: AIConversationStatus;
	conversation: AIConversationState<TMessage>;
}>;

/** Submitted message details and their owning conversation. */
export type AIConversationSubmitPayload<TMessage extends AIThreadItem = AIThreadItem> =
	Readonly<AIConversationSubmitDetail<TMessage> & { conversation: AIConversationState<TMessage> }>;

/** Retry request and its owning conversation. */
export type AIConversationRetryPayload<TMessage extends AIThreadItem = AIThreadItem> =
	Readonly<AIConversationRetryDetail<TMessage> & { conversation: AIConversationState<TMessage> }>;

/** Conversation error and the state that owns it. */
export type AIConversationErrorPayload<TMessage extends AIThreadItem = AIThreadItem> = Readonly<{
	error: unknown;
	conversation: AIConversationState<TMessage>;
}>;

/** Message mutation and its owning conversation. */
export type AIConversationMessagePayload<TMessage extends AIThreadItem = AIThreadItem> = Readonly<{
	message: TMessage;
	index: number;
	conversation: AIConversationState<TMessage>;
}>;

/** Message replacement with its previous value and index. */
export type AIConversationMessageUpdatePayload<
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	message: TMessage;
	previousMessage: TMessage;
	index: number;
	conversation: AIConversationState<TMessage>;
}>;

/** Queued message action and its owning conversation. */
export type AIConversationQueuedMessagePayload<
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	message: TMessage;
	conversation: AIConversationState<TMessage>;
}>;

/** Tool mutation and its owning conversation. */
export type AIConversationToolUpdatePayload<
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	change: AIConversationToolUpdateChange<TMessage>;
	conversation: AIConversationState<TMessage>;
}>;

/** Ask-user-question transition and its owning conversation. */
export type AIConversationAskUserQuestionChangePayload<
	TMessage extends AIThreadItem = AIThreadItem
> = Readonly<{
	change: AIThreadAskUserQuestionStateChange<TMessage>;
	conversation: AIConversationState<TMessage>;
}>;

export type AIConversationBindableState<TMessage extends AIThreadItem = AIThreadItem> = {
	status: AIConversationStatus;
	error: unknown | undefined;
	messages: TMessage[];
	queuedMessage: TMessage | null;
	currentInput: string;
	files: File[];
	attachments: AIComposerAttachment[];
	liveText: string | undefined;
	suggestions: string[];
	contextUsage: AIContextUsage | undefined;
	selectedModel: string | undefined;
	isStreaming: boolean;
	activeAskUserQuestion: AIThreadAskUserQuestion<TMessage> | null;
};

export type AIConversationStateEvents<TMessage extends AIThreadItem = AIThreadItem> = {
	/** Called after the derived conversation status changes. */
	onStatusChange?: (payload: AIConversationStatusChangePayload<TMessage>) => void;
	/** Handles a submitted or steered message without imposing a transport. */
	onSubmit?: (payload: AIConversationSubmitPayload<TMessage>) => void;
	/** Requests that the active response stop. */
	onStop?: (state: AIConversationState<TMessage>) => void;
	/** Requests regeneration for an optional message target. */
	onRetry?: (payload: AIConversationRetryPayload<TMessage>) => void;
	/** Called when the conversation enters an error state. */
	onError?: (payload: AIConversationErrorPayload<TMessage>) => void;
	/** Called after a message is appended. */
	onMessageAppend?: (payload: AIConversationMessagePayload<TMessage>) => void;
	/** Called after a message is prepended. */
	onMessagePrepend?: (payload: AIConversationMessagePayload<TMessage>) => void;
	/** Called after a targeted message is replaced. */
	onMessageUpdate?: (payload: AIConversationMessageUpdatePayload<TMessage>) => void;
	/** Called after a targeted message is removed. */
	onMessageRemove?: (payload: AIConversationMessagePayload<TMessage>) => void;
	/** Called after a targeted tool call is updated. */
	onToolUpdate?: (payload: AIConversationToolUpdatePayload<TMessage>) => void;
	/** Called after the shared composer input changes. */
	onInputChange?: (payload: AIConversationValueChangePayload<string, TMessage>) => void;
	/** Called after selected files change. */
	onFilesChange?: (payload: AIConversationValueChangePayload<File[], TMessage>) => void;
	/** Called after composer attachment records change. */
	onAttachmentsChange?: (
		payload: AIConversationValueChangePayload<AIComposerAttachment[], TMessage>
	) => void;
	/** Called after streamed assistant text changes. */
	onLiveTextChange?: (
		payload: AIConversationValueChangePayload<string | undefined, TMessage>
	) => void;
	/** Called after prompt suggestions change. */
	onSuggestionsChange?: (payload: AIConversationValueChangePayload<string[], TMessage>) => void;
	/** Called after the selected model changes. */
	onSelectedModelChange?: (
		payload: AIConversationValueChangePayload<string | undefined, TMessage>
	) => void;
	/** Called after the queued message changes. */
	onQueuedMessageChange?: (
		payload: AIConversationValueChangePayload<TMessage | null, TMessage>
	) => void;
	/** Called after the queued message is committed to the transcript. */
	onQueuedMessageCommit?: (payload: AIConversationQueuedMessagePayload<TMessage>) => void;
	/** Called after the queued message is discarded. */
	onQueuedMessageDiscard?: (payload: AIConversationQueuedMessagePayload<TMessage>) => void;
	/** Called after context-window usage changes. */
	onContextUsageChange?: (
		payload: AIConversationValueChangePayload<AIContextUsage | undefined, TMessage>
	) => void;
	/** Called after streaming starts or stops. */
	onStreamingChange?: (payload: AIConversationValueChangePayload<boolean, TMessage>) => void;
	/** Called when the active ask-user-question request changes. */
	onActiveAskUserQuestionChange?: (
		payload: AIConversationValueChangePayload<AIThreadAskUserQuestion<TMessage> | null, TMessage>
	) => void;
	/** Handles completion or dismissal of an ask-user-question request. */
	onAskUserQuestionStateChange?: (
		payload: AIConversationAskUserQuestionChangePayload<TMessage>
	) => void | Promise<void>;
};

export type AIConversationStateOptions<TMessage extends AIThreadItem = AIThreadItem> =
	AIConversationBindableState<TMessage> &
		AIConversationStateEvents<TMessage> & { labels?: AIConversationLabels };

const bindableStateKeys: Array<keyof AIConversationBindableState> = [
	'status',
	'error',
	'messages',
	'queuedMessage',
	'currentInput',
	'files',
	'attachments',
	'liveText',
	'suggestions',
	'contextUsage',
	'selectedModel',
	'isStreaming',
	'activeAskUserQuestion'
];

export class AIConversationState<TMessage extends AIThreadItem = AIThreadItem>
	implements AIConversationBindableState<TMessage>, AIConversationStateEvents<TMessage>
{
	declare status: AIConversationStatus;
	declare error: unknown | undefined;
	declare messages: TMessage[];
	declare queuedMessage: TMessage | null;
	declare currentInput: string;
	declare files: File[];
	declare attachments: AIComposerAttachment[];
	declare liveText: string | undefined;
	declare suggestions: string[];
	declare contextUsage: AIContextUsage | undefined;
	declare selectedModel: string | undefined;
	declare isStreaming: boolean;
	declare activeAskUserQuestion: AIThreadAskUserQuestion<TMessage> | null;
	declare onStatusChange: AIConversationStateEvents<TMessage>['onStatusChange'];
	declare onSubmit: AIConversationStateEvents<TMessage>['onSubmit'];
	declare onStop: AIConversationStateEvents<TMessage>['onStop'];
	declare onRetry: AIConversationStateEvents<TMessage>['onRetry'];
	declare onError: AIConversationStateEvents<TMessage>['onError'];
	declare onMessageAppend: AIConversationStateEvents<TMessage>['onMessageAppend'];
	declare onMessagePrepend: AIConversationStateEvents<TMessage>['onMessagePrepend'];
	declare onMessageUpdate: AIConversationStateEvents<TMessage>['onMessageUpdate'];
	declare onMessageRemove: AIConversationStateEvents<TMessage>['onMessageRemove'];
	declare onToolUpdate: AIConversationStateEvents<TMessage>['onToolUpdate'];
	declare onInputChange: AIConversationStateEvents<TMessage>['onInputChange'];
	declare onFilesChange: AIConversationStateEvents<TMessage>['onFilesChange'];
	declare onAttachmentsChange: AIConversationStateEvents<TMessage>['onAttachmentsChange'];
	declare onLiveTextChange: AIConversationStateEvents<TMessage>['onLiveTextChange'];
	declare onSuggestionsChange: AIConversationStateEvents<TMessage>['onSuggestionsChange'];
	declare onSelectedModelChange: AIConversationStateEvents<TMessage>['onSelectedModelChange'];
	declare onQueuedMessageChange: AIConversationStateEvents<TMessage>['onQueuedMessageChange'];
	declare onQueuedMessageCommit: AIConversationStateEvents<TMessage>['onQueuedMessageCommit'];
	declare onQueuedMessageDiscard: AIConversationStateEvents<TMessage>['onQueuedMessageDiscard'];
	declare onContextUsageChange: AIConversationStateEvents<TMessage>['onContextUsageChange'];
	declare onStreamingChange: AIConversationStateEvents<TMessage>['onStreamingChange'];
	declare onActiveAskUserQuestionChange: AIConversationStateEvents<TMessage>['onActiveAskUserQuestionChange'];
	declare onAskUserQuestionStateChange: AIConversationStateEvents<TMessage>['onAskUserQuestionStateChange'];

	labels = DEFAULT_AI_CONVERSATION_LABELS;
	parent: AIConversationState<TMessage> | null =
		getContext<AIConversationState<TMessage> | undefined>(AI_CONVERSATION_CONTEXT_KEY) ?? null;

	constructor(options: AIConversationStateOptions<TMessage>) {
		assertBindableStateDescriptors(options);
		bind(this, options);
		this.status = this.deriveStatus();
		setContext(AI_CONVERSATION_CONTEXT_KEY, this);
	}

	appendMessage = (message: TMessage) => {
		this.messages = [...this.messages, message];
		this.onMessageAppend?.({ message, index: this.messages.length - 1, conversation: this });
		return message;
	};
	prependMessage = (message: TMessage) => {
		this.messages = [message, ...this.messages];
		this.onMessagePrepend?.({ message, index: 0, conversation: this });
		return message;
	};
	updateMessage = (
		target: AIConversationMessageTarget<TMessage>,
		update: AIConversationMessageUpdate<TMessage>
	) => {
		const index = this.findMessageIndex(target);
		const previousMessage = this.messages[index];
		if (!previousMessage)
			throw new Error(`Cannot update missing AI conversation message at index ${index}.`);
		const message = typeof update === 'function' ? update(previousMessage, index) : update;
		this.messages = this.messages.map((current, currentIndex) =>
			currentIndex === index ? message : current
		);
		this.onMessageUpdate?.({ message, previousMessage, index, conversation: this });
		return message;
	};
	removeMessage = (target: AIConversationMessageTarget<TMessage>) => {
		const index = this.findMessageIndex(target);
		const message = this.messages[index];
		if (!message)
			throw new Error(`Cannot remove missing AI conversation message at index ${index}.`);
		this.messages = this.messages.filter((_, currentIndex) => currentIndex !== index);
		this.onMessageRemove?.({ message, index, conversation: this });
		return message;
	};
	updateTool = (
		messageTarget: AIConversationMessageTarget<TMessage>,
		toolTarget: AIConversationToolTarget,
		update: AIConversationToolUpdate
	) => {
		const messageIndex = this.findMessageIndex(messageTarget);
		const previousMessage = this.messages[messageIndex];
		if (!previousMessage)
			throw new Error(
				`Cannot update tool for missing AI conversation message at index ${messageIndex}.`
			);
		const change = updateAIConversationMessageTool(previousMessage, toolTarget, update);
		if (change.tool === change.previousTool) return change.tool;
		this.messages = this.messages.map((message, index) =>
			index === messageIndex ? change.message : message
		);
		this.onMessageUpdate?.({
			message: change.message,
			previousMessage,
			index: messageIndex,
			conversation: this
		});
		this.onToolUpdate?.({
			change: { ...change, previousMessage, messageIndex },
			conversation: this
		});
		return change.tool;
	};

	setInput = (value: string) => this.updateValue('currentInput', value, this.onInputChange);
	setFiles = (value: File[]) => this.updateValue('files', value, this.onFilesChange);
	setAttachments = (value: AIComposerAttachment[]) =>
		this.updateValue('attachments', value, this.onAttachmentsChange);
	setSelectedModel = (value: string | undefined) =>
		this.updateValue('selectedModel', value, this.onSelectedModelChange);
	setLiveText = (value: string | undefined) =>
		this.updateValue('liveText', value, this.onLiveTextChange);
	setSuggestions = (value: string[]) =>
		this.updateValue('suggestions', value, this.onSuggestionsChange);
	setQueuedMessage = (message: TMessage | null) => {
		const previousMessage = this.queuedMessage;
		if (previousMessage === message) {
			this.syncStatus();
			return message;
		}
		this.queuedMessage = message;
		this.syncStatus();
		this.onQueuedMessageChange?.({
			value: message,
			previousValue: previousMessage,
			conversation: this
		});
		return message;
	};
	queueMessage = (message: TMessage) => {
		this.clearErrorValue();
		return this.setQueuedMessage(message);
	};
	submitMessage = (
		message: TMessage,
		detail: Omit<AIConversationSubmitDetail<TMessage>, 'message'> = {}
	) => {
		this.queueMessage(message);
		const committed = this.commitQueuedMessage();
		this.onSubmit?.({ ...detail, message: committed, conversation: this });
		return committed;
	};
	commitQueuedMessage = () => {
		const message = this.queuedMessage;
		if (!message)
			throw new Error('Cannot commit an AI conversation message because no message is queued.');
		this.messages = [...this.messages, message];
		this.queuedMessage = null;
		this.syncStatus();
		this.onQueuedMessageChange?.({ value: null, previousValue: message, conversation: this });
		this.onMessageAppend?.({ message, index: this.messages.length - 1, conversation: this });
		this.onQueuedMessageCommit?.({ message, conversation: this });
		return message;
	};
	discardQueuedMessage = () => {
		const message = this.queuedMessage;
		if (!message)
			throw new Error('Cannot discard an AI conversation message because no message is queued.');
		this.queuedMessage = null;
		this.syncStatus();
		this.onQueuedMessageChange?.({ value: null, previousValue: message, conversation: this });
		this.onQueuedMessageDiscard?.({ message, conversation: this });
		return message;
	};
	updateContextUsage = (
		update:
			| AIContextUsage
			| undefined
			| ((usage: AIContextUsage | undefined) => AIContextUsage | undefined)
	) => {
		const previous = this.contextUsage;
		const usage = typeof update === 'function' ? update(previous) : update;
		if (previous !== usage) {
			this.contextUsage = usage;
			this.onContextUsageChange?.({ value: usage, previousValue: previous, conversation: this });
		}
		return usage;
	};
	startStreaming = () => {
		this.clearErrorValue();
		this.setStreaming(true);
		this.setStatus('streaming');
		return this.isStreaming;
	};
	stopStreaming = () => {
		this.setStreaming(false);
		this.syncStatus();
		return this.isStreaming;
	};
	requestStop = () => {
		if (this.status === 'stopping' || (!this.isStreaming && this.status !== 'streaming'))
			return this.status;
		this.setStatus('stopping');
		this.onStop?.(this);
		if (!this.onStop) this.stopStreaming();
		return this.status;
	};
	retry = (target?: AIConversationMessageTarget<TMessage>) => {
		const message = target ? this.messages[this.findMessageIndex(target)] : undefined;
		this.clearError();
		this.onRetry?.({ target, message, conversation: this });
		return message;
	};
	setError = (error: unknown) => {
		if (error === undefined) throw new Error('Cannot set an AI conversation error to undefined.');
		if (this.error === error && this.status === 'error') return error;
		this.setStreaming(false);
		this.error = error;
		this.setStatus('error');
		this.onError?.({ error, conversation: this });
		return error;
	};
	clearError = () => {
		const previous = this.error;
		if (previous !== undefined) {
			this.clearErrorValue();
			this.syncStatus();
		}
		return previous;
	};
	setActiveAskUserQuestion = (request: AIThreadAskUserQuestion<TMessage> | null) => {
		const previous = this.activeAskUserQuestion;
		if ((previous?.key ?? null) === (request?.key ?? null)) {
			this.syncStatus();
			return request;
		}
		this.activeAskUserQuestion = request;
		this.syncStatus();
		this.onActiveAskUserQuestionChange?.({
			value: request,
			previousValue: previous,
			conversation: this
		});
		return request;
	};
	resolveAskUserQuestion = async (
		state: Exclude<AIThreadAskUserQuestionState, 'pending'>,
		detail?: AIThreadAskUserQuestionStateChange<TMessage>['detail'],
		currentRequest?: AIThreadAskUserQuestion<TMessage>
	) => {
		const request = currentRequest ?? this.activeAskUserQuestion;
		if (!request)
			throw new Error('Cannot resolve an ask-user-question request because none is active.');
		const mutation = createAskUserQuestionToolMutation(this.messages, request, state, detail);
		this.updateTool(mutation.messageTarget, mutation.toolTarget, mutation.update);
		if (!this.activeAskUserQuestion || this.activeAskUserQuestion.key === request.key) {
			this.setActiveAskUserQuestion(null);
		}
		const change = {
			request,
			state,
			detail
		} satisfies AIThreadAskUserQuestionStateChange<TMessage>;
		await this.onAskUserQuestionStateChange?.({ change, conversation: this });
		return change;
	};

	private updateValue<
		Key extends
			'currentInput' | 'files' | 'attachments' | 'selectedModel' | 'liveText' | 'suggestions'
	>(
		key: Key,
		value: AIConversationBindableState<TMessage>[Key],
		callback:
			| ((
					payload: AIConversationValueChangePayload<
						AIConversationBindableState<TMessage>[Key],
						TMessage
					>
			  ) => void)
			| undefined
	) {
		const previous = this[key];
		if (previous === value) return value;
		Reflect.set(this, key, value);
		callback?.({ value, previousValue: previous, conversation: this });
		return value;
	}
	private setStatus(status: AIConversationStatus) {
		const previous = this.status;
		if (previous !== status) {
			this.status = status;
			this.onStatusChange?.({ status, previousStatus: previous, conversation: this });
		}
		return status;
	}
	private setStreaming(value: boolean) {
		const previous = this.isStreaming;
		if (previous !== value) {
			this.isStreaming = value;
			this.onStreamingChange?.({ value, previousValue: previous, conversation: this });
		}
		return value;
	}
	private syncStatus() {
		if (this.error !== undefined) return this.setStatus('error');
		if (this.status === 'stopping' && this.isStreaming) return this.status;
		return this.setStatus(this.deriveStatus());
	}
	private deriveStatus(): AIConversationStatus {
		if (this.error !== undefined) return 'error';
		if (this.activeAskUserQuestion) return 'asking-user';
		if (this.isStreaming) return 'streaming';
		if (this.queuedMessage) return 'queued';
		return 'idle';
	}
	private clearErrorValue() {
		if (this.error !== undefined) this.error = undefined;
	}
	private findMessageIndex(target: AIConversationMessageTarget<TMessage>) {
		if ('index' in target) {
			if (
				!Number.isInteger(target.index) ||
				target.index < 0 ||
				target.index >= this.messages.length
			)
				throw new Error(`AI conversation message index ${target.index} is out of range.`);
			return target.index;
		}
		const matches = this.messages
			.map((message, index) => ({ message, index }))
			.filter(({ message, index }) =>
				'id' in target ? message.id === target.id : target.where(message, index)
			);
		if (matches.length > 1)
			throw new Error('AI conversation message target matched multiple messages.');
		const [match] = matches;
		if (!match) throw new Error('Cannot find AI conversation message for the provided target.');
		return match.index;
	}
}

export function resolveAIConversationLabels(
	labels?: AIConversationLabelOverrides
): AIConversationLabels {
	return {
		composer: { ...DEFAULT_AI_CONVERSATION_LABELS.composer, ...labels?.composer },
		modelSelector: { ...DEFAULT_AI_CONVERSATION_LABELS.modelSelector, ...labels?.modelSelector }
	};
}
export function getAIConversation<TMessage extends AIThreadItem = AIThreadItem>() {
	return getContext<AIConversationState<TMessage> | undefined>(AI_CONVERSATION_CONTEXT_KEY) ?? null;
}
export function useAIConversation<TMessage extends AIThreadItem = AIThreadItem>() {
	const conversation = getAIConversation<TMessage>();
	if (!conversation)
		throw new Error('useAIConversation must be called inside an AIConversation provider.');
	return conversation;
}

function assertBindableStateDescriptors<TMessage extends AIThreadItem>(
	options: AIConversationStateOptions<TMessage>
) {
	const descriptors = Object.getOwnPropertyDescriptors(options);
	for (const key of bindableStateKeys) {
		const descriptor = descriptors[key];
		if (
			!descriptor ||
			!('get' in descriptor) ||
			typeof descriptor.get !== 'function' ||
			typeof descriptor.set !== 'function'
		)
			throw new Error(`AIConversationState "${key}" must be passed as a getter/setter descriptor.`);
	}
}
