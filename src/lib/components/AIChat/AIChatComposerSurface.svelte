<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import AIAskUserQuestion from '../AIAskUserQuestion/AIAskUserQuestion.svelte';
	import type {
		AIAskAnswers,
		AIAskUserQuestionSubmitPayload
	} from '../AIAskUserQuestion/aiAskUserQuestion.props.js';
	import AIComposer from '../AIComposer/AIComposer.svelte';
	import type {
		AIComposerHandle,
		AIComposerProps,
		AIComposerQueuedMessage
	} from '../AIComposer/aiComposer.props.js';
	import AIContext from '../AIContext/AIContext.svelte';
	import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
	import AIModelSelector from '../AIModelSelector/AIModelSelector.svelte';
	import type { AIThreadAskUserQuestion, AIThreadItem } from '../AIThread/aiThread.props.js';
	import Slot from '../Slot/Slot.svelte';
	import type { AIChatProps } from './aiChat.props.js';
	import { useAIChatTheme } from './aiChat.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Props<TMessage extends AIThreadItem> = Pick<
		AIChatProps<TMessage>,
		| 'queue'
		| 'controls'
		| 'context'
		| 'modelSelector'
		| 'composer'
		| 'models'
		| 'modelGroups'
		| 'maxTokens'
		| 'showContext'
		| 'showModelSelector'
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
		| 'theme'
	> & {
		conversation: AIConversationState<TMessage>;
		/** Composer submit shortcut; AIComposer's default (`'enter'`) when omitted. */
		submitShortcut?: AIComposerProps['submitShortcut'];
		/** Composer formatting toolbar; AIComposer's default (`'none'`) when omitted. */
		toolbar?: AIComposerProps['toolbar'];
	};

	let {
		conversation,
		queue = $bindable<AIComposerQueuedMessage[]>([]),
		controls,
		context,
		modelSelector,
		composer,
		models = [],
		modelGroups = [],
		maxTokens,
		showContext = true,
		showModelSelector = true,
		disabled = false,
		queueWhileBusy = true,
		fileDropzone = true,
		fileMultiple = true,
		accept = [],
		maxFiles = Number.POSITIVE_INFINITY,
		maxFileSize = Number.POSITIVE_INFINITY,
		commands,
		mentions,
		references,
		skills,
		onFilesRejected,
		onFileReject,
		onAttachmentAdd,
		onAttachmentRetry,
		onAttachmentRemove,
		onQueueChange,
		onQueuedMessageAdd,
		onQueuedMessageCancel,
		onQueuedMessageEditStart,
		onQueuedMessageEditCommit,
		onQueuedMessageEditCancel,
		onQueuedMessageReorder,
		onSteer,
		submitShortcut,
		toolbar,
		theme
	}: Props<TMessage> = $props();
	const t = $derived(useI18n());
	const DEFAULT_MAX_TOKENS = 128_000;

	let composerHandle = $state<AIComposerHandle>();
	let askUserQuestionValues = $state<Record<string, AIAskAnswers | undefined>>({});
	const hasModels = $derived(models.length > 0 || modelGroups.length > 0);
	// The default indicator only appears once there is something to measure: a context-window
	// limit from the app or usage reported by the conversation. An empty ring reads as a spinner.
	const hasContextData = $derived(
		maxTokens !== undefined || conversation.contextUsage !== undefined
	);
	const classes = $derived(useAIChatTheme(theme));

	export function focus(): void {
		composerHandle?.focus();
	}

	function askUserQuestionValue(request: AIThreadAskUserQuestion<TMessage>): AIAskAnswers {
		return askUserQuestionValues[request.key] ?? request.value ?? {};
	}

	function updateAskUserQuestionValue(
		request: AIThreadAskUserQuestion<TMessage>,
		values: AIAskAnswers
	): void {
		askUserQuestionValues = { ...askUserQuestionValues, [request.key]: values };
	}

	async function resolveAskUserQuestion(
		request: AIThreadAskUserQuestion<TMessage>,
		state: 'completed' | 'discarded',
		detail?: AIAskUserQuestionSubmitPayload
	): Promise<void> {
		await conversation.resolveAskUserQuestion(
			state,
			detail ? { answers: detail.answers, values: detail.values } : undefined,
			request
		);
	}
</script>

{#snippet defaultControls()}
	{#if controls}
		<Slot render={controls} payload={conversation} />
	{:else}
		<div class={classes.controls()}>
			{#if context}
				<Slot render={context} payload={conversation} />
			{:else if showContext && hasContextData}
				<AIContext maxTokens={maxTokens ?? DEFAULT_MAX_TOKENS} compact />
			{/if}
			{#if modelSelector}
				<Slot render={modelSelector} payload={conversation} />
			{:else if showModelSelector && hasModels}
				<AIModelSelector {models} groups={modelGroups} {disabled} />
			{/if}
		</div>
	{/if}
{/snippet}

<div
	data-slot={conversation.activeAskUserQuestion ? 'ai-chat-ask-user-question' : 'ai-chat-composer'}
	class={classes.composer()}
>
	{#if conversation.activeAskUserQuestion}
		{@const request = conversation.activeAskUserQuestion}
		<AIAskUserQuestion
			questions={request.questions}
			value={askUserQuestionValue(request)}
			{disabled}
			title={request.title ?? t.aiAskClarify}
			requester={request.requester}
			context={request.context}
			submitLabel={request.submitLabel}
			submittingLabel={request.submittingLabel}
			nextLabel={request.nextLabel}
			previousLabel={request.previousLabel}
			discardLabel={request.discardLabel}
			showOther={request.showOther}
			onValueChange={(value) => updateAskUserQuestionValue(request, value)}
			onSubmit={(detail) => resolveAskUserQuestion(request, 'completed', detail)}
			onDiscard={() => resolveAskUserQuestion(request, 'discarded')}
		/>
	{:else if composer}
		<Slot render={composer} payload={conversation} />
	{:else}
		<AIComposer
			bind:this={composerHandle}
			bind:queue
			{disabled}
			{queueWhileBusy}
			{fileDropzone}
			{fileMultiple}
			{accept}
			{maxFiles}
			{maxFileSize}
			{commands}
			{mentions}
			{references}
			{skills}
			{onFilesRejected}
			{onFileReject}
			{onAttachmentAdd}
			{onAttachmentRetry}
			{onAttachmentRemove}
			{onQueueChange}
			{onQueuedMessageAdd}
			{onQueuedMessageCancel}
			{onQueuedMessageEditStart}
			{onQueuedMessageEditCommit}
			{onQueuedMessageEditCancel}
			{onQueuedMessageReorder}
			{onSteer}
			{submitShortcut}
			{toolbar}
			modelSelector={defaultControls}
		/>
	{/if}
</div>
