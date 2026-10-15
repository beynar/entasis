export const tooltipDescription = `
# Tooltip

Contextual information shown on hover or on keyboard focus (when the focus ring shows). Two forms share one surface:

- \`<Tooltip>\` — a component with a \`trigger\` prop, like every other overlay.
- \`tooltip()\` — the underlying attachment, for elements you already render yourself.

Both are rendered by the single tooltip surface that \`<Theme>\` mounts (\`TooltipHost\`).

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip content="Click to submit" trigger={{ content: 'Submit', variant: 'outline' }} />
\`\`\`

## Props

- **content**: string | Snippet (required) - Tooltip body
- **trigger**: Snippet<[Attachment<HTMLElement>]> | ButtonProps & { content?: string } (required) -
  A snippet receives the tooltip attachment and spreads it on its own element; an element the
  browser cannot focus (a span, an icon) gets \`tabindex="0"\` so keyboard focus shows the tooltip.
  Button props render a Button carrying it; \`children\` (a string or a snippet) replaces
  \`content\` for a richer body
- **open**: boolean (default: false) - Shows the tooltip without hover or focus; bindable
- **defaultOpen**: boolean (default: false) - Initial open state when \`open\` is not provided
- **onOpenChange**: (open: boolean, details: OpenChangeDetails) => void - Called before the tooltip
  shows or hides, whatever causes it (hover, focus, a press on the trigger, Escape, an outside press).
  \`details.reason\` is \`'trigger-hover'\`, \`'trigger-focus'\`, \`'trigger-press'\`, \`'outside-press'\`,
  \`'escape-key'\` or \`'imperative-action'\`; \`details.event\` and \`details.trigger\` say what caused it, and
  \`details.cancel()\` keeps the tooltip as it was. When another tooltip takes the shared surface, the
  one it leaves is told with a close that cannot be cancelled. A change to the \`open\` prop is silent
- **position**: Placement (default: 'top') - Tooltip position relative to the trigger
  - Options: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Visual size
- **color**: Colors (default: 'neutral') - Color theme
- **variant**: 'solid' | 'outline' | 'soft' (default: 'solid') - Visual style matching Chip
- **delay**: number (default: 400) - Delay in ms before showing tooltip; zero shows immediately
- **closeDelay**: number (default: 0) - Delay in ms between the pointer leaving the trigger (or the
  content) and the tooltip closing; moving to another tooltip's trigger within it hands the surface
  over without closing it. With \`hoverable\` content the pointer always gets at least 100 ms to reach it
- **hoverable**: boolean (default: true) - The tooltip stays open while the pointer is over its content
  (WCAG 1.4.13), so its text can be read or selected and its links used. \`false\` makes the content
  ignore the pointer and closes the tooltip as soon as the pointer leaves the trigger
- **closeOnClick**: boolean (default: true) - A press on the trigger (pointer, or Enter / Space) closes
  the tooltip, and it stays closed until the pointer leaves the trigger or focus moves away. \`false\`
  leaves it open
- **disabled**: boolean (default: false) - Turns the tooltip off: hover and focus do not open it, an
  open one closes, and the trigger loses \`aria-describedby\`. Read live
- **offset**: number - Distance from the trigger in pixels
- **class**: string - Additional CSS classes
- **transition**: FSOProps - Custom transition configuration
- **theme**: TooltipThemeProps - Per-instance theme overrides
- **onAfterOpen**: () => void - Callback after the opening transition completes
- **onAfterClose**: () => void - Callback after the closing transition completes

Every prop except \`trigger\`, \`open\` and \`defaultOpen\` is also an option of the \`tooltip()\`
attachment, \`onOpenChange\` included.

## Examples

### Button Trigger
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip
	content="This is helpful information"
	trigger={{ content: 'Hover me', variant: 'outline', color: 'neutral' }}
/>
\`\`\`

### Snippet Trigger
\`\`\`svelte
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Tooltip } from 'entasis/tooltip';
</script>

{#snippet helpTrigger(attach: Attachment<HTMLElement>)}
	<span class="underline" {@attach attach}>What is this?</span>
{/snippet}

<Tooltip content="Anchored to any element you like" trigger={helpTrigger} />
\`\`\`

### Forced Open
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<!-- Useful for docs, screenshots and visual tests -->
<Tooltip open content="Always visible" trigger={{ content: 'Anchor', variant: 'outline' }} />
\`\`\`

### Different Positions
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip content="Top tooltip" position="top" trigger={{ content: 'Top' }} />
<Tooltip content="Bottom tooltip" position="bottom" trigger={{ content: 'Bottom' }} />
<Tooltip content="Left tooltip" position="left" trigger={{ content: 'Left' }} />
<Tooltip content="Right tooltip" position="right" trigger={{ content: 'Right' }} />
\`\`\`

### Different Colors
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip content="Success!" color="success" trigger={{ content: 'Success' }} />
<Tooltip content="Warning!" color="warning" trigger={{ content: 'Warning' }} />
<Tooltip content="Error!" color="danger" trigger={{ content: 'Error' }} />
\`\`\`

### Custom Delay
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip content="Quick tooltip" delay={100} trigger={{ content: 'Quick (100ms)' }} />
<Tooltip content="Slow tooltip" delay={1000} trigger={{ content: 'Slow (1000ms)' }} />
\`\`\`

### Different Sizes and Variants
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip content="Small tooltip" size="small" trigger={{ content: 'Small' }} />
<Tooltip content="Large tooltip" size="large" trigger={{ content: 'Large' }} />
<Tooltip content="Outlined tooltip" variant="outline" trigger={{ content: 'Outline' }} />
<Tooltip content="Soft tooltip" variant="soft" trigger={{ content: 'Soft' }} />
\`\`\`

### With Snippet Content
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

{#snippet richContent()}
	<div class="p-2">
		<strong>Pro Tip</strong>
		<p class="text-sm">Use Ctrl+S to save</p>
	</div>
{/snippet}

<Tooltip content={richContent} trigger={{ content: 'Keyboard Shortcuts' }} />
\`\`\`

### Hoverable Content
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

{#snippet help()}
	Read the <a href="/docs/shortcuts">shortcut list</a>.
{/snippet}

<!-- The pointer can move onto the tooltip and use the link -->
<Tooltip content={help} trigger={{ content: 'Shortcuts' }} />

<!-- The pointer passes through, and the tooltip closes on leaving the trigger -->
<Tooltip hoverable={false} content="Not interactive" trigger={{ content: 'Hint' }} />
\`\`\`

### Press and Disabled
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';

	let busy = $state(false);
</script>

<!-- Closes when the trigger is pressed, and stays closed until the pointer leaves -->
<Tooltip content="Save changes" trigger={{ content: 'Save' }} />

<!-- Stays open after a press -->
<Tooltip closeOnClick={false} content="Save changes" trigger={{ content: 'Save' }} />

<!-- No tooltip while busy -->
<Tooltip disabled={busy} content="Save changes" trigger={{ content: 'Save' }} />
\`\`\`

### With Callbacks
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip
	content="Tracked tooltip"
	onOpenChange={(open, details) => console.log(open, details.reason)}
	onAfterOpen={() => console.log('Tooltip opened')}
	onAfterClose={() => console.log('Tooltip closed')}
	trigger={{ content: 'Track me' }}
/>
\`\`\`

## The tooltip() attachment

Use the attachment when the element already exists in your markup — icons, table cells, list rows,
disabled wrappers — or inside another component's internals.

\`\`\`svelte
<script lang="ts">
	import { tooltip } from 'entasis/tooltip';
</script>

<button {@attach tooltip({ content: 'Click to submit' })}> Submit </button>

<!-- On icons or any non-interactive element -->
<span {@attach tooltip({ content: 'More information', position: 'right' })}> ⓘ </span>

<!-- Disabled elements do not fire events, so wrap them -->
<span {@attach tooltip({ content: 'Feature coming soon' })}>
	<button disabled>Disabled Button</button>
</span>
\`\`\`

The \`<Tooltip>\` component hands this same attachment to a snippet trigger, so the two forms are
interchangeable.

## Styling hooks

The surface (the \`role="tooltip"\` element that \`class\` and the theme style) and the trigger carry state attributes.

Attributes are presence attributes (set while the state holds, omitted otherwise) unless they carry a value.

**Data attributes**
- \`data-open\`: On the surface: present while the tooltip shows.
- \`data-closed\`: On the surface: present while its exit transition plays.
- \`data-entering\`: On the surface: present while the enter transition plays.
- \`data-exiting\`: On the surface: present while the exit transition plays.
- \`data-side\`: On the surface: the side of the trigger it sits on after flipping, \`top\`, \`right\`, \`bottom\` or \`left\`.
- \`data-align\`: On the surface: \`start\`, \`center\` or \`end\`, how it lines up with the trigger.
- \`data-anchor-hidden\`: On the surface: present while the trigger is scrolled out of view.
- \`data-instant\`: On the surface: present while it moved straight from one trigger to another, which plays no transition.
- \`data-color\`: On the surface: the resolved \`color\`.
- \`data-size\`: On the surface: the resolved \`size\`.
- \`data-variant\`: On the surface: the resolved \`variant\`.
- \`data-popup-open\`: On the trigger: present while its tooltip shows.
- \`data-popup-side\`: On the trigger: the surface's \`data-side\` while it is placed.

**CSS variables**
- \`--available-width\`: The width in px the surface can take before it reaches the viewport edges, minus 20px.
- \`--available-height\`: The room in px between the trigger and the viewport edge on the surface's side, minus 20px.
- \`--anchor-width\`: The trigger's width in px, snapped to the device pixel grid.
- \`--anchor-height\`: The trigger's height in px, snapped to the device pixel grid.
- \`--transform-origin\`: The surface corner facing the trigger, the point it scales from.

The typed maps \`tooltipDataAttributes\` and \`tooltipCssVariables\` (from \`entasis/tooltip\`) list each name with its meaning.

\`\`\`svelte
<script>
	import { Tooltip } from 'entasis/tooltip';
</script>

<!-- Nudge the surface away from the side it sits on while it enters -->
<Tooltip content="Saved" class="data-[side=top]:data-entering:-translate-y-0.5" trigger={{ content: 'Save' }} />
\`\`\`

## Accessibility

- Shows on pointer hover and on keyboard focus (\`focusin\` / \`focusout\` on the trigger element), so
  attach it to focusable elements for keyboard users
- Focus opens it only when the browser shows a focus ring: focus from a mouse press or a tap, focus a
  closing dialog or popover hands back, and focus that returns with the window do not
- A touch tap is not a hover: the compatibility mouse events a tap fires never show the tooltip
- The content can be hovered (WCAG 1.4.13: hoverable, dismissible, persistent): the pointer may move
  onto the tooltip, and Escape dismisses it
- A trigger that appears under a resting pointer (a dialog closing over it, a list scrolled by the
  wheel) shows its tooltip once the pointer moves, not on arrival
- Dismissed on mouse leave or blur
- Brief, read-only content; use \`hoverable={false}\` for content that should never take the pointer
- Renders with \`role="tooltip"\` and sets \`aria-describedby\` on the trigger while visible (any previous value is restored on hide)
- Does not block content behind it when \`hoverable={false}\`; the default hoverable content captures the pointer so it can be read

## Notes

- Only one tooltip shows at a time; an \`open\` tooltip hands the surface over when another tooltip is
  hovered and reports that through \`onOpenChange\`. Moving between triggers keeps the surface: it
  stays in place, resizes to the new content and carries \`data-instant\`; the tooltip it leaves gets
  \`onAfterClose\` and the new one \`onAfterOpen\`
- Automatically positions to stay in viewport using Floating UI
- Uses smart delay: right after a tooltip, a hover card or a hover-opened popover was open
  (within 400ms of it closing, or while a hover card or popover is still open), the next tooltip
  shows instantly. A tooltip inside an open hover card keeps its delay.
- Brief content only: text and a link are fine, but use Popover for controls and forms
- The surface is a singleton (\`TooltipHost\`) rendered by \`<Theme>\`
- Does not lock scroll or trap focus

## Theme Customization

The Tooltip uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main tooltip container styles

### Theme Type Definition

\`\`\`typescript
import type { TooltipThemeProps } from 'entasis/tooltip';

// Example theme customization
const customTheme: TooltipThemeProps = {
  root: {
    base: 'inline-flex w-fit items-center rounded-full border font-medium',
    size: {
      small: 'h-5 px-2 text-xs',
      normal: 'h-6 px-2.5 text-xs',
      large: 'h-7 px-3 text-sm'
    },
	color: {
	  neutral: 'bg-neutral text-neutral-contrast',
      primary: 'bg-primary text-primary-contrast',
      danger: 'bg-danger text-danger-contrast',
      success: 'bg-success text-success-contrast',
      warning: 'bg-warning text-warning-contrast',
	  info: 'bg-info text-info-contrast'
	},
	variant: {
	  solid: 'bg-color text-color-contrast',
	  outline: 'border-color bg-transparent text-color-readable',
	  soft: 'bg-color-muted text-color-muted-readable'
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes applied to all tooltips
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls text size and padding
  - color: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Color scheme
  - variant: 'solid' | 'outline' | 'soft' - Matches Chip's visual variants

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip
	content="Custom tooltip"
	theme={{ root: { base: 'rounded-lg lift-4 border-2', size: { normal: 'px-3 py-2 text-sm' } } }}
	trigger={{ content: 'Hover me' }}
/>
\`\`\`

**Color Customization**:
\`\`\`svelte
<script lang="ts">
	import { tooltip } from 'entasis/tooltip';
</script>

<button
	{@attach tooltip({
		content: 'Success!',
		color: 'success',
		theme: { root: { color: { success: 'bg-green-500 text-white lift-3' } } }
	})}
>
	Success Tooltip
</button>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script lang="ts">
	import { setTooltipTheme } from 'entasis/tooltip';

	setTooltipTheme({
		root: {
			base: 'rounded-md lift-4 backdrop-blur-sm',
			size: { normal: 'px-3 py-1.5 text-sm' },
			color: { neutral: 'bg-gray-900 text-white', primary: 'bg-blue-500 text-white' }
		}
	});
</script>
\`\`\`

## Motion

- **motion** theme slot: one preset (no variants) — a short fade-and-rise, \`duration: 'fast'\`.
- Resolved by the tooltip surface and handed to the underlying Popover, so it replaces the
  popover preset.
- Ladder: \`<Theme components={{ tooltip: { motion } }}>\` → \`setTooltipTheme({ motion })\` →
  \`theme.motion\` → the tooltip's \`transition\` option. Reduced motion collapses it to 0.
- The tooltip surface is a singleton rendered by \`<Theme>\`, so a \`setTooltipTheme\` call
  made *below* \`<Theme>\` never reaches it. Call it at or above the \`<Theme>\` boundary, or
  use the \`<Theme components={{ tooltip }}>\` registry, which always applies.
`;
