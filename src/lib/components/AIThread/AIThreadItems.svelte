<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { VirtualItem } from '@tanstack/svelte-virtual';
	import type { Attachment } from 'svelte/attachments';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import Empty from '../Empty/Empty.svelte';
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import AISuggestions from '../AISuggestion/AISuggestions.svelte';
	import Slot from '../Slot/Slot.svelte';
	import AITool from '../AITool/AITool.svelte';
	import AIThreadMarker from './AIThreadMarker.svelte';
	import type { AIThreadItem, AIThreadProps, AIThreadRole } from './aiThread.props.js';
	import { useAIThreadTheme } from './aiThread.theme.js';
	import type { AIThreadRenderItem } from './threadRenderItems.js';

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
		| 'theme'
	> & {
		renderItems: readonly AIThreadRenderItem<TMessage>[];
		virtualItems: readonly VirtualItem[];
		totalSize: number;
		measureItem: Attachment<HTMLElement>;
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
		messageVariant = 'bubble',
		empty,
		message: messageSlot,
		messageActions,
		messageActionsVisibility,
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
		theme
	}: Props<TMessage> = $props();

	const conversation = getAIConversation<TMessage>();
	const classes = $derived(useAIThreadTheme(theme));
	const t = $derived(useI18n());
	const resolvedMessageActionsVisibility = $derived(messageActionsVisibility ?? 'always');

	function messageRole(message: TMessage): AIThreadRole {
		return message.role ?? 'assistant';
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
</script>

{#snippet suggestionContent()}
	<AISuggestions {suggestions} {onSelect} class="mx-auto max-w-full" />
{/snippet}

{#if renderItems.length === 0}
	{#if empty}
		<Slot render={empty} />
	{:else}
		<Empty
			class="min-h-48"
			title={t.aiThreadEmptyTitle}
			description={t.aiThreadEmptyDescription}
			content={suggestions.length > 0 ? suggestionContent : undefined}
		/>
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
					{#if item.kind === 'message'}
						{#if messageSlot}
							<Slot
								render={messageSlot}
								payload={{
									message: item.message,
									index: item.messageIndex,
									actionsVisibility: resolvedMessageActionsVisibility
								}}
							/>
						{:else}
							<AIMessage
								message={item.message}
								index={item.messageIndex}
								size={messageSize}
								variant={messageVariant}
								name={messageName(item, virtualItem.index)}
								content={item.content ?? item.message.content ?? ''}
								{conversation}
								actions={messageActions}
								actionVisibility={resolvedMessageActionsVisibility}
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
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}
