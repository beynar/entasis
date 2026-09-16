import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '$lib/types/theme.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIThreadItem, AIThreadRole } from '../AIThread/aiThread.props.js';
import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
import type { AIMessageActionsThemeProps } from './aiMessageActions.theme.js';

export type AIMessageActionState<TMessage extends AIThreadItem = AIThreadItem> = {
	message?: TMessage;
	messageIndex?: number;
	/** Svelai alias for `messageIndex`. */
	index?: number;
	role: AIThreadRole;
	content: string;
	size: Sizes;
	copied: boolean;
	canCopy: boolean;
	canEdit: boolean;
	canRetry: boolean;
	conversation: AIConversationState<TMessage> | null;
	copy: () => Promise<boolean>;
	edit: () => Promise<void>;
	retry: () => Promise<void>;
};

export type AIMessageActionHandler<TMessage extends AIThreadItem = AIThreadItem> = (
	payload: AIMessageActionState<TMessage>
) => void | Promise<void>;

export type AIMessageActionSnippet<TMessage extends AIThreadItem = AIThreadItem> = Slot<
	AIMessageActionState<TMessage>
>;

export type AIMessageActionVisibility = 'hover' | 'always' | 'none';

type AIMessageActionsRootAttributes = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class' | 'content' | 'role'
>;

export type AIMessageActionsProps<TMessage extends AIThreadItem = AIThreadItem> = WithAttachments<
	AIMessageActionsRootAttributes & {
		/** Bindable reference to the action group. */
		ref?: HTMLDivElement | null;
		/** Source message passed to edit, retry, and custom actions. */
		message?: TMessage;
		/** Transcript index passed to edit, retry, and custom actions. */
		messageIndex?: number;
		/** Svelai alias for `messageIndex`. */
		index?: number;
		/** Role used to derive default action availability and alignment. */
		role?: AIThreadRole;
		/** Text copied by the default copy action. */
		content?: string;
		/** Action control scale. @default 'normal' */
		size?: Sizes;
		/** Conversation used by default edit and retry actions. Pass `null` to disable context lookup. */
		conversation?: AIConversationState<TMessage> | null;
		/** Controls whether the action group is always shown, hover-revealed, or omitted. */
		visibility?: AIMessageActionVisibility;
		/** Enables the copy action. */
		copyable?: boolean;
		/** Enables the edit action when the message role is `user`. */
		editable?: boolean;
		/** Enables the retry action when the message role is `assistant`. */
		retryable?: boolean;
		/** Svelai alias for `copyable`. */
		copy?: boolean;
		/** Svelai alias for `editable`. */
		edit?: boolean;
		/** Svelai alias for `retryable`. */
		retry?: boolean;
		/** Replaces the default actions with a stateful custom renderer, or disables all actions. */
		actions?: Slot<AIMessageActionState<TMessage>> | false;
		/** Svelai child-slot alias for `actions`. */
		children?: Slot<AIMessageActionState<TMessage>>;
		/** Called with complete action state after content is copied successfully. */
		onCopy?: AIMessageActionHandler<TMessage>;
		/** Called with complete action state when edit is selected. */
		onEdit?: AIMessageActionHandler<TMessage>;
		/** Called with complete action state when retry is selected. */
		onRetry?: AIMessageActionHandler<TMessage>;
		/** Class applied to the action group. */
		class?: string;
		/** Theme overrides for the action group and buttons. */
		theme?: AIMessageActionsThemeProps;
	}
>;
