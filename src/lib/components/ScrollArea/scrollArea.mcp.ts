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
- **viewportRole**: string - Role of the scrolling viewport. Without it the viewport is a plain element while its content fits and a \`group\` while it overflows (or when \`label\` is passed). Set it to the role the surrounding structure expects (\`rowgroup\` inside a grid or treegrid, for instance); inside a listbox pass \`presentation\`, which keeps the viewport unnamed and out of the tab order even while it overflows
- **type**: 'hover' | 'always' | 'scroll' | 'auto' (default: 'hover') - Controls scrollbar visibility behavior
- **delay**: number (default: 0) - Milliseconds before hover mode treats the area as hovered
- **onscroll**: (event: Event) => void - Native scroll handler attached to the viewport

### Behavior Props
- **scrollOnEdges**: boolean (default: false) - Enables auto-scroll and up/down indicators when the pointer rests near the viewport edges
- **scrollFade**: boolean (default: false) - Applies the shared \`scroll-fade\` utility to the scrollable viewport

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
- \`viewportRole="presentation"\` (or \`none\`) keeps the viewport transparent even while it overflows; use it when a surrounding listbox or grid owns keyboard scrolling.
- The custom scrollbars and the edge-scroll arrows are pointer-only and carry \`aria-hidden="true"\`.

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
