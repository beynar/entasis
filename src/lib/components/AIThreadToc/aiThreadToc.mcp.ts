export const aiThreadTocDescription = `
# AIThreadToc

Standalone, controlled user-turn navigation for AI transcripts. It renders a compact rail, visible-range marker, magnifying pins, and one shared HoverCard preview from an AIThreadTocState.

Import it directly from **entasis/ai-thread-toc**. AIThread composes the same primitive for its default minimap and exposes measured state through its **toc** slot.

## Thread composition

~~~svelte
<script lang="ts">
  import { AIThread } from 'entasis/ai-thread';
  import { AIThreadToc, type AIThreadTocState } from 'entasis/ai-thread-toc';
</script>

{#snippet toc(state: AIThreadTocState)}
  <AIThreadToc {state} side="left" previewAlign="start" />
{/snippet}

<AIThread {messages} showToc {toc} />
~~~

The component is controlled: **state.entries** supplies measured user turns, **activeIndex** and visible offsets describe the transcript viewport, and **scrollToIndex** performs navigation. A manually constructed state is also valid.

## Props

- **state**: AIThreadTocState - Required controlled navigation state.
- **maxPins**: number - Maximum pins before spatial compaction. Default 96.
- **scrollAreaLabel**: string - Accessible label for the nested scrollable pin region.
- **side**: 'left' | 'right' - Rail alignment and pin transform origin. Default 'left'.
- **previewSide**: 'left' | 'right' - Preview side; defaults away from the rail.
- **previewAlign**: 'start' | 'center' | 'end' - Preview alignment. Default 'center'.
- **pin**: Slot<{ entry, active }> - Replaces each pin indicator.
- **preview**: Slot<AIThreadTocEntry> - Replaces the complete shared HoverCard preview.
- **title**, **excerpt**, **metadata**, **icon**: Slot<AIThreadTocEntry> - Compose the default preview.
- **ref**, **class**, **theme**, native nav attributes, and Svelte attachments.

The root is bounded to 80% of its containing height. Pins live in the shared ScrollArea; native and custom scrollbars are hidden, while wheel, touch, and keyboard scrolling remain available. Give a standalone TOC a parent with an explicit height.

## State and entries

AIThreadTocEntry includes the source user message, prompt title, latest assistant excerpt, measured offset and size, files, attachments, and file count. AIThreadTocState includes entries, total range, active entry, visible offsets, **scrollToIndex**, and **scrollToOffset**.

The default preview clamps the prompt to one line, clamps the assistant response to four lines, and renders attachments as quiet inline labels. Pin focus and activation are keyboard accessible.

## Theme

Theme parts are **root**, **scrollArea**, **scrollContent**, **track**, **pinArea**, **rail**, **viewport**, **pin**, **pinIndicator**, **previewAnchor**, **preview**, **previewHeader**, **previewIcon**, **previewTitle**, **previewExcerpt**, **previewMetadata**, and **previewFiles**.
`;
