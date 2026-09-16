<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { untrack } from 'svelte';
	import type { AIContextUsage } from '../AIContext/aiContext.props.js';
	import type { AIComposerAttachment } from '../AIComposer/aiComposer.props.js';
	import type { AIThreadAskUserQuestion, AIThreadItem } from '../AIThread/aiThread.props.js';
	import type { AIConversationProps } from './aiConversation.props.js';
	import {
		AIConversationState,
		resolveAIConversationLabels,
		type AIConversationStatus
	} from './aiConversation.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		// eslint-disable-next-line no-useless-assignment -- The parent observes this bindable output.
		api = $bindable<AIConversationState<TMessage>>(),
		status = $bindable<AIConversationStatus>('idle'),
		error = $bindable<unknown>(),
		messages = $bindable<TMessage[]>([]),
		queuedMessage = $bindable<TMessage | null>(null),
		currentInput = $bindable(''),
		files = $bindable<File[]>([]),
		attachments = $bindable<AIComposerAttachment[]>([]),
		liveText = $bindable<string>(),
		suggestions = $bindable<string[]>([]),
		contextUsage = $bindable<AIContextUsage>(),
		selectedModel = $bindable<string>(),
		streaming = $bindable(false),
		activeAskUserQuestion = $bindable<AIThreadAskUserQuestion<TMessage> | null>(null),
		labels,
		onStatusChange,
		onSubmit,
		onStop,
		onRetry,
		onError,
		onMessageAppend,
		onMessagePrepend,
		onMessageUpdate,
		onMessageRemove,
		onToolUpdate,
		onInputChange,
		onFilesChange,
		onAttachmentsChange,
		onLiveTextChange,
		onSuggestionsChange,
		onSelectedModelChange,
		onQueuedMessageChange,
		onQueuedMessageCommit,
		onQueuedMessageDiscard,
		onContextUsageChange,
		onStreamingChange,
		onActiveAskUserQuestionChange,
		onAskUserQuestionStateChange,
		children
	}: AIConversationProps<TMessage> = $props();
	const t = $derived(useI18n());

	const state = untrack(
		() =>
			new AIConversationState<TMessage>({
				get status() {
					return status;
				},
				set status(value) {
					status = value;
				},
				get error() {
					return error;
				},
				set error(value) {
					error = value;
				},
				get messages() {
					return messages;
				},
				set messages(value) {
					messages = value;
				},
				get queuedMessage() {
					return queuedMessage;
				},
				set queuedMessage(value) {
					queuedMessage = value;
				},
				get currentInput() {
					return currentInput;
				},
				set currentInput(value) {
					currentInput = value;
				},
				get files() {
					return files;
				},
				set files(value) {
					files = value;
				},
				get attachments() {
					return attachments;
				},
				set attachments(value) {
					attachments = value;
				},
				get liveText() {
					return liveText;
				},
				set liveText(value) {
					liveText = value;
				},
				get suggestions() {
					return suggestions;
				},
				set suggestions(value) {
					suggestions = value;
				},
				get contextUsage() {
					return contextUsage;
				},
				set contextUsage(value) {
					contextUsage = value;
				},
				get selectedModel() {
					return selectedModel;
				},
				set selectedModel(value) {
					selectedModel = value;
				},
				get streaming() {
					return streaming;
				},
				set streaming(value) {
					streaming = value;
				},
				get activeAskUserQuestion() {
					return activeAskUserQuestion;
				},
				set activeAskUserQuestion(value) {
					activeAskUserQuestion = value;
				},
				get labels() {
					return resolveAIConversationLabels(labels, t);
				},
				get onStatusChange() {
					return onStatusChange;
				},
				get onSubmit() {
					return onSubmit;
				},
				get onStop() {
					return onStop;
				},
				get onRetry() {
					return onRetry;
				},
				get onError() {
					return onError;
				},
				get onMessageAppend() {
					return onMessageAppend;
				},
				get onMessagePrepend() {
					return onMessagePrepend;
				},
				get onMessageUpdate() {
					return onMessageUpdate;
				},
				get onMessageRemove() {
					return onMessageRemove;
				},
				get onToolUpdate() {
					return onToolUpdate;
				},
				get onInputChange() {
					return onInputChange;
				},
				get onFilesChange() {
					return onFilesChange;
				},
				get onAttachmentsChange() {
					return onAttachmentsChange;
				},
				get onLiveTextChange() {
					return onLiveTextChange;
				},
				get onSuggestionsChange() {
					return onSuggestionsChange;
				},
				get onSelectedModelChange() {
					return onSelectedModelChange;
				},
				get onQueuedMessageChange() {
					return onQueuedMessageChange;
				},
				get onQueuedMessageCommit() {
					return onQueuedMessageCommit;
				},
				get onQueuedMessageDiscard() {
					return onQueuedMessageDiscard;
				},
				get onContextUsageChange() {
					return onContextUsageChange;
				},
				get onStreamingChange() {
					return onStreamingChange;
				},
				get onActiveAskUserQuestionChange() {
					return onActiveAskUserQuestionChange;
				},
				get onAskUserQuestionStateChange() {
					return onAskUserQuestionStateChange;
				}
			})
	);
	// eslint-disable-next-line no-useless-assignment -- Assignment publishes the provider state to bind:api.
	api = state;
</script>

{@render children?.()}
