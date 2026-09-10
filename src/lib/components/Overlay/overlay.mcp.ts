export const overlayDescription = `
# Overlay Component

Overlay layers concise content and actions over bounded media or another visual surface. Place it as the direct first child of a container; the component automatically establishes that parent as its positioning context, so no attachment or wrapper component is required.

## Basic Usage

\`\`\`svelte
<script>
	import { Overlay } from 'svelai/overlay';
</script>

<div class="aspect-video overflow-hidden rounded-lg">
	<Overlay
		title="Design system foundations"
		description="A practical tour of tokens, primitives, and composition."
		actions={[{ content: 'Open gallery', color: 'neutral', variant: 'soft' }]}
	/>
	<img src="/cover.jpg" alt="Coastal landscape" class="size-full object-cover" />
</div>
\`\`\`

## Props

- **position**: 'fill' | 'top' | 'bottom' (default: 'fill') - Places the content vertically. Fill uses a surface-wide dark scrim; top and bottom use content-sized black-to-transparent gradients.
- **align**: 'start' | 'center' | 'end' (default: 'center') - Horizontal content and text alignment.
- **showOn**: 'always' | 'hover' | 'focus' (default: 'always') - Reveal condition. Hover also reveals for focus-within so actions remain keyboard accessible.
- **open**: boolean (default: true) - Enables or hides the overlay while preserving its reveal transition.
- **defaultOpen**: boolean (default: true) - Initial state when open is not provided.
- **onOpenChange**: (open: boolean) => void - Reserved for library-requested state changes.
- **onAfterOpen**: () => void - Called after the open transition finishes.
- **onAfterClose**: () => void - Called after the close transition finishes.
- **scrim**: boolean (default: true) - Toggles the dark fill or directional gradient.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Scales padding, gaps, and typography.
- **actions**: OverlayAction[] - Button props plus a content string, rendered as a wrapping action row.
- **ref**: HTMLDivElement | null - Bindable root reference.
- **class**: string - Additional root classes.
- **theme**: OverlayThemeProps - Theme overrides.

## Slots

- **title**: Main overlay heading.
- **description**: Supporting text.
- **content**: Additional body content between the description and actions.
- **children**: Fully custom composition replacing title, description, content, and actions.

All named content slots accept a string or snippet.

## Placement

The overlay must be the direct first child of the surface it covers:

\`\`\`svelte
<div class="overflow-hidden rounded-lg">
\t<Overlay position="bottom" title="Golden hour" />
\t<img src="/photo.jpg" alt="Golden hour over a valley" />
</div>
\`\`\`

The parent receives a zero-specificity relative positioning context and isolated stacking context through CSS \`:has()\`. An explicit parent positioning utility or inline style still takes precedence.

Top and bottom content enters from its corresponding edge while the scrim fades in place. Fill content only fades. Motion is disabled when the user requests reduced motion.

## Reveal on Hover or Focus

\`\`\`svelte
<div class="aspect-video overflow-hidden rounded-lg">
\t<Overlay
\t\tshowOn="hover"
\t\tposition="bottom"
\t\ttitle="Mountain archive"
\t\tactions={[{ content: 'View collection', color: 'neutral', variant: 'soft' }]}
\t/>
\t<img src="/mountain.jpg" alt="Snow-covered mountain" />
</div>
\`\`\`

## Accessibility

- The overlay is semantically neutral; supplied buttons and links keep their native semantics.
- Hover-revealed content also appears when focus enters the surface or its actions.
- Setting open to false makes the overlay inert and hides it from assistive technology.
- Images and video beneath the overlay still require their own accessible labels or alternatives.

## Theme Parts

- **root**: Absolute overlay, reveal state, vertical placement, and clipping.
- **scrim**: Fill or directional gradient.
- **content**: Padding and horizontal alignment.
- **header**: Title and description stack.
- **title**: Heading typography.
- **description**: Supporting text.
- **body**: Additional content slot.
- **actions**: Button row.
`;
