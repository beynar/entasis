<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { VirtualItem } from '@tanstack/svelte-virtual';
	import type { Attachment } from 'svelte/attachments';
	import Alert from '../Alert/Alert.svelte';
	import AIAskUserQuestionSummary from '../AIAskUserQuestion/AIAskUserQuestionSummary.svelte';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import AIMessageActions from '../AIMessageActions/AIMessageActions.svelte';
	import type { AIMessageActionVisibility } from '../AIMessageActions/aiMessageActions.props.js';
	import AIReasoning from '../AIReasoning/AIReasoning.svelte';
	import AISuggestion from '../AISuggestion/AISuggestion.svelte';
	import Button from '../Button/Button.svelte';
	import { arrowsClockwiseIcon } from '../Icons/arrowsClockwise.js';
	import Slot from '../Slot/Slot.svelte';
	import AITool from '../AITool/AITool.svelte';
	import AIThreadMarker from './AIThreadMarker.svelte';
	import type { AIThreadItem, AIThreadProps, AIThreadRole } from './aiThread.props.js';
	import { useAIThreadTheme } from './aiThread.theme.js';
	import type { AIThreadRenderItem, AIThreadUnitActions } from './threadRenderItems.js';

	type MessageRenderItem<TMessage extends AIThreadItem> = Extract<
		AIThreadRenderItem<TMessage>,
		{ kind: 'message' }
	>;

	type Props<TMessage extends AIThreadItem> = Pick<
		AIThreadProps<TMessage>,
		| 'suggestions'
		| 'onSelect'
		| 'density'
		| 'messageSize'
		| 'messageVariant'
		| 'messageColor'
		| 'empty'
		| 'message'
		| 'messageActions'
		| 'messageActionsVisibility'
		| 'messageCopyable'
		| 'messageEditable'
		| 'messageRetryable'
		| 'onMessageCopy'
		| 'onMessageEdit'
		| 'onMessageRetry'
		| 'tool'
		| 'toolIcon'
		| 'toolTitle'
		| 'toolContent'
		| 'toolInput'
		| 'toolOutput'
		| 'toolError'
		| 'toolStatus'
		| 'marker'
		| 'markerIcon'
		| 'markerContent'
		| 'liveText'
		| 'theme'
	> & {
		renderItems: readonly AIThreadRenderItem<TMessage>[];
		virtualItems: readonly VirtualItem[];
		totalSize: number;
		measureItem: Attachment<HTMLElement>;
		error?: unknown;
		errorRetry?: () => void | Promise<void>;
	};

	let {
		renderItems,
		virtualItems,
		totalSize,
		measureItem,
		suggestions = [],
		onSelect,
		density = 'normal',
		messageSize = 'normal',
		messageVariant = 'minimal',
		messageColor,
		empty,
		message: messageSlot,
		messageActions,
		messageActionsVisibility = 'latest',
		messageCopyable,
		messageEditable,
		messageRetryable,
		onMessageCopy,
		onMessageEdit,
		onMessageRetry,
		tool: toolSlot,
		toolIcon,
		toolTitle,
		toolContent,
		toolInput,
		toolOutput,
		toolError,
		toolStatus,
		marker: markerSlot,
		markerIcon,
		markerContent,
		liveText,
		error,
		errorRetry,
		theme
	}: Props<TMessage> = $props();

	const conversation = getAIConversation<TMessage>();
	const classes = $derived(useAIThreadTheme(theme));
	const t = $derived(useI18n());

	function messageRole(message: TMessage): AIThreadRole {
		return message.role ?? 'assistant';
	}

	// `latest` keeps the final assistant turn's bar visible and the rest on hover (always shown on
	// touch screens by AIMessageActions' hover recipe). Segments that do not end their unit have no
	// bar at all.
	function unitVisibility(
		actions: AIThreadUnitActions<TMessage> | false | undefined
	): AIMessageActionVisibility {
		if (actions === false) return 'none';
		if (messageActionsVisibility !== 'latest') return messageActionsVisibility;
		return actions?.latest ? 'always' : 'hover';
	}

	function previousMessage(index: number): MessageRenderItem<TMessage> | undefined {
		for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
			const item = renderItems[previousIndex];
			if (item?.kind === 'message') return item;
		}
		return undefined;
	}

	function messageName(item: MessageRenderItem<TMessage>, index: number): string | undefined {
		if (!item.message.name) return undefined;
		const previous = previousMessage(index);
		if (
			previous &&
			messageRole(previous.message) === messageRole(item.message) &&
			previous.message.name === item.message.name
		) {
			return undefined;
		}
		return item.message.name;
	}

	function displayError(value: unknown): string {
		if (value instanceof Error && value.message) return value.message;
		if (typeof value === 'string' && value) return value;
		return t.aiChatErrorDescription;
	}
</script>

{#snippet pendingLabel()}
	<span data-slot="ai-thread-pending-label" class={classes.pending()}>
		{liveText || t.aiReasoningThinking}
	</span>
{/snippet}

{#snippet errorDescription()}
	<span class={classes.errorBody()}>
		<span>{displayError(error)}</span>
		{#if errorRetry}
			<Button
				size="small"
				variant="outline"
				color="danger"
				prefix={arrowsClockwiseIcon}
				data-slot="ai-thread-error-retry"
				onclick={() => void errorRetry?.()}>{t.aiThreadRetry}</Button
			>
		{/if}
	</span>
{/snippet}

{#if renderItems.length === 0}
	{#if empty}
		<Slot render={empty} />
	{:else}
		<div data-slot="ai-thread-empty" class={classes.empty()}>
			<h2 data-slot="ai-thread-greeting" class={classes.greeting()}>{t.aiThreadGreeting}</h2>
			{#if suggestions.length > 0}
				<div
					data-slot="ai-thread-empty-suggestions"
					role="group"
					aria-label={t.promptSuggestions}
					class={classes.emptySuggestions()}
				>
					{#each suggestions as suggestion, index (`${suggestion}:${index}`)}
						<AISuggestion {suggestion} onSelect={(value) => onSelect?.(value)} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class={classes.list()} style:height={`${totalSize}px`}>
		{#each virtualItems as virtualItem (virtualItem.key)}
			{@const item = renderItems[virtualItem.index]}
			{#if item}
				<div
					data-slot="ai-thread-item"
					data-index={virtualItem.index}
					data-kind={item.kind}
					class={classes.item({ density })}
					style:transform={`translateY(${virtualItem.start}px)`}
					{@attach measureItem}
				>
					<div data-slot="ai-thread-item-content" class={classes.content()}>
						{#if item.kind === 'message'}
							{@const visibility = unitVisibility(item.actions)}
							{#if messageSlot}
								<Slot
									render={messageSlot}
									payload={{
										message: item.message,
										index: item.messageIndex,
										actionsVisibility: visibility
									}}
								/>
							{:else}
								<AIMessage
									message={item.message}
									index={item.messageIndex}
									size={messageSize}
									variant={messageVariant}
									color={messageColor}
									name={messageName(item, virtualItem.index)}
									content={item.content ?? item.message.content ?? ''}
									files={item.files ?? item.message.files}
									streaming={item.streaming}
									{conversation}
									actions={item.actions === false ? false : messageActions}
									actionVisibility={visibility}
									copyAction={messageCopyable}
									editAction={messageEditable}
									retryAction={messageRetryable}
									onCopy={onMessageCopy}
									onEdit={onMessageEdit}
									onRetry={onMessageRetry}
								/>
							{/if}
						{:else if item.kind === 'marker'}
							<AIThreadMarker {item} marker={markerSlot} {markerIcon} {markerContent} />
						{:else if item.kind === 'tool-group'}
							{#if toolSlot}
								<Slot
									render={toolSlot}
									payload={{
										tools: item.tools,
										message: item.message,
										index: item.messageIndex
									}}
								/>
							{:else}
								<AITool
									tools={item.tools}
									icon={toolIcon}
									title={toolTitle}
									content={toolContent}
									input={toolInput}
									output={toolOutput}
									error={toolError}
									status={toolStatus}
								/>
							{/if}
						{:else if item.kind === 'reasoning'}
							<AIReasoning content={item.content} streaming={item.streaming} />
						{:else if item.kind === 'question-summary'}
							<AIAskUserQuestionSummary
								questions={item.questions}
								value={item.value}
								title={item.title}
							/>
						{:else if item.kind === 'sources'}
							<div data-slot="ai-thread-sources" class={classes.sources()}>
								<span class={classes.sourcesLabel()}>{t.aiThreadSources}</span>
								{#each item.sources as source (source.id)}
									{#if source.url}
										<!-- eslint-disable svelte/no-navigation-without-resolve -- Sources are external URLs from the model; library links cannot depend on SvelteKit routing. -->
										<a
											data-slot="ai-thread-source"
											href={source.url}
											target="_blank"
											rel="noopener noreferrer"
											title={source.url}
											class={classes.source()}>{source.title}</a
										>
										<!-- eslint-enable svelte/no-navigation-without-resolve -->
									{:else}
										<span data-slot="ai-thread-source" class={classes.source()}>{source.title}</span
										>
									{/if}
								{/each}
							</div>
						{:else if item.kind === 'actions'}
							{@const visibility = unitVisibility(item.actions)}
							{#if messageActions !== false && visibility !== 'none'}
								<AIMessageActions
									message={item.actions.message}
									messageIndex={item.actions.messageIndex}
									role={item.actions.role}
									content={item.actions.content}
									size={messageSize}
									{conversation}
									actions={messageActions}
									{visibility}
									copyable={messageCopyable}
									editable={messageEditable}
									retryable={messageRetryable}
									onCopy={onMessageCopy}
									onEdit={onMessageEdit}
									onRetry={onMessageRetry}
									class={classes.actions()}
								/>
							{/if}
						{:else if item.kind === 'pending'}
							<AIMessage
								from="assistant"
								size={messageSize}
								variant={messageVariant}
								actions={false}
								aria-hidden="true"
								data-slot="ai-thread-pending"
								children={pendingLabel}
							/>
						{:else if item.kind === 'error'}
							<div data-slot="ai-thread-error" class={classes.error()}>
								<Alert
									color="danger"
									variant="soft"
									title={t.aiChatErrorTitle}
									description={errorDescription}
								/>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}
