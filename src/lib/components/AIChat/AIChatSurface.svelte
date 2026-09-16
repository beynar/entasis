<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Alert from '../Alert/Alert.svelte';
	import type { WithAttachments } from '$lib/types/props.js';
	import type { AIComposerQueuedMessage } from '../AIComposer/aiComposer.props.js';
	import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
	import type { AIThreadItem } from '../AIThread/aiThread.props.js';
	import Slot from '../Slot/Slot.svelte';
	import AIChatComposerSurface from './AIChatComposerSurface.svelte';
	import type { AIChatProps } from './aiChat.props.js';
	import { useAIChatTheme } from './aiChat.theme.js';
	import AIChatThreadSurface from './AIChatThreadSurface.svelte';

	type Props<TMessage extends AIThreadItem> = WithAttachments<
		Pick<
			AIChatProps<TMessage>,
			| 'ref'
			| 'queue'
			| 'models'
			| 'modelGroups'
			| 'maxTokens'
			| 'showContext'
			| 'showModelSelector'
			| 'showToc'
			| 'tocSide'
			| 'density'
			| 'messageSize'
			| 'messageVariant'
			| 'messageActions'
			| 'messageActionsVisibility'
			| 'messageCopyable'
			| 'messageEditable'
			| 'messageRetryable'
			| 'onMessageCopy'
			| 'onMessageEdit'
			| 'onMessageRetry'
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
			| 'onSelect'
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
			| 'header'
			| 'beforeThread'
			| 'controls'
			| 'context'
			| 'modelSelector'
			| 'children'
			| 'thread'
			| 'afterThread'
			| 'errorRegion'
			| 'empty'
			| 'message'
			| 'tool'
			| 'marker'
			| 'suggestionsRegion'
			| 'toc'
			| 'composer'
			| 'footer'
			| 'class'
			| 'theme'
		> & { conversation: AIConversationState<TMessage> }
	>;

	let {
		ref = $bindable(),
		queue = $bindable<AIComposerQueuedMessage[]>([]),
		conversation,
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
		...attachments
	}: Props<TMessage> = $props();

	let composerSurface = $state<{ focus: () => void }>();
	const classes = $derived(useAIChatTheme(theme));
	const t = $derived(useI18n());

	function displayError(value: unknown): string {
		if (value instanceof Error && value.message) return value.message;
		if (typeof value === 'string' && value) return value;
		return t.aiChatErrorDescription;
	}
</script>

{#if children}
	<Slot render={children} payload={conversation} />
{:else}
	<div bind:this={ref} data-slot="ai-chat" class={classes.root({ className })} {...attachments}>
		{#if header}
			<div data-slot="ai-chat-header" class={classes.header()}>
				<Slot render={header} payload={conversation} />
			</div>
		{/if}
		{#if conversation.error !== undefined}
			<div data-slot="ai-chat-error" class={classes.error()}>
				{#if errorRegion}
					<Slot render={errorRegion} payload={conversation} />
				{:else}
					<Alert
						color="danger"
						variant="soft"
						title={t.aiChatErrorTitle}
						description={displayError(conversation.error)}
					/>
				{/if}
			</div>
		{/if}
		{#if beforeThread}
			<div data-slot="ai-chat-before-thread" class={classes.beforeThread()}>
				<Slot render={beforeThread} payload={conversation} />
			</div>
		{/if}
		<AIChatThreadSurface
			{conversation}
			{thread}
			{empty}
			{message}
			{tool}
			{marker}
			{suggestionsRegion}
			{toc}
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
			{onSelect}
			onComposerFocus={() => composerSurface?.focus()}
			{theme}
		/>
		{#if afterThread}
			<div data-slot="ai-chat-after-thread" class={classes.afterThread()}>
				<Slot render={afterThread} payload={conversation} />
			</div>
		{/if}
		<AIChatComposerSurface
			bind:this={composerSurface}
			bind:queue
			{conversation}
			{controls}
			{context}
			{modelSelector}
			{composer}
			{models}
			{modelGroups}
			{maxTokens}
			{showContext}
			{showModelSelector}
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
			{theme}
		/>
		{#if footer}
			<div data-slot="ai-chat-footer" class={classes.footer()}>
				<Slot render={footer} payload={conversation} />
			</div>
		{/if}
	</div>
{/if}
