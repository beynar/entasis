export const aiThreadDescription = `
# AIThread

Virtualized AI transcript with stable message keys, initial end anchoring, pinned append following, prepend preservation, message actions, AI SDK tool parts, ask-user-question flows, prompt suggestions, MCP Apps, and the standalone AIThreadToc primitive.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { AIThread, type AIThreadItem } from 'svelai/ai-thread';

  let messages: AIThreadItem[] = $state([]);
  let announcement = $state('');
</script>

<AIThread
  {messages}
  getMessageKey={(message) => message.id}
  liveText={announcement}
  isStreaming={Boolean(announcement)}
  showToc
/>
\`\`\`

\`liveText\` is announced through a polite, atomic, screen-reader-only region. It is not appended to the visual transcript and does not suppress the empty state.

## Message input

\`AIThreadItem\` accepts message, context/marker, tool-shaped, file, and attachment fields. The \`parts\` array supports:

- \`{ type: 'text', text }\`
- \`{ type: 'marker', content, variant? }\`
- \`{ type: 'tool', tool: AIToolCall }\`
- AI SDK \`dynamic-tool\` and \`tool-*\` parts with \`toolCallId\`, \`state\`, \`input\`, \`output\`, \`structuredContent\`, \`result\`, \`error\`, and \`_meta\`

When text parts are present, top-level message content is not rendered again. Consecutive ordinary tools are grouped through \`AITool\`; calls with MCP App resource metadata render individually through \`AIMcpApp\`.

## Core props

- **messages**: readonly TMessage[] - Direct transcript. Falls back to the nearest AIConversation.
- **getMessageKey**: (message, index) => string | number | bigint | undefined - Stable virtualization key. Prefer persistent identifiers.
- **liveText**: string - Screen-reader announcement. Falls back to AIConversation.
- **isStreaming**: boolean - Sets the busy state. Falls back to AIConversation.
- **density**: 'small' | 'normal' | 'large' - Transcript row and edge spacing. Default 'normal'.
- **messageSize**: 'small' | 'normal' | 'large' - Size forwarded to default AIMessage rows. Default 'normal'.
- **messageVariant**: 'bubble' | 'minimal' - Presentation forwarded to default AIMessage rows. Default 'bubble'.
- **followOutput**: boolean - Follow appended rows only while pinned. Default true.
- **bottomThreshold**: number - End-pinned tolerance in pixels. Default 80.
- **estimateSize**: number - Estimated row height. Defaults to 80, 96, or 120 from density.
- **overscan**: number - Extra virtual rows. Default 4.
- **padding**: number - Shared start/end virtual padding. Defaults to 8, 16, or 24 from density.
- **paddingStart**, **paddingEnd**: number - Per-edge virtual padding overrides.
- **scrollBehavior**: 'auto' | 'smooth' | 'instant' - Append, TOC, and scroll-button behavior. Default 'smooth'.
- **showScrollButton**: boolean - Show the latest-message action away from the end. Default true.
- **scrollButtonPosition**: 'left' | 'center' | 'right' - Default 'right'.
- **ref**: HTMLDivElement - Bindable thread root, not the internal scroll viewport.
- **class**: string - Thread-root classes.
- **role**: HTML role - Thread-root role. Default 'log'.
- **viewportLabel**: string - Label for the focusable transcript viewport.
- **onscroll**: (event) => void - Raw native viewport-scroll callback.
- Native div attributes and Svelte attachments are forwarded to the thread root.

## Empty state and suggestions

- **empty**: Slot - Replaces the empty state.
- **suggestions**: readonly string[] - Default empty-state suggestions. Falls back to AIConversation.
- **onSuggestionSelect**: (suggestion) => void - Takes precedence over the provider's default \`setInput\` behavior.

## Message composition

- **message**: Slot<{ message, index, actionsVisibility }> - Replaces a complete message row. The
  resolved action visibility keeps custom renderers aligned with the thread's latest-message rule.
- **messageSize**, **messageVariant** - Configure only the default AIMessage renderer; a custom message slot owns its presentation.
- **messageActions**: AIMessageActionSnippet | false - Replaces or disables default actions.
- **messageActionsVisibility**: 'hover' | 'always' | 'none' (default: 'always')
- **messageCopyable**, **messageEditable**, **messageRetryable**: boolean
- **onMessageCopy**, **onMessageEdit**, **onMessageRetry**: AIMessage action handlers.

Assistant text that continues through tool or app rows into another assistant segment does not render
an action region. Actions belong to the terminal assistant segment for that user turn; completed
historical turns retain hover actions.

## Tool, marker, and MCP composition

- **tool**: Slot<{ tools, message, index }> - Replaces an ordinary grouped tool row.
- **toolIcon**, **toolTitle**, **toolContent**, **toolInput**, **toolOutput**, **toolError**, **toolStatus** - Forwarded to the current AITool API.
- **marker**: Slot<{ message, index }> - Replaces a complete context/marker row.
- **markerIcon**, **markerContent** - Compose the default AIMarker.
- **mcpHost**: AIMcpAppHostConfig - Host used by detected MCP App calls.
- **app**: Slot<{ tool, message, index }> - Replaces individual MCP App rendering.

## Ask-user-question

Pending ask-user-question tools are auto-detected. Inside AIConversation, AIThread publishes a detected request only when no provider request is active and clears only the exact detected request it previously published; explicit provider requests retain precedence. Standalone AIThread renders the active question below the virtual viewport.

- **activeAskUserQuestion**: request | null - Direct request takes precedence. Explicit null suppresses provider state and detection.
- **renderAskUserQuestion**: boolean - Show and filter the active question tool. Default true.
- **askUserQuestionDisabled**: boolean - Disable the question form.
- **onAskUserQuestionStateChange**: async callback - Takes precedence over AIConversation resolution.

## Minimap

- **showToc**: boolean - Show the user-turn minimap when at least two user turns overflow the viewport.
- **tocSide**: 'left' | 'right' - Default 'left'.
- **tocMaxPins**: number - Maximum compacted pins.
- **tocTheme**: AIThreadTocThemeProps - Theme overrides forwarded to the default standalone primitive.
- **toc**: Slot<AIThreadTocState> - Replaces the minimap and receives entries, range, active index, visible offsets, \`scrollToIndex\`, and \`scrollToOffset\`.

\`\`\`svelte
<script lang="ts">
  import { AIThread } from 'svelai/ai-thread';
  import { AIThreadToc } from 'svelai/ai-thread-toc';
</script>

<AIThread {messages} showToc>
  {#snippet toc(state)}
    <AIThreadToc {state} side="left" previewAlign="start" />
  {/snippet}
</AIThread>
\`\`\`

Import \`AIThreadToc\`, its controlled state types, and its dedicated theme from \`svelai/ai-thread-toc\`. AIThread composes that exact primitive for the default minimap.

## Exports

The \`svelai/ai-thread\` entry exports \`AIThread\`, thread/message/part/question types, scroll behavior and button-position types, marker/tool/action types, and the AIThread theme helpers. It keeps an \`AIThreadToc\` re-export for composition compatibility; the dedicated primitive entry is \`svelai/ai-thread-toc\`.
`;
