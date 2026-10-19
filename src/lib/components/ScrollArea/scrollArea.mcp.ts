export const scrollAreaDescription = `
# ScrollArea Component

The ScrollArea component provides a native scroll viewport with custom overlay scrollbars.

## Basic Usage

\`\`\`svelte
<ScrollArea class="h-64">
	{#each items as item}
		<div>{item}</div>
	{/each}
</ScrollArea>
\`\`\`

## Props

### Core Props
- **children**: Snippet - Content rendered inside the scrollable viewport
- **ref**: HTMLElement | null (bindable) - Reference to the root scroll-area element
- **viewportRef**: HTMLElement | null (bindable) - Reference to the native scrolling viewport, suitable for virtualizers and imperative scrolling
- Native div attributes and attachments are forwarded to the root element
- **label**: string - Accessible name for the native scrolling viewport; passing it makes the viewport a named \`group\` even when its content fits. Without it the viewport is named 'Scrollable content' (i18n \`scrollableContent\`) only while it overflows
- **viewportAttrs**: attributes, handlers and attachments spread onto the scrolling viewport, for a widget that makes the viewport its own element (a listbox: \`role\`, \`aria-activedescendant\`, \`id\`). They win over the viewport's own: \`class\` is added to its classes, and \`onscroll\`, \`onfocus\` and \`onblur\` run before the built-in handling. A \`role\` here hands the viewport's semantics to the caller: the viewport then adds neither the automatic 'Scrollable content' name nor the automatic tab stop, so pass \`tabindex\` and a name when the role needs them
- **viewportRole**: string - Role of the scrolling viewport. Without it the viewport is a plain element while its content fits and a \`group\` while it overflows (or when \`label\` is passed). Set it to the role the surrounding structure expects (\`rowgroup\` inside a grid or treegrid, for instance); inside a listbox pass \`presentation\`, which keeps the viewport unnamed and out of the tab order even while it overflows
- **type**: 'hover' | 'always' | 'scroll' | 'auto' (default: 'hover') - Controls scrollbar visibility. \`hover\` shows the bars while the pointer is over the area or the area is scrolling, so touch scrolling (which never hovers) reveals them too; \`always\` and \`auto\` show them whenever the content overflows; \`scroll\` shows them only while scrolling
- **overflowEdgeThreshold**: number (default: 1) - Px of content that may stay hidden past an edge before \`data-overflow-*-start\` / \`data-overflow-*-end\` (and the \`scrollOnEdges\` arrows) count it
- **delay**: number (default: 0) - Milliseconds before hover mode treats the area as hovered
- **onscroll**: (event: Event) => void - Native scroll handler attached to the viewport

### Behavior Props
- **scrollOnEdges**: boolean (default: false) - Enables auto-scroll and up/down indicators when the pointer rests near the viewport edges
- **scrollFade**: boolean (default: on inside a popup, off elsewhere) - Applies the shared \`scroll-fade\` utility to the scrollable viewport. Left out, it is on inside any overlay layer (a popover, a menu, a dialog), where the fade marks the clipped edge of a short panel; pass \`false\` to turn it off there

### Styling Props
- **class**: string - Additional CSS classes for the root scroll area
- **theme**: ScrollAreaThemeProps - Custom theme overrides

## Examples

### With Scroll Fade
\`\`\`svelte
<ScrollArea class="h-64" scrollFade>
	{#each items as item}
		<div>{item}</div>
	{/each}
</ScrollArea>
\`\`\`

### Always Visible Scrollbar
\`\`\`svelte
<ScrollArea class="h-64" type="always">
	Content
</ScrollArea>
\`\`\`

### Edge Auto Scroll
\`\`\`svelte
<ScrollArea class="h-64" scrollOnEdges>
	Content
</ScrollArea>
\`\`\`

## Notes

- The viewport is the native scroll container.
- The \`scrollFade\` prop applies the utility to the viewport, not the outer wrapper.
- Native browser scrollbars are hidden while custom scrollbar thumbs are rendered over the viewport.
- Keyboard focus is applied only when the viewport overflows.

## Accessibility

- A viewport whose content fits is a plain element: no role, no name, no tab stop.
- While it overflows, the viewport is a \`group\` named by \`label\` (default 'Scrollable content') with \`tabindex="0"\`, so keyboard users can scroll it (WCAG SCR34).
- A focused viewport whose content stops overflowing keeps its role, name and \`tabindex="-1"\` until it blurs, so focus never drops to the page.
- \`viewportRole="presentation"\` (or \`none\`) keeps the viewport transparent even while it overflows; use it when a surrounding listbox or grid owns keyboard scrolling.
- The custom scrollbars and the edge-scroll arrows are pointer-only and carry \`aria-hidden="true"\`.

## Styling hooks

Data attributes (presence attributes, set to \`""\` while the state holds):

- \`data-scrolling\` on the root, viewport, scrollbars and thumbs: from the first scroll event until the viewport has been idle for 400 ms
- \`data-has-overflow-x\` / \`data-has-overflow-y\` on the root: the content overflows on that axis
- \`data-overflow-x-start\`, \`data-overflow-x-end\`, \`data-overflow-y-start\`, \`data-overflow-y-end\` on the root: content is hidden past that edge by more than \`overflowEdgeThreshold\`. The x edges are logical (inline start / end), so in RTL \`start\` is the right edge
- \`data-orientation\` (\`vertical\` | \`horizontal\`) on the scrollbars and thumbs

CSS variables on the root, in px (0 while the axis does not overflow): \`--scroll-area-overflow-x-start\`, \`--scroll-area-overflow-x-end\`, \`--scroll-area-overflow-y-start\`, \`--scroll-area-overflow-y-end\`. Overscroll (WebKit rubber banding) is not counted as hidden content.

The typed maps \`scrollAreaDataAttributes\` and \`scrollAreaCssVariables\` (from \`entasis/scroll-area\`) list each name with its meaning.

\`\`\`svelte
<!-- Rules appear only while content is hidden past that edge. -->
<ScrollArea class="h-64 data-overflow-y-start:border-t data-overflow-y-end:border-b">
	Content
</ScrollArea>
\`\`\`

\`\`\`css
/* Fade the top edge only while content is hidden above. */
[data-scroll-area]::before {
	opacity: min(1, calc(var(--scroll-area-overflow-y-start) / 24));
}
\`\`\`

## Behavior

- Wheeling over a scrollbar scrolls the viewport, and passes the wheel on to the page once the viewport cannot move that way.
- Pressing a scrollbar or thumb with the primary button does not move focus (a Combobox input keeps it while its list is dragged). Scroll snapping on the viewport is paused while a thumb is held, then restored.
- Horizontal scrolling follows the viewport's writing direction: in RTL the offset is negative, the vertical bar sits at the left, the horizontal thumb starts at the right, and the bars inset each other at the corner when both show.
- While WebKit rubber-bands past either end, the thumb shrinks (down to 18 px) and stays pinned to that edge instead of leaving its track.

## Theme Structure

The theme object contains:
- **root**: Main scroll area container styles
- **viewport**: Scrollable viewport container styles
- **content**: Scrollable content wrapper styles
- **scrollbar**: Vertical scrollbar track styles
- **scrollbarX**: Horizontal scrollbar track styles
- **scrollbarThumb**: Scrollbar thumb styles

## Available Variants

**viewport**:
- scrollFade: 'none' | 'y' | 'x' - Adds the shared vertical or horizontal scroll-fade utility
`;
