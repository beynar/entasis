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
- **ariaLabel**: string (default: 'Scrollable content') - Accessible name for the native scrolling viewport
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
