<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import type { AIConversationState } from '../AIConversation/aiConversation.state.svelte.js';
	import AIThread from '../AIThread/AIThread.svelte';
	import type {
		AIThreadItem,
		AIThreadMessageRenderPayload,
		AIThreadRenderPayload
	} from '../AIThread/aiThread.props.js';
	import Slot from '../Slot/Slot.svelte';
	import type { AIChatProps, AIChatToolPayload } from './aiChat.props.js';
	import { useAIChatTheme } from './aiChat.theme.js';

	type Props<TMessage extends AIThreadItem> = Pick<
		AIChatProps<TMessage>,
		| 'thread'
		| 'empty'
		| 'message'
		| 'tool'
		| 'marker'
		| 'suggestionsRegion'
		| 'toc'
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
		| 'onSelect'
		| 'theme'
	> & {
		conversation: AIConversationState<TMessage>;
		onComposerFocus?: () => void;
	};

	let {
		conversation,
		thread,
		empty,
		message,
		tool,
		marker,
		suggestionsRegion,
		toc,
		showToc = false,
		tocSide = 'right',
		density = 'normal',
		messageSize = 'normal',
		messageVariant = 'bubble',
		messageActions,
		messageActionsVisibility,
		messageCopyable = true,
		messageEditable = true,
		messageRetryable = true,
		onMessageCopy,
		onMessageEdit,
		onMessageRetry,
		onSelect,
		onComposerFocus,
		theme
	}: Props<TMessage> = $props();

	const hasCustomEmpty = $derived(
		Boolean(empty || (suggestionsRegion && conversation.suggestions.length > 0))
	);
	const classes = $derived(useAIChatTheme(theme));

	function selectSuggestion(suggestion: string): void {
		if (onSelect) {
			onSelect(suggestion);
			return;
		}
		conversation.setInput(suggestion);
		onComposerFocus?.();
	}
</script>

{#snippet renderEmpty()}
	{#if empty}
		<Slot render={empty} payload={conversation} />
	{:else if suggestionsRegion && conversation.suggestions.length > 0}
		<div class={classes.suggestions()}>
			<Slot render={suggestionsRegion} payload={conversation} />
		</div>
	{/if}
{/snippet}

{#snippet renderMessage(payload: AIThreadMessageRenderPayload<TMessage>)}
	<Slot render={message} {payload} />
{/snippet}

{#snippet renderTool(payload: AIChatToolPayload<TMessage>)}
	<Slot render={tool} {payload} />
{/snippet}

{#snippet renderMarker(payload: AIThreadRenderPayload<TMessage>)}
	<Slot render={marker} {payload} />
{/snippet}

{#if thread}
	<div data-slot="ai-chat-thread" class={classes.thread()}>
		<Slot render={thread} payload={conversation} />
	</div>
{:else}
	<AIThread
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
		renderAskUserQuestion={false}
		suggestions={suggestionsRegion ? [] : conversation.suggestions}
		onSelect={selectSuggestion}
		empty={hasCustomEmpty ? renderEmpty : undefined}
		message={message ? renderMessage : undefined}
		tool={tool ? renderTool : undefined}
		marker={marker ? renderMarker : undefined}
		{toc}
		class={classes.thread()}
	/>
{/if}
