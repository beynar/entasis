import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
import type { AIThreadItem } from '../AIThread/aiThread.props.js';
import type {
	AIComposerProps,
	AIComposerSubmitPayload,
	AIComposerSubmitEvent,
	AIComposerSubmitMeta
} from './aiComposer.props.js';
import {
	AIComposerQueueController,
	createAIComposerConversationMessage
} from './aiComposerQueueController.svelte.js';

type AIComposerSubmitControllerOptions = {
	disabled: boolean;
	canSubmit: boolean;
	busy: boolean;
	queueWhileBusy: boolean;
	queue: AIComposerQueueController;
	conversation: AIConversationState<AIThreadItem> | null;
	buildMeta: () => AIComposerSubmitMeta;
	clearDraft: () => void;
	/** Whether keyboard focus is inside the composer right now. */
	hasFocus: () => boolean;
	/** Returns focus to the editor once a send settles. */
	restoreFocus: () => void;
	messages: { submitFailed: string; stopFailed: string };
	onSubmit: AIComposerProps['onSubmit'];
	onStop: AIComposerProps['onStop'];
};

export class AIComposerSubmitController {
	error = $state<string>();
	isSubmitting = $state(false);
	isStopping = $state(false);

	constructor(private optionsSource: () => AIComposerSubmitControllerOptions) {}

	get isWorking(): boolean {
		return this.isSubmitting || this.isStopping;
	}

	submit = async (event?: AIComposerSubmitEvent): Promise<void> => {
		event?.preventDefault();
		const options = this.options;
		if (options.disabled || this.isWorking || !options.canSubmit) return;
		const meta = options.buildMeta();
		if (options.queue.isEditing) {
			options.queue.commitEdit(meta);
			return;
		}
		if (options.busy) {
			if (options.queueWhileBusy) options.queue.enqueue(meta);
			return;
		}
		// The editor is read-only while a send is in flight, which blurs it; a send that started
		// from inside the composer hands focus back to the editor when it settles, success or not.
		const hadFocus = options.hasFocus();
		this.isSubmitting = true;
		this.error = undefined;
		try {
			await this.dispatch(meta, event);
			options.clearDraft();
		} catch (error) {
			this.error = getErrorMessage(error, options.messages.submitFailed);
		} finally {
			this.isSubmitting = false;
			if (hadFocus) options.restoreFocus();
		}
	};

	stop = async (): Promise<void> => {
		const options = this.options;
		if (options.disabled || this.isWorking) return;
		this.isStopping = true;
		this.error = undefined;
		try {
			if (options.onStop) await options.onStop();
			else if (options.conversation) await options.conversation.requestStop();
			else throw new Error('AIComposer requires onStop or a parent AIConversation to stop.');
		} catch (error) {
			this.error = getErrorMessage(error, options.messages.stopFailed);
		} finally {
			this.isStopping = false;
		}
	};

	private get options(): AIComposerSubmitControllerOptions {
		return this.optionsSource();
	}

	/** Hands the draft to `onSubmit` or the conversation; a rejection keeps the draft. */
	private async dispatch(
		meta: AIComposerSubmitMeta,
		event: AIComposerSubmitEvent | undefined
	): Promise<void> {
		const options = this.options;
		const detail: AIComposerSubmitPayload = { ...meta, event, steered: false };
		if (options.onSubmit) {
			await options.onSubmit(detail);
			return;
		}
		if (!options.conversation) {
			throw new Error('AIComposer requires onSubmit or a parent AIConversation.');
		}
		await options.conversation.submitMessage(createAIComposerConversationMessage(meta), {
			value: meta.markdown,
			event,
			meta
		});
	}
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
