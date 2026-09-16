export const floatingWindowDescription = `
# FloatingWindow Component

FloatingWindow renders a non-modal, portaled utility window that can be moved, resized, minimized into a configurable viewport-edge dock, restored, and closed. Multiple windows inside the same Theme provider coordinate their z-order and stack independently by dock placement. The Theme keeps floating windows below modal Dialog surfaces, so an open window remains mounted behind a dialog and returns unchanged when the dialog closes.

## Basic Usage

\`\`\`svelte
<script lang="ts">
  import { Button } from 'svelai/button';
  import { FloatingWindow } from 'svelai/floating-window';

  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open notes</Button>

<FloatingWindow bind:open title="Notes">
  <p>Window content remains interactive alongside the page.</p>
</FloatingWindow>
\`\`\`

## Props

- **id**: string - Stable DOM id. Generated when omitted.
- **open**: boolean (default: true) - Bindable rendered state.
- **defaultOpen**: boolean (default: true) - Initial state when open is not provided.
- **minimized**: boolean (default: false) - Bindable docked state.
- **dockPlacement**: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' (default: 'bottom-left') - Edge and alignment used by the minimized dock. Top and bottom placements stack horizontally; left and right placements use a vertical title bar and stack vertically.
- **title**: Slot<FloatingWindowPayload> (required) - Window title as text or a snippet.
- **children**: Slot<FloatingWindowPayload> - Main content.
- **dragFrom**: 'header' | 'window' (default: 'header') - Restricts dragging to the header or allows any non-interactive surface to start a drag.
- **draggable**: boolean (default: true) - Enables pointer dragging.
- **resizable**: boolean (default: true) - Enables four edge and four corner resize handles.
- **minimizable**: boolean (default: true) - Shows the minimize control.
- **closable**: boolean (default: true) - Shows the close control.
- **closeOnEscape**: boolean (default: true) - Closes the topmost expanded floating window when Escape is pressed.
- **position**: { x: number; y: number } - Bindable viewport-relative top-left position. The first render is centered when omitted.
- **dimensions**: { width: number; height: number; min?: [width, height]; max?: [width, height] } (default: 480 x 320, minimum 280 x 160) - Bindable pixel dimensions and optional constraint tuples. Maximum dimensions remain additionally constrained to the viewport.
- **class**: string - Additional classes on the visible window.
- **theme**: FloatingWindowThemeProps - Per-instance theme overrides.
- **ref**: HTMLDivElement - Bindable reference to the visible window or minimized dock item.
- **onOpenChange**: (open: boolean) => void - Runs once for each library-requested state change.
- **onAfterOpen**: (payload) => void - Runs after the open transition finishes.
- **onAfterClose**: (payload) => void - Runs after the close transition finishes.
- **onMinimize**: (payload) => void - Runs after minimize state updates.
- **onRestore**: (payload) => void - Runs after restore state updates.
- **onMove**: ({ position, window }) => void - Runs when a move commits.
- **onResize**: ({ dimensions, window }) => void - Runs when a pointer or keyboard resize commits.

## Dragging

Header dragging is the default because it preserves text selection and content interactions. With \`dragFrom="window"\`, buttons, links, inputs, editable content, resize handles, and descendants marked \`data-floating-window-no-drag\` remain excluded from drag starts.

## Accessibility

- The expanded surface uses a non-modal \`dialog\` role and is labelled by its title.
- Close, minimize, and restore controls are native Svelai buttons with accessible labels.
- Edge resize handles use \`separator\` semantics and support arrow-key resizing; hold Shift for a larger step.
- Opening focuses the non-modal window, closing restores focus to its previous owner, and only the topmost expanded floating window handles Escape.
- Alt+Arrow moves the focused window; hold Shift for a larger step.
- Corner handles are pointer-only because a diagonal separator has no valid ARIA orientation.
- The component does not trap focus or hide page content because it is explicitly non-modal.

## Theme Parts

- **root**: Floating window surface and drag/resize states.
- **header**: Default title bar and drag handle.
- **title**: Header title.
- **actions**: Header control group.
- **control**: Header and dock icon buttons.
- **scrollArea**: Flexible ScrollArea root that owns body scrolling.
- **content**: Padded content inside the ScrollArea viewport.
- **resizeHandle**: Edge and corner handles by direction.
- **dockItem**: Minimized surface.
- **dockTitle**: Full-width restore button in the dock item.
- **dockTitleText**: Truncated title text and lateral writing direction.
- **dockActions**: Dock restore and close controls.

## Motion

- **motion** theme slot, keyed by \`phase\`: \`flight\` times the crossfade between window and
  dock pill, \`enter\` / \`exit\` the scale fallback when there is no counterpart.
- Only \`duration\` / \`easing\` (plus the fallback's \`scale\` / \`opacity\`) are read.
- Ladder: \`<Theme components={{ 'floating-window': { motion } }}>\` →
  \`setFloatingWindowTheme({ motion })\` → \`theme.motion\`. Read once, at mount.
`;
