import type { Snippet } from 'svelte';
import type { AIContextUsage } from '../AIContext/aiContext.props.js';
import type { AIComposerAttachment } from '../AIComposer/aiComposer.props.js';
import type { AIThreadAskUserQuestion, AIThreadItem } from '../AIThread/aiThread.props.js';
import type {
	AIConversationLabelOverrides,
	AIConversationState,
	AIConversationStateEvents,
	AIConversationStatus
} from './aiConversation.state.svelte.js';

/** Instance handle exposed by `bind:api`. */
export type AIConversationApi<TMessage extends AIThreadItem = AIThreadItem> =
	AIConversationState<TMessage>;

export type AIConversationProps<TMessage extends AIThreadItem = AIThreadItem> = Partial<{
	/** Bindable instance handle: the state created and scoped by the provider. */
	api: AIConversationApi<TMessage>;
	/** Bindable lifecycle status derived and updated by conversation mutations. */
	status: AIConversationStatus;
	/** Current conversation failure, if any. */
	error: unknown;
	/** Bindable transcript messages owned by the conversation state. */
	messages: TMessage[];
	/** Bindable message waiting for the active response to finish. */
	queuedMessage: TMessage | null;
	/** Bindable composer input shared with descendant components. */
	currentInput: string;
	/** Bindable files currently selected in the composer. */
	files: File[];
	/** Bindable attachment records, including upload state. */
	attachments: AIComposerAttachment[];
	/** Bindable assistant text that is still streaming. */
	liveText: string;
	/** Bindable prompt suggestions displayed by composed chat surfaces. */
	suggestions: string[];
	/** Bindable context-window usage shared with `AIContext`. */
	contextUsage: AIContextUsage;
	/** Bindable selected model identifier. */
	selectedModel: string;
	/** Whether an assistant response is currently streaming. */
	streaming: boolean;
	/** Active ask-user-question request derived from a tool call. */
	activeAskUserQuestion: AIThreadAskUserQuestion<TMessage> | null;
	/** Labels inherited by conversation-aware descendants. */
	labels: AIConversationLabelOverrides;
	/** Content rendered inside the scoped conversation provider. */
	children: Snippet;
}> &
	AIConversationStateEvents<TMessage>;
