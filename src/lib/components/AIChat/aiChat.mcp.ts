export const aiChatDescription = `
# AIChat

Assembled AI conversation surface built from AIConversation, AIThread, AIComposer, AIContext, AIModelSelector, and AIAskUserQuestion. It owns no transport.

## Import

\`\`\`svelte
<script lang="ts">
  import { AIChat, AIChatSkeleton, type AIChatProps } from 'svelai/ai-chat';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<AIChat
  bind:api
  bind:messages
  bind:selectedModel
  {models}
  {contextUsage}
  {suggestions}
  onSubmit={({ message, meta, conversation }) => sendMessage(message, meta, conversation)}
  onStop={(payload) => stopGeneration(payload)}
/>
\`\`\`

AIChat exposes every AIConversation bindable and event: \`api\` (the conversation instance handle), \`status\`, \`error\`, \`messages\`, \`queuedMessage\`, \`currentInput\`, \`files\`, \`attachments\`, \`liveText\`, \`suggestions\`, \`contextUsage\`, \`selectedModel\`, \`streaming\`, \`activeAskUserQuestion\`, \`labels\`, and all conversation mutation/lifecycle callbacks. \`queue\` is the bindable ordered AIComposer queue.

## Regions

Product-level snippets receive the central \`AIConversationState\` instance directly:

- \`children\` replaces the complete default surface while retaining the provider.
- \`header\`, \`beforeThread\`, \`thread\`, \`afterThread\`, \`composer\`, and \`footer\` replace or insert complete surface regions.
- \`errorRegion\` replaces the default error alert.
- \`context\` and \`modelSelector\` replace their individual composer controls; \`controls\` replaces both together.
- \`empty\` replaces the transcript empty state; \`suggestionsRegion\` replaces suggestions inside that empty state.
- \`message\`, \`tool\`, and \`marker\` customize transcript renderers with their row payloads.
  Message payloads include the thread-resolved \`actionsVisibility\` value so custom AIMessage
  composition does not make intermediate actions permanently visible.
- \`toc\` receives the complete \`AIThreadTocState\`.

\`\`\`svelte
<AIChat {messages} {models}>
  {#snippet beforeThread(state)}
	<div>{state.status}</div>
  {/snippet}

  {#snippet context(state)}
	<span>{state.contextUsage?.totalTokens ?? 0} tokens</span>
  {/snippet}

  {#snippet afterThread(state)}
	<div>{state.messages.length} messages</div>
  {/snippet}
</AIChat>
\`\`\`

## Thread controls

Use \`density\` for transcript spacing, \`messageSize\` for the default message scale, and
\`messageVariant\` (\`bubble\` or \`minimal\`) for default message presentation. Use \`showToc\`,
\`tocSide\`, and \`toc\` for user-turn navigation. Custom message snippets own their message
presentation. Configure advanced virtualizer tuning on \`AIThread\` through direct composition.

Use \`messageActions\`, \`messageActionsVisibility\` (\`hover\`, \`always\`, or \`none\`), \`messageCopyable\`, \`messageEditable\`, \`messageRetryable\`, \`onMessageCopy\`, \`onMessageEdit\`, and \`onMessageRetry\` for default message actions. Explicit message-action callbacks take precedence over conversation fallbacks.
Intermediate assistant segments that continue through tools into another assistant segment omit the
action region; actions attach to the terminal assistant response for the turn.

## Context and model controls

\`models\` and \`modelGroups\` populate the default selector. \`maxTokens\` defaults to 128000. \`showContext\` and \`showModelSelector\` default to true; the model selector renders only when at least one model exists. Custom \`context\` and \`modelSelector\` snippets render regardless of those visibility flags. \`controls\` has precedence over both individual regions.

## Composer behavior

The default AIComposer remains connected to the central conversation state. AIChat exposes product-level source, file, and queue behavior:

- Queueing: \`disabled\`, \`queueWhileBusy\`, \`queue\`, \`onQueueChange\`, \`onQueuedMessageAdd\`, \`onQueuedMessageCancel\`, \`onQueuedMessageEditStart\`, \`onQueuedMessageEditCommit\`, \`onQueuedMessageEditCancel\`, \`onQueuedMessageReorder\`, and \`onSteer\`.
- Files: \`fileDropzone\`, \`fileMultiple\`, \`accept\`, \`maxFiles\`, \`maxFileSize\`, \`onFilesRejected\`, \`onFileReject\`, \`onAttachmentAdd\`, \`onAttachmentRetry\`, and \`onAttachmentRemove\`. AIChat defaults \`fileDropzone\` to true.
- Suggestions in the editor: \`commands\`, \`mentions\`, \`references\`, and \`skills\`.
Use \`AIConversation\` with \`AIThread\` and \`AIComposer\` directly for editor formatting, toolbar, shortcut, and other primitive-level tuning.

Conversation \`onSubmit\`, \`onStop\`, and \`onFilesChange\` remain central state events rather than bypassing or duplicating the Composer path.

## Questions and suggestions

An active \`activeAskUserQuestion\` replaces both a custom or default composer. The complete request is rendered with every question, initial values, title, requester, context, navigation labels, submit label, and discard label. Answers are retained by request key, and completion or dismissal resolves the captured request through \`AIConversationState.resolveAskUserQuestion\`.

Prompt \`suggestions\` render only inside an empty transcript. An explicit \`empty\` region has precedence. An explicit \`onSelect\` callback -- the pick event for a suggestion -- has precedence over the default behavior; without it, picking a suggestion updates \`currentInput\` and focuses the default composer.

## Skeleton

AIChatSkeleton accepts native div attributes plus \`messageCount\`, \`showHeader\`, \`showComposer\`, \`showFooter\`, \`class\`, and \`theme\`. \`messageCount\` defaults to 4 and is clamped from 1 to 8. Header and footer default off; composer defaults on. The root defaults to \`role="status"\`, \`aria-label="Connecting chat"\`, and \`aria-busy="true"\`, all overridable with native attributes.

\`\`\`svelte
<AIChatSkeleton
  messageCount={6}
  showHeader
  showFooter
  aria-label="Loading support conversation"
/>
\`\`\`

## Theme

Use \`theme\` or \`setAIChatTheme\` to override \`root\`, \`header\`, \`error\`, \`beforeThread\`, \`thread\`, \`afterThread\`, \`suggestions\`, \`composer\`, \`controls\`, \`footer\`, and \`skeletonMessages\` parts.
`;
