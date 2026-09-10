export const aiConversationDescription = `
# AIConversation

Scoped, transport-agnostic conversation state for AI surfaces. Descendant AIThread, AIComposer, AIContext, and AIModelSelector components reuse the nearest state automatically.

## Import

\`\`\`svelte
<script lang="ts">
  import {
    AIConversation,
    type AIConversationState,
    type AIConversationStatus
  } from 'svelai/ai-conversation';
</script>
\`\`\`

## Provider state

All state props are bindable: \`conversation\`, \`status\`, \`error\`, \`messages\`, \`queuedMessage\`, \`currentInput\`, \`files\`, \`attachments\`, \`liveText\`, \`suggestions\`, \`contextUsage\`, \`selectedModel\`, \`isStreaming\`, and \`activeAskUserQuestion\`.

\`status\` is one of \`idle\`, \`queued\`, \`asking-user\`, \`streaming\`, \`stopping\`, or \`error\`. Use \`labels\` to override composer and model-selector text. AIConversation does not send network requests.

\`\`\`svelte
<AIConversation
  bind:conversation
  bind:messages
  bind:status
  onSubmit={({ message, meta, conversation }) => sendMessage(message, meta, conversation)}
  onStop={(conversation) => stopGeneration(conversation)}
>
  <AIThread />
  <AIComposer />
</AIConversation>
\`\`\`

## State methods

- Messages: \`appendMessage(message)\`, \`prependMessage(message)\`, \`updateMessage(target, update)\`, and \`removeMessage(target)\`.
- Tools: \`updateTool(messageTarget, toolTarget, update)\`.
- Shared values: \`setInput(value)\`, \`setFiles(files)\`, \`setAttachments(attachments)\`, \`setSelectedModel(model)\`, \`setLiveText(value)\`, \`setSuggestions(suggestions)\`, and \`updateContextUsage(update)\`.
- Queue: \`setQueuedMessage(message)\`, \`queueMessage(message)\`, \`submitMessage(message, detail?)\`, \`commitQueuedMessage()\`, and \`discardQueuedMessage()\`.
- Lifecycle: \`startStreaming()\`, \`stopStreaming()\`, \`requestStop()\`, \`retry(target?)\`, \`setError(error)\`, and \`clearError()\`.
- Questions: \`setActiveAskUserQuestion(request)\` and \`resolveAskUserQuestion(state, detail?, request?)\`.

Message targets use exactly one of \`{ id }\`, \`{ index }\`, or \`{ where }\`. Missing, out-of-range, or ambiguous message and tool targets throw. Queue commits and discards also throw when no message is queued.

\`submitMessage\`, \`requestStop\`, and \`retry\` invoke their callbacks and return synchronously. \`resolveAskUserQuestion\` returns a promise because it awaits \`onAskUserQuestionStateChange\`.

## Events

Lifecycle events: \`onStatusChange\`, \`onSubmit\`, \`onStop\`, \`onRetry\`, and \`onError\`.

Mutation events: \`onMessageAppend\`, \`onMessagePrepend\`, \`onMessageUpdate\`, \`onMessageRemove\`, \`onToolUpdate\`, \`onInputChange\`, \`onFilesChange\`, \`onAttachmentsChange\`, \`onLiveTextChange\`, \`onSuggestionsChange\`, \`onSelectedModelChange\`, \`onQueuedMessageChange\`, \`onQueuedMessageCommit\`, \`onQueuedMessageDiscard\`, \`onContextUsageChange\`, \`onStreamingChange\`, \`onActiveAskUserQuestionChange\`, and \`onAskUserQuestionStateChange\`.

Every multi-value event receives one documented payload object containing the central \`conversation\`; state-change payloads also contain \`value\` and \`previousValue\`, while mutation payloads name the affected records.

## Context access

Use \`getAIConversation()\` for an optional state or \`useAIConversation()\` when a provider is required. The latter throws outside AIConversation.
`;
