export const aiChatDescription = `
# AIChat

Assembled AI conversation surface built from AIConversation, AIThread, AIComposer, AIContext, AIModelSelector, and AIAskUserQuestion. It owns no transport.

## Requires

AIChat renders AIComposer, which is built on Lexical. Those packages are optional peer dependencies of entasis, so install them alongside it:

\`pnpm add lexical @lexical/history @lexical/link @lexical/list @lexical/markdown @lexical/rich-text @lexical/selection @lexical/utils\`

## Import

\`\`\`svelte
<script lang="ts">
  import { AIChat, AIChatSkeleton, type AIChatProps } from 'entasis/ai-chat';
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
- \`errorRegion\` replaces the default error. Without it, a conversation \`error\` shows as a row at the end of the transcript, where the reply failed, with a Retry button that calls the conversation's \`retry\` on the last message (so \`onRetry\` receives \`{ target: { index } }\`) and clears the error. An empty transcript shows the error instead of the greeting. A replacement \`errorRegion\`, or a replaced \`thread\`, renders above the transcript.
- \`context\` and \`modelSelector\` replace their individual composer controls; \`controls\` replaces both together.
- \`empty\` replaces the transcript empty state (a vertically centred greeting with wrapping suggestion chips); \`suggestionsRegion\` replaces suggestions inside that empty state and turns off the follow-ups.
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

## Layout and thread controls

The transcript rows and the composer share one centred reading column. \`contentWidth\` (default
\`'48rem'\`; a number is pixels, \`'none'\` spans the chat) sets the CSS variable
\`--ai-chat-content-width\` on the root, which AIThread rows and AIComposer both read.

Use \`density\` for transcript spacing, \`messageSize\` for the default message scale (normal reads
at 16px), \`messageVariant\` (\`minimal\`, the default: flat full-width assistant prose; or
\`bubble\`: framed assistant replies) and \`messageColor\` (the user bubble: \`neutral\` grey by
default, any other role paints a solid bubble — \`primary\` gives the previous saturated look). Use
\`showToc\`, \`tocSide\`, and \`toc\` for user-turn navigation; the table of contents steps aside
in a thread narrower than 480px. Custom message snippets own their message presentation. Configure
advanced virtualizer tuning on \`AIThread\` through direct composition.

While a reply streams and the last item is a user turn, the transcript shows a pending assistant
row ("Thinking…" or \`liveText\`, with the \`shimmer\` utility); the streaming reply shows a caret.
AI SDK \`reasoning\`, tool (including approval states), \`source-url\`/\`source-document\` and
\`file\` parts render in the transcript, and an answered ask-user-question leaves a compact
question → answer summary.

Use \`messageActions\`, \`messageActionsVisibility\` (\`latest\`, the default, \`hover\`, \`always\`, or \`none\`), \`messageCopyable\`, \`messageEditable\`, \`messageRetryable\`, \`onMessageCopy\`, \`onMessageEdit\`, and \`onMessageRetry\` for default message actions. Explicit message-action callbacks take precedence over conversation fallbacks.
A turn is one unit: reasoning, tools and text up to the next user message share a single action bar
at the end of the turn, whose copy takes the whole turn's text. \`latest\` keeps the final assistant
turn's bar visible and reveals the others on hover or focus; touch screens always show them. The
bar of a reply that is still streaming appears when it ends.

## Context and model controls

\`models\` and \`modelGroups\` populate the default selector. \`maxTokens\` defaults to 128000. \`showContext\` and \`showModelSelector\` default to true; the model selector renders only when at least one model exists. Custom \`context\` and \`modelSelector\` snippets render regardless of those visibility flags. \`controls\` has precedence over both individual regions.

## Composer behavior

The default AIComposer remains connected to the central conversation state. AIChat exposes product-level source, file, and queue behavior:

- Queueing: \`disabled\`, \`queueWhileBusy\`, \`queue\`, \`onQueueChange\`, \`onQueuedMessageAdd\`, \`onQueuedMessageCancel\`, \`onQueuedMessageEditStart\`, \`onQueuedMessageEditCommit\`, \`onQueuedMessageEditCancel\`, \`onQueuedMessageReorder\`, and \`onSteer\`.
- Files: \`fileDropzone\`, \`fileMultiple\`, \`accept\`, \`maxFiles\`, \`maxFileSize\`, \`onFilesRejected\`, \`onFileReject\`, \`onAttachmentAdd\`, \`onAttachmentRetry\`, and \`onAttachmentRemove\`. AIChat defaults \`fileDropzone\` to true.
- Suggestions in the editor: \`commands\`, \`mentions\`, \`references\`, and \`skills\`.
- Editor: \`submitShortcut\` (AIComposer's default \`'enter'\`: Enter sends, Shift+Enter adds a line) and \`toolbar\` (AIComposer's default \`'none'\`).
Use \`AIConversation\` with \`AIThread\` and \`AIComposer\` directly for other primitive-level tuning.

Conversation \`onSubmit\`, \`onStop\`, and \`onFilesChange\` remain central state events rather than bypassing or duplicating the Composer path.

## Questions and suggestions

An active \`activeAskUserQuestion\` replaces both a custom or default composer. The complete request is rendered with every question, initial values, title, requester, context, navigation labels, submit label, and discard label. Answers are retained by request key, and completion or dismissal resolves the captured request through \`AIConversationState.resolveAskUserQuestion\`.

Prompt \`suggestions\` render as chips under the empty-state greeting, then as follow-ups above the composer once an assistant turn has finished (not while streaming, during a question, or under an error); \`showFollowUps={false}\` keeps them to the empty state. An explicit \`empty\` region has precedence. An explicit \`onSelect\` callback -- the pick event for a suggestion -- has precedence over the default behavior; without it, picking a suggestion updates \`currentInput\` and focuses the default composer.

## Skeleton

AIChatSkeleton mirrors the default chat — user turns as end-aligned bubbles, assistant turns as flat lines, the composer as a bordered card, all in the centred column — so nothing jumps when the chat replaces it. It accepts native div attributes plus \`messageCount\`, \`showHeader\`, \`showComposer\`, \`showFooter\`, \`contentWidth\` (default \`'48rem'\`, match the chat's), \`class\`, and \`theme\`. \`messageCount\` defaults to 4 and is clamped from 1 to 8. Header and footer default off; composer defaults on. The root defaults to \`role="status"\`, \`aria-label="Connecting chat"\`, and \`aria-busy="true"\`, all overridable with native attributes.

\`\`\`svelte
<AIChatSkeleton
  messageCount={6}
  showHeader
  showFooter
  aria-label="Loading support conversation"
/>
\`\`\`

## Theme

Use \`theme\` or \`setAIChatTheme\` to override \`root\`, \`header\`, \`error\`, \`beforeThread\`, \`thread\`, \`afterThread\`, \`suggestions\`, \`composer\`, \`controls\`, \`footer\`, \`skeletonMessages\`, \`skeletonUser\`, \`skeletonAssistant\`, and \`skeletonComposer\` parts.
`;
