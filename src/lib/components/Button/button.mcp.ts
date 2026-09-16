export const buttonDescription = `
# Button Component

The Button component is a flexible and customizable button element that supports various variants, sizes, colors, and interactive states.

## Basic Usage

\`\`\`svelte
<Button>Click me</Button>
<Button variant="outline">Outline Button</Button>
<Button color="primary" size="large">Large Primary Button</Button>
\`\`\`

## Props

### Core Props
- **variant**: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' (default: 'solid')
  - solid: Filled background with color
  - outline: Transparent background with colored border
  - soft: Muted color background
  - ghost: Transparent background with a transient state layer on hover and press
  - link: Text-only styling with underline on hover

- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' (default: 'neutral')
  - Determines the color scheme of the button

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: 24px height, smaller padding and text
  - normal: 32px height, standard padding
  - large: 36px height, larger padding and text

### Layout Props
- **fullWidth**: boolean (default: false) - Makes button take full width of container
- **squared**: boolean - Makes button square (aspect-ratio 1:1), auto-determined if only prefix/suffix is provided
- **disabled**: boolean (default: false) - Disables button interaction
- **loading**: boolean (default: false) - Shows the Theme-configured loading spinner and disables interaction

### State Props
Describe the meaning; the Button writes the ARIA. Never pass an aria-* attribute to a Button.
- **pressed**: boolean - Toggle state of a button that stays on or off (a bold button in a toolbar, a "show password" eye). Rendered as aria-pressed
- **selected**: boolean - Chosen state of a button acting as one option among several (a tab, a listbox option). Rendered as aria-selected
- **expanded**: boolean - Whether the surface this button opens is showing. Rendered as aria-expanded. A svelai surface (Popover, PopupMenu, Select, Combobox) sets this on its own trigger, so pass it only for a surface you open yourself
- **haspopup**: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true - What the surface this button opens contains. Rendered as aria-haspopup, and likewise set by a svelai surface on its own trigger

### Link Props
- **href**: string - Makes button render as anchor tag
- **target**: string - Link target (e.g., "_blank")
- **rel**: string - Link relationship

### Event Props
- **onclick**: (event: MouseEvent) => void - Native click event handler
- **onpointerenter**: (event: PointerEvent) => void - Native pointer enter event handler
- **onpointerleave**: (event: PointerEvent) => void - Native pointer leave event handler

### Content Props (Slots)
- **children**: Snippet - Main button content
- **prefix**: Snippet - Content before main text (typically icons)
- **suffix**: Snippet - Content after main text (typically icons)

### Advanced Props
- **label**: string - Accessible label applied as aria-label on the root element (required for icon-only buttons)
- **ref**: HTMLElement - Reference to the button element
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

The button follows this DOM structure:
\`\`\`
<Button>
	<Prefix />    <!-- Optional prefix content -->
	<Children />  <!-- Main button content -->
	<Suffix />    <!-- Optional suffix content -->
</Button>
\`\`\`

## Examples

### Basic Buttons
\`\`\`svelte
<Button>Default Button</Button>
<Button variant="outline" color="primary">Primary Outline</Button>
<Button variant="soft" color="danger">Soft Danger</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>
\`\`\`

### With Icons
\`\`\`svelte
<Button>
	{#snippet prefix()}
		{@render icon()}
	{/snippet}
	Add Item
</Button>

<Button squared>
	{#snippet prefix()}
		{@render icon()}
	{/snippet}
</Button>
\`\`\`

### Interactive States
\`\`\`svelte
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width Button</Button>
\`\`\`

### As Link
\`\`\`svelte
<Button href="/dashboard" target="_blank">Go to Dashboard</Button>
\`\`\`

### With Event Handlers
\`\`\`svelte
<script lang="ts">
	function handleClick(event: MouseEvent) {
		console.log('Clicked:', event.currentTarget);
	}
</script>

<Button onclick={handleClick}>
	Click
</Button>
\`\`\`

### Custom Styling
\`\`\`svelte
<Button class="lift-4 border-2" color="primary" variant="outline">
	Custom Styled
</Button>
\`\`\`

## Accessibility

- Automatically sets appropriate ARIA roles (button/link)
- Supports keyboard navigation
- Disabled state prevents interaction
- Loading state provides visual feedback

## Notes

- When \`href\` is provided, renders as \`<a>\` tag, otherwise \`<button>\`
- \`squared\` is automatically determined when only prefix or suffix is provided without children
- All event handlers respect disabled state
- Icon sizing is automatically adjusted based on button size

## Theme Customization

The Button component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main button container styles
- **prefix**: Styles for prefix content (icons before text)
- **suffix**: Styles for suffix content (icons after text)

### Theme Type Definition

\`\`\`typescript
import type { ButtonThemeProps } from 'svelai/button';

// Example theme customization
const customTheme: ButtonThemeProps = {
  root: {
    base: 'custom-base-classes',
    size: {
      small: 'custom-small-classes',
      normal: 'custom-normal-classes',
      large: 'custom-large-classes'
    },
    color: {
      primary: 'bg-blue-500 text-white',
      danger: 'bg-red-500 text-white'
    },
    variant: {
      solid: 'bg-color text-color-contrast',
      outline: 'border-2 border-color'
    }
  },
  prefix: {
    size: {
      small: 'w-3 h-3',
      normal: 'w-4 h-4',
      large: 'w-5 h-5'
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes applied to all buttons
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls padding, text size, and height
  - color: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Color scheme
  - variant: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' - Visual style variant
  - loading: boolean - Loading state styling
  - disabled: boolean - Disabled state styling
  - squared: boolean - Square button styling
  - fullWidth: boolean - Full width styling

**prefix**:
- base: Base classes for prefix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size based on button size

**suffix**:
- base: Base classes for suffix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size based on button size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Button 
  theme={{
    root: {
      base: 'rounded-full lift-4',
      size: {
        large: 'px-8 py-4 text-xl'
      }
    }
  }}
>
  Custom Styled Button
</Button>
\`\`\`

**Color Variant Customization**:
\`\`\`svelte
<Button 
  color="primary"
  theme={{
    root: {
      color: {
        primary: 'state-layer bg-gradient-to-r from-blue-500 to-purple-500'
      }
    }
  }}
>
  Gradient Button
</Button>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setButtonTheme } from 'svelai/button';
  
  setButtonTheme({
    root: {
      variant: {
        solid: 'state-layer bg-color text-color-contrast lift-3 hover:lift-4 transition-shadow',
        outline: 'state-layer border-2 border-color'
      }
    },
    prefix: {
      size: {
        normal: 'w-5 h-5'
      }
    }
  });
</script>
\`\`\`
`;
