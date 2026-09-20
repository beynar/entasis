export const tooltipDescription = `
# Tooltip

Contextual information shown on hover or keyboard focus. Two forms share one surface:

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
  A snippet receives the tooltip attachment and spreads it on its own element; Button props render
  a Button carrying it
- **open**: boolean (default: false) - Shows the tooltip without hover or focus; bindable
- **defaultOpen**: boolean (default: false) - Initial open state when \`open\` is not provided
- **onOpenChange**: (open: boolean) => void - Called whenever the tooltip becomes visible or hidden,
  hover and focus included
- **position**: Placement (default: 'top') - Tooltip position relative to the trigger
  - Options: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Visual size
- **color**: Colors (default: 'neutral') - Color theme
- **variant**: 'solid' | 'outline' | 'soft' (default: 'solid') - Visual style matching Chip
- **delay**: number (default: 400) - Delay in ms before showing tooltip; zero shows immediately
- **offset**: number - Distance from the trigger in pixels
- **class**: string - Additional CSS classes
- **transition**: FSOProps - Custom transition configuration
- **theme**: TooltipThemeProps - Per-instance theme overrides
- **onAfterOpen**: () => void - Callback after the opening transition completes
- **onAfterClose**: () => void - Callback after the closing transition completes

Every prop except \`trigger\`, \`open\`, \`defaultOpen\` and \`onOpenChange\` is also an option of the
\`tooltip()\` attachment.

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

### With Callbacks
\`\`\`svelte
<script lang="ts">
	import { Tooltip } from 'entasis/tooltip';
</script>

<Tooltip
	content="Tracked tooltip"
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

## Accessibility

- Shows on pointer hover and on keyboard focus (\`focusin\` / \`focusout\` on the trigger element), so
  attach it to focusable elements for keyboard users
- Dismissed on mouse leave or blur
- Non-interactive (cannot be clicked)
- Renders with \`role="tooltip"\` and sets \`aria-describedby\` on the trigger while visible (any previous value is restored on hide)
- Does not block content behind it

## Notes

- Only one tooltip shows at a time; an \`open\` tooltip hands the surface over when another tooltip is
  hovered and reports that through \`onOpenChange\`
- Automatically positions to stay in viewport using Floating UI
- Uses smart delay: subsequent tooltips show instantly if within 400ms of previous
- Brief content only (use Popover for interactive content)
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
