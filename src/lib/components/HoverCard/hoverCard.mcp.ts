export const hoverCardDescription = `
# HoverCard Component

HoverCard previews supplemental content when a trigger is hovered or focused. It composes Popover for positioning and dismissal with Card for the visible content surface.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { HoverCard } from 'entasis/hover-card';
</script>

<HoverCard
	trigger={{ content: 'Hover @entasis', variant: 'link' }}
	title="@entasis"
	description="Composable Svelte UI components."
>
	<p>Preview content shown on hover or focus.</p>
</HoverCard>
\`\`\`

## Props

### Core Props
- **id**: string - Stable id for the underlying popover root.
- **open**: boolean - Bindable open state.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **trigger**: string | Snippet<[HoverCardPayload]> | ButtonProps - Trigger content. ButtonProps render a Entasis Button.
- **children**: string | Snippet<[HoverCardPayload]> - Main card content.
- **title**: string | Snippet<[HoverCardPayload]> - Card title slot.
- **description**: string | Snippet<[HoverCardPayload]> - Card description slot.
- **footer**: string | Snippet<[HoverCardPayload]> - Card footer slot.

### Behavior Props
- **position**: Placement (default: 'top') - Preferred placement relative to the trigger.
- **offset**: number (default: 8) - Gap between trigger and card.
- **delay**: number (default: 150) - Delay before opening on hover or focus.
- **closeDelay**: number (default: 100) - Delay before closing after pointer/focus leaves.
- **openOnFocus**: boolean (default: true) - Opens when focus enters the trigger or card.
- **openOnClick**: boolean (default: false) - Toggles on trigger click, useful for touch fallbacks.
- **disabled**: boolean (default: false) - Prevents opening and disables Button triggers.

### Dismissal and Transition Props
- **closeOnEscape**: boolean (default: true) - Escape closes the hover card.
- **closeOnClickOutside**: boolean (default: true) - Outside clicks close the hover card.
- **directedTransition**: boolean (default: true) - Transition direction follows placement.
- **transition**: ResponsiveProps<FSOProps> - Popover transition override.

### Styling Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Controls Popover panel and Card sizing.
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Controls inner Card padding and spacing.
- **class**: string - Extra classes on the inner Card.
- **triggerClass**: string - Extra classes on the trigger wrapper.
- **popover**: Props forwarded to the transparent Popover panel as one object - \`{ class, theme }\`.
- **card**: Props forwarded to the inner Card as one object - \`{ color, variant, theme }\` (defaults: color 'neutral', variant 'solid').
- **showBorders**: boolean (default: false) - Card section borders.
- **theme**: HoverCardThemeProps - Theme overrides for HoverCard wrapper parts.

### Callbacks
- **onOpenChange**: (open: boolean) => void - Called once for each library-requested state change.
- **onAfterOpen**: (payload: HoverCardPayload) => void - Called after the open transition finishes.
- **onAfterClose**: (payload: HoverCardPayload) => void - Called after the close transition finishes.

## Examples

### Delays
\`\`\`svelte
<HoverCard delay={300} closeDelay={200} trigger="Hover">
	Content
</HoverCard>
\`\`\`

### Custom Trigger
\`\`\`svelte
<HoverCard position="right">
	{#snippet trigger(hoverCard)}
		<button aria-expanded={hoverCard.isOpen}>Preview</button>
	{/snippet}

	Preview content
</HoverCard>
\`\`\`

## Accessibility

- Opens on pointer hover and keyboard focus by default.
- Escape and outside click dismissal are delegated to Popover.
- Button triggers receive aria-haspopup, aria-expanded, and aria-controls.
- HoverCard is best for supplemental previews; primary content should remain reachable without hover.

## Motion

- **motion** theme slot: one preset (no variants) — a small lift plus scale on \`fast\` / \`enter\`.
- Resolved by HoverCard and handed to the underlying Popover, replacing the popover preset.
- Ladder: \`<Theme components={{ 'hover-card': { motion } }}>\` → \`setHoverCardTheme({ motion })\`
  → \`theme.motion\` → the \`transition\` prop. Reduced motion collapses it to 0.
`;
