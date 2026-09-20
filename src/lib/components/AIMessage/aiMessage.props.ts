import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '$lib/types/theme.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { MarkdownProps } from '../Markdown/markdown.props.js';
import type {
	AIMessageActionHandler,
	AIMessageActionState,
	AIMessageActionVisibility
} from '../AIMessageActions/aiMessageActions.props.js';
import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
import type { AIFileSource, AIThreadItem, AIThreadRole } from '../AIThread/aiThread.props.js';
import type { AIMessageThemeProps } from './aiMessage.theme.js';

export type { AIMessageActionVisibility } from '../AIMessageActions/aiMessageActions.props.js';
export type AIMessageRole = AIThreadRole;
export type AIMessageFile = AIFileSource;
export type AIMessageSize = Sizes;
export type AIMessageVariant = 'bubble' | 'minimal';
export type AIMessageMarkdownProps = Omit<MarkdownProps, 'content' | 'renderHtml'>;
export type AIMessageRenderPayload<TMessage extends AIThreadItem = AIThreadItem> = {
	message?: TMessage;
	index?: number;
	messageIndex?: number;
	role: AIThreadRole;
	content: string;
	size: AIMessageSize;
	variant: AIMessageVariant;
};

type AIMessageRootAttributes = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'content'>;

export type AIMessageProps<TMessage extends AIThreadItem = AIThreadItem> = WithAttachments<
	AIMessageRootAttributes & {
		/** Bindable reference to the message article. */
		ref?: HTMLElement | null;
		/** Source message used to derive role, content, files, name, and actions. */
		message?: TMessage;
		/** Transcript index passed to action callbacks and custom renderers. */
		messageIndex?: number;
		/** Entasis alias for `messageIndex`. */
		index?: number;
		/** Message role; overrides the source message role. */
		from?: AIThreadRole;
		/** Display name shown above the message content. */
		name?: string;
		/** Message text; overrides the source message content. */
		content?: string;
		/** Files displayed with the message. */
		files?: readonly AIFileSource[];
		/** Type and control scale. @default 'normal' */
		size?: AIMessageSize;
		/** Message presentation. Minimal keeps user bubbles but unframes assistant and tool content. @default 'bubble' */
		variant?: AIMessageVariant;
		/** Renders content with the shared Markdown component. */
		markdown?: boolean;
		/** Props forwarded to Markdown except for its owned safety boundary. */
		streamdown?: AIMessageMarkdownProps;
		/** Entasis alias for `streamdown`. */
		markdownProps?: AIMessageMarkdownProps;
		/** Conversation used by default actions. Pass `null` to disable scoped conversation lookup. */
		conversation?: AIConversationState<TMessage> | null;
		/** Disables actions or replaces them with a custom action renderer. */
		actions?: false | Slot<AIMessageActionState<TMessage>>;
		/** Controls when the default or custom action region is visible. */
		actionsVisibility?: AIMessageActionVisibility;
		/** Entasis alias for `actionsVisibility`. */
		actionVisibility?: AIMessageActionVisibility;
		/** Enables the copy action. */
		copyable?: boolean;
		/** Enables the edit action when the message role is `user`. */
		editable?: boolean;
		/** Enables the retry action when the message role is `assistant`. */
		retryable?: boolean;
		/** Entasis alias for `copyable`. */
		copyAction?: boolean;
		/** Entasis alias for `editable`. */
		editAction?: boolean;
		/** Entasis alias for `retryable`. */
		retryAction?: boolean;
		/** Replaces the message body while retaining role layout and actions. */
		children?: Slot<AIMessageRenderPayload<TMessage>>;
		/** Called with complete action state after content is copied successfully. */
		onCopy?: AIMessageActionHandler<TMessage>;
		/** Called with complete action state when edit is selected. */
		onEdit?: AIMessageActionHandler<TMessage>;
		/** Called with complete action state when retry is selected. */
		onRetry?: AIMessageActionHandler<TMessage>;
		/** Class applied to the message article. */
		class?: string;
		/** Theme overrides for role layout, files, content, and actions. */
		theme?: AIMessageThemeProps;
	}
>;
