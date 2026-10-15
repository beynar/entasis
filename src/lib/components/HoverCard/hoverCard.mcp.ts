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
- **delay**: number (default: 150) - Delay before opening on hover or focus. Skipped right after another hover card, tooltip or hover-opened popover was open (within 400ms of it closing, or while one is still open), so moving between neighbouring cards does not wait at each one. Also skipped for this card itself from the moment it starts closing until its close transition has ended: pointing at the trigger again during the transition reopens it at once.
- **closeDelay**: number (default: 100) - Delay before closing after pointer/focus leaves.
- **openOnFocus**: boolean (default: true) - Opens when focus enters the trigger or card.
- **openOnClick**: boolean (default: false) - Toggles on trigger click, useful for touch fallbacks.
- **disabled**: boolean (default: false) - Prevents opening and disables Button triggers.
- **wrap**: boolean (default: false) - Lets the trigger wrap across lines like text, for a link inside a paragraph: it renders \`display: inline\` with \`box-decoration-break: clone\` instead of inline-flex, and the card anchors to the line the pointer entered. Applies to a snippet or button trigger; a string trigger is a button, which is one box
- **anchorTo**: 'box' | 'line' (default: 'line' with \`wrap\`, else 'box') - What the card anchors to when its trigger wraps: the whole bounding box, or the line the pointer entered, kept while the card is open. A keyboard open takes the first line above the trigger and the last one below it
- **arrow**: boolean (default: false) - Draws an arrow from the card toward its trigger; style it with \`popover.theme.arrow\`

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

### Cards inside cards

A card opened from inside another card (a link in its text) keeps the outer card open while the pointer is on either of them: leaving the outer card for the inner one does not start the outer card's close timer to completion. When the last inner card closes with the pointer outside every card (and focus outside them), the outer card closes too, after its \`closeDelay\`.

\`\`\`svelte
<HoverCard trigger={{ content: 'Entasis', variant: 'link' }} title="Entasis">
	Built on
	<HoverCard trigger={{ content: 'Svelte', variant: 'link' }} title="Svelte" position="right">
		Cybernetically enhanced web apps.
	</HoverCard>
</HoverCard>
\`\`\`

### A link in a paragraph

\`\`\`svelte
<p class="w-56">
	Read the
	<HoverCard wrap arrow>
		{#snippet trigger()}
			<span class="underline">full release notes for this version</span>
		{/snippet}
		Anchored to the line the pointer entered.
	</HoverCard>
	before upgrading.
</p>
\`\`\`

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

## Styling hooks

The card is a Popover panel and carries its state attributes; the trigger carries the popup state.

Attributes are presence attributes (set while the state holds, omitted otherwise) unless they carry a value.

**Data attributes**
- \`data-open\`: On the card: present while open.
- \`data-closed\`: On the card: present while its exit transition plays.
- \`data-entering\`: On the card: present while the enter transition plays.
- \`data-exiting\`: On the card: present while the exit transition plays.
- \`data-side\`: On the card: the side of the trigger it sits on after flipping, \`top\`, \`right\`, \`bottom\` or \`left\`; \`inline-start\` / \`inline-end\` when a logical \`position\` was requested.
- \`data-align\`: On the card: \`start\`, \`center\` or \`end\`, how it lines up with the trigger.
- \`data-anchor-hidden\`: On the card: present while the trigger is scrolled out of view.
- \`data-state\`: On the trigger: \`open\` or \`closed\` (kept for compatibility; prefer \`data-popup-open\`).
- \`data-popup-open\`: On the trigger: present while the card is open.
- \`data-popup-side\`: On the trigger: the card's \`data-side\` while it is placed.
- \`data-disabled\`: On the trigger: present while \`disabled\`.

**CSS variables** (set on the card's positioned wrapper and inherited by the card, which is the panel below)
- \`--available-width\`: The width in px the panel can take before it reaches the viewport edges, minus 20px.
- \`--available-height\`: The room in px between the trigger and the viewport edge on the panel's side, minus 20px. Cap a scrolling list with \`max-height: min(240px, var(--available-height))\`.
- \`--anchor-width\`: The trigger's width in px, snapped to the device pixel grid.
- \`--anchor-height\`: The trigger's height in px, snapped to the device pixel grid.
- \`--transform-origin\`: The panel corner facing the trigger, mirrored in right-to-left documents; the point the panel scales from.

The typed maps \`hoverCardDataAttributes\` and \`hoverCardCssVariables\` (from \`entasis/hover-card\`) list each name with its meaning.

## Accessibility

- Opens on pointer hover and keyboard focus by default. Hover means a mouse or a pen: a touch tap's pointer events never open or close the card, focus does.
- Escape and outside click dismissal are delegated to Popover.
- Button triggers receive aria-haspopup, aria-expanded, and aria-controls.
- HoverCard is best for supplemental previews; primary content should remain reachable without hover.

## Motion

- **motion** theme slot: one preset (no variants) — a small lift plus scale on \`fast\` / \`enter\`.
- Resolved by HoverCard and handed to the underlying Popover, replacing the popover preset.
- Ladder: \`<Theme components={{ 'hover-card': { motion } }}>\` → \`setHoverCardTheme({ motion })\`
  → \`theme.motion\` → the \`transition\` prop. Reduced motion collapses it to 0.
`;
