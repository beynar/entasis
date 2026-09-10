export const tooltipDescription = `
# Tooltip Attachment

The tooltip attachment displays contextual information when hovering over an element. Use the \`{@attach}\` directive to attach tooltips to any element.

## Basic Usage

\`\`\`svelte
<script>
	import { tooltip } from 'svelai/tooltip';
</script>

<button {@attach tooltip({ content: 'Click to submit' })}>
	Submit
</button>
\`\`\`

## Props

- **content**: string | Snippet (required) - Tooltip content to display
- **position**: Placement (default: 'top') - Tooltip position relative to element
  - Options: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Visual size
- **color**: Colors (default: 'neutral') - Color theme
- **variant**: 'solid' | 'outline' | 'soft' (default: 'solid') - Visual style matching Chip
- **delay**: number (default: 400) - Delay in ms before showing tooltip; zero shows immediately
- **offset**: number - Distance from reference element in pixels
- **class**: string - Additional CSS classes
- **transition**: FSOProps - Custom transition configuration
- **onAfterOpen**: () => void - Callback after the opening transition completes
- **onAfterClose**: () => void - Callback after the closing transition completes

## Examples

### Basic Text Tooltip
\`\`\`svelte
<script>
	import { tooltip } from 'svelai/tooltip';
</script>

<div {@attach tooltip({ content: 'This is helpful information' })}>
	Hover me
</div>
\`\`\`

### Different Positions
\`\`\`svelte
<button {@attach tooltip({ content: 'Top tooltip', position: 'top' })}>
	Top
</button>

<button {@attach tooltip({ content: 'Bottom tooltip', position: 'bottom' })}>
	Bottom
</button>

<button {@attach tooltip({ content: 'Left tooltip', position: 'left' })}>
	Left
</button>

<button {@attach tooltip({ content: 'Right tooltip', position: 'right' })}>
	Right
</button>
\`\`\`

### Different Colors
\`\`\`svelte
<button {@attach tooltip({ content: 'Success!', color: 'success' })}>
	Success
</button>

<button {@attach tooltip({ content: 'Warning!', color: 'warning' })}>
	Warning
</button>

<button {@attach tooltip({ content: 'Error!', color: 'danger' })}>
	Error
</button>
\`\`\`

### Custom Delay
\`\`\`svelte
<button {@attach tooltip({ content: 'Quick tooltip', delay: 100 })}>
	Quick (100ms)
</button>

<button {@attach tooltip({ content: 'Slow tooltip', delay: 1000 })}>
	Slow (1000ms)
</button>
\`\`\`

### Different Sizes
\`\`\`svelte
<button {@attach tooltip({ content: 'Small tooltip', size: 'small' })}>
	Small
</button>

<button {@attach tooltip({ content: 'Normal tooltip', size: 'normal' })}>
	Normal
</button>

<button {@attach tooltip({ content: 'Large tooltip', size: 'large' })}>
	Large
</button>
\`\`\`

### With Custom Offset
\`\`\`svelte
<button {@attach tooltip({ content: 'Far away', offset: 20 })}>
	20px offset
</button>
\`\`\`

### Different Variants
\`\`\`svelte
<button {@attach tooltip({ content: 'Solid tooltip', variant: 'solid' })}>
	Solid
</button>

<button {@attach tooltip({ content: 'Outlined tooltip', variant: 'outline' })}>
	Outline
</button>

<button {@attach tooltip({ content: 'Soft tooltip', variant: 'soft' })}>
	Soft
</button>
\`\`\`

### With Snippet Content
\`\`\`svelte
<script>
	import { tooltip } from 'svelai/tooltip';
</script>

{#snippet richContent()}
	<div class="p-2">
		<strong>Pro Tip</strong>
		<p class="text-sm">Use Ctrl+S to save</p>
	</div>
{/snippet}

<button {@attach tooltip({ content: richContent })}>
	Keyboard Shortcuts
</button>
\`\`\`

### With Callbacks
\`\`\`svelte
<button {@attach tooltip({
	content: 'Tracked tooltip',
	onAfterOpen: () => console.log('Tooltip opened'),
	onAfterClose: () => console.log('Tooltip closed')
})}>
	Track me
</button>
\`\`\`

### On Icons
\`\`\`svelte
<svg 
	{@attach tooltip({ content: 'More information' })}
	class="w-4 h-4"
>
	<!-- icon paths -->
</svg>
\`\`\`

### On Disabled Elements
\`\`\`svelte
<!-- Wrap disabled elements since they don't fire events -->
<span {@attach tooltip({ content: 'Feature coming soon' })}>
	<button disabled>Disabled Button</button>
</span>
\`\`\`

## Accessibility

- Automatically shows on hover and focus
- Dismissed on mouse leave or blur
- Non-interactive (cannot be clicked)
- Uses appropriate ARIA attributes
- Does not block content behind it

## Notes

- Only one tooltip shows at a time
- Automatically positions to stay in viewport using Floating UI
- Uses smart delay: subsequent tooltips show instantly if within 400ms of previous
- Brief content only (use Popover for interactive content)
- Tooltip is managed globally through theme state
- Does not lock scroll or trap focus

## Theme Customization

The Tooltip component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main tooltip container styles

### Theme Type Definition

\`\`\`typescript
import type { TooltipThemeProps } from 'svelai/tooltip';

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
<button 
  {@attach tooltip({ 
    content: 'Custom tooltip',
    theme: {
      root: {
        base: 'rounded-lg shadow-lg border-2',
        size: {
          normal: 'px-3 py-2 text-sm'
        }
      }
    }
  })}
>
  Hover me
</button>
\`\`\`

**Color Customization**:
\`\`\`svelte
<button 
  {@attach tooltip({ 
    content: 'Success!',
    color: 'success',
    theme: {
      root: {
        color: {
          success: 'bg-green-500 text-white shadow-md'
        }
      }
    }
  })}
>
  Success Tooltip
</button>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setTooltipTheme } from 'svelai/tooltip';
  
  setTooltipTheme({
    root: {
      base: 'rounded-md shadow-lg backdrop-blur-sm',
      size: {
        normal: 'px-3 py-1.5 text-sm'
      },
	  color: {
		neutral: 'bg-gray-900 text-white',
        primary: 'bg-blue-500 text-white'
      }
    }
  });
</script>
\`\`\`
`;
