<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import type {
		AIComposerAttachment,
		AIComposerQueuedMessage
	} from '../AIComposer/aiComposer.props.js';
	import AIConversation from '../AIConversation/AIConversation.svelte';
	import type {
		AIConversationState,
		AIConversationStatus
	} from '../AIConversation/aiConversation.state.svelte.js';
	import type { AIThreadAskUserQuestion, AIThreadItem } from '../AIThread/aiThread.props.js';
	import type { AIChatProps } from './aiChat.props.js';
	import AIChatSurface from './AIChatSurface.svelte';

	let {
		ref = $bindable(),
		api = $bindable<AIConversationState<TMessage>>(),
		status = $bindable<AIConversationStatus>('idle'),
		error = $bindable<unknown>(),
		messages = $bindable<TMessage[]>([]),
		queuedMessage = $bindable<TMessage | null>(null),
		currentInput = $bindable(''),
		files = $bindable<File[]>([]),
		attachments = $bindable<AIComposerAttachment[]>([]),
		queue = $bindable<AIComposerQueuedMessage[]>([]),
		liveText = $bindable<string>(),
		suggestions = $bindable<string[]>([]),
		contextUsage = $bindable(),
		selectedModel = $bindable<string>(),
		streaming = $bindable(false),
		activeAskUserQuestion = $bindable<AIThreadAskUserQuestion<TMessage> | null>(null),
		labels,
		models,
		modelGroups,
		maxTokens,
		showContext,
		showModelSelector,
		showToc,
		tocSide,
		density,
		messageSize,
		messageVariant,
		messageActions,
		messageActionsVisibility,
		messageCopyable,
		messageEditable,
		messageRetryable,
		onMessageCopy,
		onMessageEdit,
		onMessageRetry,
		disabled,
		queueWhileBusy,
		fileDropzone,
		fileMultiple,
		accept,
		maxFiles,
		maxFileSize,
		commands,
		mentions,
		references,
		skills,
		onSelect,
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
		header,
		beforeThread,
		controls,
		context,
		modelSelector,
		children,
		thread,
		afterThread,
		errorRegion,
		empty,
		message,
		tool,
		marker,
		suggestionsRegion,
		toc,
		composer,
		footer,
		class: className,
		theme,
		...attachmentProps
	}: AIChatProps<TMessage> = $props();
</script>

<AIConversation
	bind:api
	bind:status
	bind:error
	bind:messages
	bind:queuedMessage
	bind:currentInput
	bind:files
	bind:attachments
	bind:liveText
	bind:suggestions
	bind:contextUsage
	bind:selectedModel
	bind:streaming
	bind:activeAskUserQuestion
	{labels}
	{onStatusChange}
	{onSubmit}
	{onStop}
	{onRetry}
	{onError}
	{onMessageAppend}
	{onMessagePrepend}
	{onMessageUpdate}
	{onMessageRemove}
	{onToolUpdate}
	{onInputChange}
	{onFilesChange}
	{onAttachmentsChange}
	{onLiveTextChange}
	{onSuggestionsChange}
	{onSelectedModelChange}
	{onQueuedMessageChange}
	{onQueuedMessageCommit}
	{onQueuedMessageDiscard}
	{onContextUsageChange}
	{onStreamingChange}
	{onActiveAskUserQuestionChange}
	{onAskUserQuestionStateChange}
>
	{#if api}
		<AIChatSurface
			bind:ref
			bind:queue
			conversation={api}
			{models}
			{modelGroups}
			{maxTokens}
			{showContext}
			{showModelSelector}
			{showToc}
			{tocSide}
			{density}
			{messageSize}
			{messageVariant}
			{messageActions}
			{messageActionsVisibility}
			{messageCopyable}
			{messageEditable}
			{messageRetryable}
			{onMessageCopy}
			{onMessageEdit}
			{onMessageRetry}
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
			{onSelect}
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
			{header}
			{beforeThread}
			{controls}
			{context}
			{modelSelector}
			{children}
			{thread}
			{afterThread}
			{errorRegion}
			{empty}
			{message}
			{tool}
			{marker}
			{suggestionsRegion}
			{toc}
			{composer}
			{footer}
			class={className}
			{theme}
			{...attachmentProps}
		/>
	{/if}
</AIConversation>
