export const aiThreadDescription = `
# AIThread

Virtualized AI transcript with stable message keys, initial end anchoring, pinned append following, prepend preservation, message actions, AI SDK tool parts, ask-user-question flows, prompt suggestions, and the standalone AIThreadToc primitive.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { AIThread, type AIThreadItem } from 'entasis/ai-thread';

  let messages: AIThreadItem[] = $state([]);
  let announcement = $state('');
</script>

<AIThread
  {messages}
  getMessageKey={(message) => message.id}
  liveText={announcement}
  streaming={Boolean(announcement)}
  showToc
/>
\`\`\`

\`liveText\` is announced through a polite, atomic, screen-reader-only region and does not suppress the empty state. While \`streaming\` is true and the last item is a user turn, a pending assistant row shows \`liveText\` (or "Thinking…") with the \`shimmer\` utility; the live region announces the same text. The segment that ends a streaming reply shows a pulsing caret.

## Message input

\`AIThreadItem\` accepts message, context/marker, tool-shaped, file, and attachment fields. The \`parts\` array supports:

- \`{ type: 'text', text }\`
- \`{ type: 'marker', content, variant? }\`
- \`{ type: 'tool', tool: AIToolCall }\`
- AI SDK \`dynamic-tool\` and \`tool-*\` parts with \`toolCallId\`, \`state\`, \`input\`, \`output\`, \`structuredContent\`, \`result\`, \`error\`, \`approval\`, and \`_meta\`. States map through \`getAIToolStatusFromState\`: \`approval-requested\`, \`approval-responded\` and \`output-denied\` become AITool's awaiting, approved and denied statuses, so a call waiting on the user never spins.
- AI SDK \`{ type: 'reasoning', text, state? }\` - rendered with AIReasoning, streaming while \`state\` is \`'streaming'\` (or, without a state, while it is the last part of a streaming reply).
- AI SDK \`source-url\` / \`source-document\` parts - one "Sources" row of chips per message; only http(s) URLs become links.
- AI SDK \`file\` parts - shown as file previews with the message's text segment (or a segment of their own). Only https, blob and image data URLs are used as previews.
- \`step-start\` and \`data-*\` parts carry no visible content and are skipped.

When text parts are present, top-level message content is not rendered again. Consecutive ordinary tools are grouped through \`AITool\`. An ask-user-question tool that is answered (by the conversation, by the AI SDK output state, or locally through this thread) renders as a compact question → answer summary (\`AIAskUserQuestionSummary\`); a dismissed one settles as a cancelled call.

## Core props

- **messages**: readonly TMessage[] - Direct transcript. Falls back to the nearest AIConversation.
- **getMessageKey**: (message, index) => string | number | bigint | undefined - Stable virtualization key. Prefer persistent identifiers.
- **liveText**: string - Screen-reader announcement. Falls back to AIConversation.
- **streaming**: boolean - Sets the busy state. Falls back to AIConversation.
- **density**: 'compact' | 'normal' | 'comfortable' - Transcript row and edge spacing. Default 'normal'.
- **messageSize**: 'small' | 'normal' | 'large' - Size forwarded to default AIMessage rows. Default 'normal'.
- **messageVariant**: 'minimal' | 'bubble' - Presentation forwarded to default AIMessage rows. Default 'minimal' (flat full-width assistant prose).
- **messageColor**: Colors - User-bubble colour forwarded to default AIMessage rows. Neutral (the theme default) is a quiet grey bubble; any other role paints a solid bubble.
- **contentWidth**: string | number - Maximum width of the centred reading column (a CSS length, or pixels). Sets \`--ai-thread-content-width\`; without it rows follow an ancestor's \`--ai-chat-content-width\` (AIChat sets 48rem) and otherwise span the thread.
- **followOutput**: boolean - Follow appended rows only while pinned. Default true.
- **bottomThreshold**: number - End-pinned tolerance in pixels. Default 80.
- **estimateSize**: number - Estimated row height. Defaults to 80, 96, or 120 from density.
- **overscan**: number - Extra virtual rows. Default 4.
- **padding**: number - Shared start/end virtual padding. Defaults to 8, 16, or 24 from density.
- **paddingStart**, **paddingEnd**: number - Per-edge virtual padding overrides. Message actions sit inside their row, so the end padding reserves no extra room for them.
- **scrollBehavior**: 'auto' | 'smooth' | 'instant' - Append, TOC, and scroll-button behavior. Default 'smooth'.
- **showScrollButton**: boolean - Show the round scroll-to-latest button as soon as the view leaves the end (by wheel, trackpad, keys or scrollbar). Default true.
- **scrollButtonPosition**: 'left' | 'center' | 'right' - Default 'center', just above whatever sits below the thread.
- **ref**: HTMLDivElement - Bindable thread root, not the internal scroll viewport.
- **class**: string - Thread-root classes.
- **role**: HTML role - Thread-root role. Default 'log'.
- **viewportLabel**: string - Label for the focusable transcript viewport.
- **onscroll**: (event) => void - Raw native viewport-scroll callback.
- Native div attributes and Svelte attachments are forwarded to the thread root.

## Empty state, suggestions and errors

- **empty**: Slot - Replaces the empty state, a vertically centred greeting ("How can I help you today?") with wrapping suggestion chips.
- **suggestions**: readonly string[] - Empty-state chips, then follow-ups below the transcript after a finished assistant turn (not while streaming, during a question or under an error). Falls back to AIConversation.
- **showFollowUps**: boolean - Show the follow-ups. Default true.
- **onSelect**: (suggestion) => void - Pick event for a suggestion or follow-up; takes precedence over the provider's default \`setInput\` behavior.
- **error**: unknown - Shown as a danger row at the end of the transcript, where the reply failed. Falls back to AIConversation. An empty transcript shows the error instead of the greeting.
- **showError**: boolean - Show that row. Default true.
- **onErrorRetry**: () => void - The row's Retry button. Defaults to the conversation's \`retry\` targeting the last message; without either, there is no Retry button.

## Message composition

- **message**: Slot<{ message, index, actionsVisibility }> - Replaces a complete message row. The
  resolved action visibility keeps custom renderers aligned with the thread's latest-message rule.
- **messageSize**, **messageVariant** - Configure only the default AIMessage renderer; a custom message slot owns its presentation.
- **messageActions**: AIMessageActionSnippet | false - Replaces or disables default actions.
- **messageActionsVisibility**: 'latest' | 'hover' | 'always' | 'none' (default: 'latest'). \`latest\` keeps the final assistant turn's bar visible and reveals the rest on hover or focus; hover-revealed bars always show on touch screens. Hidden bars keep their height, so no row draws under them.
- **messageCopyable**, **messageEditable**, **messageRetryable**: boolean
- **onMessageCopy**, **onMessageEdit**, **onMessageRetry**: AIMessage action handlers.

A turn is one unit. A user message has its own bar; an assistant turn — reasoning, tools, and text
up to the next user message or marker — has a single bar at its end. When the turn ends with its
only text segment the bar sits under that text; otherwise it gets a row of its own whose copy takes
the whole turn's text and whose retry targets the turn's last assistant message. The bar of a
reply that is still streaming appears when it ends. The message slot's \`actionsVisibility\` is
\`none\` for segments that do not end their unit.

## Tool and marker composition

- **tool**: Slot<{ tools, message, index }> - Replaces an ordinary grouped tool row.
- **toolIcon**, **toolTitle**, **toolContent**, **toolInput**, **toolOutput**, **toolError**, **toolStatus** - Forwarded to the current AITool API.
- **marker**: Slot<{ message, index }> - Replaces a complete context/marker row.
- **markerIcon**, **markerContent** - Compose the default AIMarker.

## Ask-user-question

Pending ask-user-question tools are auto-detected. Inside AIConversation, AIThread publishes a detected request only when no provider request is active and clears only the exact detected request it previously published; explicit provider requests retain precedence. Standalone AIThread renders the active question below the virtual viewport.

- **activeAskUserQuestion**: request | null - Direct request takes precedence. Explicit null suppresses provider state and detection.
- **renderAskUserQuestion**: boolean - Show and filter the active question tool. Default true.
- **askUserQuestionDisabled**: boolean - Disable the question form.
- **onAskUserQuestionStateChange**: async callback - Takes precedence over AIConversation resolution.

## Minimap

- **showToc**: boolean - Show the user-turn minimap when at least two user turns overflow the viewport. Below a 480px-wide viewport the minimap and its gutter step aside.
- **tocSide**: 'left' | 'right' - Default 'left'.
- **tocMaxPins**: number - Maximum compacted pins.
- **tocTheme**: AIThreadTocThemeProps - Theme overrides forwarded to the default standalone primitive.
- **toc**: Slot<AIThreadTocState> - Replaces the minimap and receives entries, range, active index, visible offsets, \`scrollToIndex\`, and \`scrollToOffset\`.

\`\`\`svelte
<script lang="ts">
  import { AIThread } from 'entasis/ai-thread';
  import { AIThreadToc } from 'entasis/ai-thread-toc';
</script>

<AIThread {messages} showToc>
  {#snippet toc(state)}
    <AIThreadToc {state} side="left" previewAlign="start" />
  {/snippet}
</AIThread>
\`\`\`

Import \`AIThreadToc\`, its controlled state types, and its dedicated theme from \`entasis/ai-thread-toc\`. AIThread composes that exact primitive for the default minimap.

## Exports

The \`entasis/ai-thread\` entry exports \`AIThread\`, thread/message/part/question types, scroll behavior and button-position types, marker/tool/action types, and the AIThread theme helpers. It keeps an \`AIThreadToc\` re-export for composition compatibility; the dedicated primitive entry is \`entasis/ai-thread-toc\`.
`;
