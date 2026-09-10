import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
import type { AIThreadItem } from '../AIThread/aiThread.props.js';
import type {
	AIComposerAttachment,
	AIComposerQueuedMessage,
	AIComposerQueuedMessageEditPayload,
	AIComposerQueuedMessagePayload,
	AIComposerSubmitMeta
} from './aiComposer.props.js';

type AIComposerQueueEdit = {
	id: string;
	index: number;
	message: AIComposerQueuedMessage;
};

type AIComposerQueueControllerOptions = {
	disabled: boolean;
	isWorking: boolean;
	messages: AIComposerQueuedMessage[];
	conversation: AIConversationState<AIThreadItem> | null;
	setMessages: (messages: AIComposerQueuedMessage[]) => void;
	restoreDraft: (message: AIComposerQueuedMessage) => void;
	clearDraft: () => void;
	onQueueChange?: (messages: AIComposerQueuedMessage[]) => void;
	onAdd?: (payload: AIComposerQueuedMessagePayload) => void;
	onCancel?: (payload: AIComposerQueuedMessagePayload) => void;
	onEditStart?: (payload: AIComposerQueuedMessagePayload) => void;
	onEditCommit?: (payload: AIComposerQueuedMessageEditPayload) => void;
	onEditCancel?: (payload: AIComposerQueuedMessagePayload) => void;
	onReorder?: (messages: AIComposerQueuedMessage[]) => void;
	onSteer?: (payload: AIComposerQueuedMessagePayload) => void;
};

let queueId = 0;

export class AIComposerQueueController {
	private edit = $state<AIComposerQueueEdit>();

	constructor(private optionsSource: () => AIComposerQueueControllerOptions) {}

	get isEditing(): boolean {
		return this.edit !== undefined;
	}

	get editingMessage(): AIComposerQueuedMessage | undefined {
		return this.edit?.message;
	}

	enqueue(meta: AIComposerSubmitMeta): void {
		const options = this.options;
		const message = createQueuedMessage(meta);
		const index = options.messages.length;
		this.commitMessages([...options.messages, message]);
		options.onAdd?.({ message, index });
		options.clearDraft();
	}

	reorder(messages: AIComposerQueuedMessage[]): void {
		if (this.isDisabled) return;
		this.commitMessages(messages);
		this.options.onReorder?.(messages);
	}

	steer(messageId: string): void {
		if (this.isDisabled) return;
		const { message, index } = this.requireMessage(messageId, 'steer');
		const steered = message.steered ? message : { ...message, steered: true };
		if (!message.steered) {
			this.commitMessages(
				this.options.messages.map((candidate) => (candidate.id === messageId ? steered : candidate))
			);
		}
		this.options.onSteer?.({ message: steered, index });
	}

	cancel(messageId: string): void {
		if (this.isDisabled) return;
		const { message, index } = this.requireMessage(messageId, 'cancel');
		this.commitMessages(this.options.messages.filter((candidate) => candidate.id !== messageId));
		this.options.onCancel?.({ message, index });
	}

	startEdit(messageId: string): void {
		if (this.isDisabled) return;
		const { message, index } = this.requireMessage(messageId, 'edit');
		const snapshot = cloneQueuedMessage(message);
		this.edit = { id: messageId, index, message: snapshot };
		this.commitMessages(this.options.messages.filter((candidate) => candidate.id !== messageId));
		this.options.restoreDraft(snapshot);
		this.options.onEditStart?.({ message: snapshot, index });
	}

	commitEdit(meta: AIComposerSubmitMeta): void {
		const edit = this.edit;
		if (!edit) return;
		const message = createQueuedMessage(meta, edit.message);
		const index = this.insertOrReplace(message, edit.index);
		this.edit = undefined;
		this.options.clearDraft();
		this.options.onEditCommit?.({ message, index, previousMessage: edit.message });
	}

	cancelEdit(): void {
		const edit = this.edit;
		if (!edit || this.isDisabled) return;
		const index = this.insertOrReplace(edit.message, edit.index);
		this.edit = undefined;
		this.options.clearDraft();
		this.options.onEditCancel?.({ message: edit.message, index });
	}

	syncConversation(messages: AIComposerQueuedMessage[]): void {
		const conversation = this.options.conversation;
		if (!conversation) return;
		const source = messages[0];
		if (!source) {
			if (conversation.queuedMessage !== null) conversation.setQueuedMessage(null);
			return;
		}
		const message = createConversationMessage(source, `queued-${source.id}`);
		if (getMessageSignature(conversation.queuedMessage) === getMessageSignature(message)) return;
		conversation.setQueuedMessage(message);
	}

	private get options(): AIComposerQueueControllerOptions {
		return this.optionsSource();
	}

	private get isDisabled(): boolean {
		const options = this.options;
		return options.disabled || options.isWorking;
	}

	private commitMessages(messages: AIComposerQueuedMessage[]): void {
		const options = this.options;
		options.setMessages(messages);
		options.onQueueChange?.(messages);
	}

	private requireMessage(
		messageId: string,
		action: 'cancel' | 'edit' | 'steer'
	): { message: AIComposerQueuedMessage; index: number } {
		const index = this.options.messages.findIndex((message) => message.id === messageId);
		if (index < 0) {
			throw new Error(`Cannot ${action} missing AI composer queue item "${messageId}".`);
		}
		const message = this.options.messages[index];
		if (!message) throw new Error(`Cannot read AI composer queue item "${messageId}".`);
		return { message, index };
	}

	private insertOrReplace(message: AIComposerQueuedMessage, fallbackIndex: number): number {
		const messages = this.options.messages;
		const existingIndex = messages.findIndex((candidate) => candidate.id === message.id);
		if (existingIndex >= 0) {
			this.commitMessages(
				messages.map((candidate) => (candidate.id === message.id ? message : candidate))
			);
			return existingIndex;
		}
		const index = Math.max(0, Math.min(fallbackIndex, messages.length));
		this.commitMessages([...messages.slice(0, index), message, ...messages.slice(index)]);
		return index;
	}
}

export function createAIComposerConversationMessage(
	meta: AIComposerSubmitMeta,
	id: string = createQueueId()
): AIThreadItem {
	return createConversationMessage(meta, id);
}

function createQueuedMessage(
	meta: AIComposerSubmitMeta,
	previous?: AIComposerQueuedMessage
): AIComposerQueuedMessage {
	return {
		...meta,
		id: previous?.id ?? createQueueId(),
		createdAt: previous?.createdAt ?? Date.now(),
		files: [...meta.files],
		attachments: meta.attachments.map((attachment) => ({ ...attachment })),
		tokens: meta.tokens.map((token) => ({ ...token })),
		steered: previous?.steered
	};
}

function cloneQueuedMessage(message: AIComposerQueuedMessage): AIComposerQueuedMessage {
	return {
		...message,
		files: [...message.files],
		attachments: message.attachments.map((attachment) => ({ ...attachment })),
		tokens: message.tokens.map((token) => ({ ...token }))
	};
}

function createConversationMessage(meta: AIComposerSubmitMeta, id: string): AIThreadItem {
	return {
		id,
		type: 'message',
		role: 'user',
		content: meta.markdown,
		files: [...meta.files],
		attachments: meta.attachments.map((attachment) => ({ ...attachment }))
	};
}

function createQueueId(): string {
	queueId += 1;
	return `ai-composer-queue-${Date.now().toString(36)}-${queueId.toString(36)}`;
}

function getMessageSignature(message: AIThreadItem | null): string {
	if (!message) return 'null';
	return JSON.stringify({
		id: message.id === undefined ? undefined : String(message.id),
		type: message.type,
		role: message.role,
		content: message.content,
		files: (message.files ?? []).map(getFileSignature),
		attachments: (message.attachments ?? []).map(getAttachmentSignature)
	});
}

function getAttachmentSignature(attachment: AIComposerAttachment): unknown[] {
	return [
		attachment.id,
		getFileSignature(attachment.file),
		attachment.status,
		attachment.previewUrl,
		attachment.remoteId,
		attachment.remoteUrl,
		attachment.error
	];
}

function getFileSignature(file: {
	name: string;
	size?: number;
	type?: string;
	lastModified?: number;
}): unknown[] {
	return [file.name, file.size, file.type, file.lastModified];
}
