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
		this.isSubmitting = true;
		this.error = undefined;
		try {
			if (await this.dispatch(meta, event)) options.clearDraft();
		} catch (error) {
			this.error = getErrorMessage(error, 'Unable to submit the message.');
		} finally {
			this.isSubmitting = false;
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
			this.error = getErrorMessage(error, 'Unable to stop the response.');
		} finally {
			this.isStopping = false;
		}
	};

	private get options(): AIComposerSubmitControllerOptions {
		return this.optionsSource();
	}

	private async dispatch(
		meta: AIComposerSubmitMeta,
		event: AIComposerSubmitEvent | undefined
	): Promise<boolean> {
		const options = this.options;
		const detail: AIComposerSubmitPayload = { ...meta, event, steered: false };
		if (options.onSubmit) {
			await options.onSubmit(detail);
			return false;
		}
		if (!options.conversation) {
			throw new Error('AIComposer requires onSubmit or a parent AIConversation.');
		}
		await options.conversation.submitMessage(createAIComposerConversationMessage(meta), {
			value: meta.markdown,
			event,
			meta
		});
		return true;
	}
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
