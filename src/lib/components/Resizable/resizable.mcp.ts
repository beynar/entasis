export const resizableDescription = `
# Resizable

Resizable creates adjustable split-pane layouts from a typed panel configuration. It follows the
Svelai configuration-over-markup pattern while matching the important behavior from shadcn/ui's
Resizable: accessible separators, keyboard resizing, horizontal and vertical groups, visible handle
grips, and RTL-aware horizontal resizing.

## Import

\`\`\`svelte
<script lang="ts">
	import { Resizable } from 'svelai/resizable';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<Resizable
	class="h-72 rounded-lg border border-neutral-muted"
	panels={[
		{ id: 'sidebar', defaultSize: 30, content: leftPanel },
		{ id: 'content', defaultSize: 70, content: rightPanel }
	]}
	withHandle
	/>

{#snippet leftPanel()}
	<aside>Sidebar</aside>
{/snippet}

{#snippet rightPanel()}
	<main>Content</main>
{/snippet}
\`\`\`

## Props

- \`id\`: Root id. Generated fallback panel ids are prefixed with it.
- \`panels\`: Ordered panel definitions. A resize handle is inserted between each pair.
- \`sizes\`: Bindable panel sizes in percentages.
- \`collapsedPanels\`: Bindable list of collapsed panel ids.
- \`storageKey\`: Persists sizes and collapsed panel ids to \`localStorage\`. Use stable panel ids
  when enabling persistence.
- \`orientation\`: \`'horizontal' | 'vertical'\`. Horizontal lays panels left-to-right.
- \`direction\`: Backward-compatible alias for \`orientation\`.
- \`withHandle\`: Renders a visible grip in each separator.
- \`handleVariant\`: \`'grip' | 'thumb'\`. \`grip\` is the dotted handle; \`thumb\` is a compact
  pill-line affordance.
- \`showLines\`: Shows the visible separator line while keeping the resize rail active. Defaults to
  \`true\`.
- \`variant\`: \`'default' | 'splitted'\`. The \`splitted\` variant separates panels as softly
  raised rounded surfaces while keeping separator lines resizable.
- \`dir\`: \`'ltr' | 'rtl'\`. Mirrors horizontal pointer and keyboard deltas in RTL.
- \`disabled\`: Disables all resize handles.
- \`disabledHandles\`: Disables specific separators by zero-based handle index.
- \`keyboardStep\`: Arrow-key resize step in percentage points.
- \`resetOnDoubleClick\`: Resets adjacent panels toward their default sizes when a separator is
  double-clicked. Defaults to \`true\`.
- \`class\`: Additional CSS classes applied to the root group.
- \`theme\`: Theme overrides for root, panel, handle, grip, and grip dots.
- \`ref\`: Bindable root element reference.
- \`onResize\`: Fires after a drag ends or keyboard resize commits.
- \`onLayoutChange\`: Fires while layout changes.
- \`onLayoutCommit\`: Fires after layout changes with \`{ sizes, isUserInteraction }\`.
- \`onCollapsedPanelsChange\`: Fires when collapsed panel ids change.
- \`getHandleAriaLabel\`: Returns accessible labels for separators.

## Panel Items

- \`content\`: Required snippet rendered inside the panel. Receives a \`ResizablePanelPayload\`
  with \`id\`, \`index\`, \`size\`, \`min\`, \`max\`, \`collapsed\`, \`disabled\`, and \`dragging\`.
- \`id\`: Stable panel id.
- \`defaultSize\`: Initial size in percent.
- \`minSize\`: Minimum size in percent. Defaults to \`10\`.
- \`maxSize\`: Maximum size in percent. Defaults to \`100\`.
- \`collapsible\`: Enables collapse for this panel. Panels are not collapsible by default.
- \`defaultCollapsed\`: Applies the initial collapsed state once.
- \`collapsedSize\`: Resting size while collapsed. Numbers are percentages; strings may use
  \`px\` or \`%\` units, for example \`'56px'\` or \`'8%'\`. Defaults to \`0\`.
- \`collapseBreakpoint\`: Drag threshold in percent at or below which the panel collapses. Defaults
  to \`collapsedSize\`, which is \`0\` unless configured.
- \`disabled\`: Prevents adjacent handles from resizing this panel.
- \`class\`: Panel class.

## Accessibility

Handles render as focusable \`role="separator"\` controls with \`aria-orientation\`,
\`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\`, and \`aria-controls\`. Generated fallback
panel ids are instance-scoped. Arrow keys resize the leading panel; Home and End move the handle to
its minimum and maximum positions. Collapsed panels are marked \`aria-hidden\` and \`inert\` so hidden
content is removed from keyboard navigation; clicking an adjacent separator expands a collapsed
panel. Collapse and separator-triggered expansion use a short reduced-motion-aware layout
transition; normal pointer resizing remains direct.

## Persistence

Set \`storageKey\` to persist committed sizes and collapsed panel ids in \`localStorage\`. Persisted
layouts are restored only when the current panel id order matches the stored panel id order.

## Notes

Unlike shadcn/ui's React implementation, this component does not expose compound
\`ResizablePanelGroup\`, \`ResizablePanel\`, and \`ResizableHandle\` components. Svelai keeps the
configuration API from the svelte-pro source while adding bindable sizes and live layout callbacks.
`;
