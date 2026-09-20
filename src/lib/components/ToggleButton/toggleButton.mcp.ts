export const toggleButtonDescription = `
# ToggleButton Component

The ToggleButton component is a two-state button that can be toggled on and off, useful for binary settings and selections.

## Basic Usage

\`\`\`svelte
<script>
	let isActive = $state(false);
</script>

<ToggleButton bind:value={isActive}>
	Toggle Me
</ToggleButton>
\`\`\`

## Props

### Core Props
- **value**: boolean (bindable) - Toggle state
- **defaultValue**: boolean (default: false) - Initial state when value is omitted
- **label**: string - Accessible name for icon-only buttons
- **type**: 'button' | 'submit' | 'reset' (default: 'button') - Native button type. The default prevents accidental form submission.
- **role**: 'radio' - Exposes the pressed state as \`aria-checked\` instead of \`aria-pressed\`. Set by ToggleButtonGroup in \`type="single"\` mode; rarely needed on a standalone button

### Visual Props
- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' (default: 'neutral')
- **variant**: 'outline' | 'ghost' (default: 'ghost') — a Button subset. Resting outline uses the same border and surface recipe as Button; the pressed state adds a muted fill.
- **size**: 'small' | 'normal' | 'large' (default: 'normal')

### State Props
- **disabled**: boolean (default: false) - Disables interaction

### Event Props
- **onValueChange**: (value: boolean) => void - Called once when toggle state changes

### Content Slots
- **children**: Snippet - Button content
- **prefix**: Snippet - Content before text (typically icons)
- **suffix**: Snippet - Content after text (typically icons)

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Examples

### Basic Toggle
\`\`\`svelte
<script>
	let value = $state(false);
</script>

<ToggleButton bind:value>
	{value ? 'On' : 'Off'}
</ToggleButton>
\`\`\`

### With Icon
\`\`\`svelte
<script lang="ts">
	import { textBIcon } from 'entasis/icons/textB';

	let isBold = $state(false);
</script>

<ToggleButton bind:value={isBold}>
	{#snippet prefix()}
		{@render textBIcon()}
	{/snippet}
	Bold
</ToggleButton>
\`\`\`

### Different Variants
\`\`\`svelte
<ToggleButton variant="ghost" bind:value>Ghost</ToggleButton>
<ToggleButton variant="outline" bind:value>Outline</ToggleButton>
\`\`\`

### Different Colors
\`\`\`svelte
<ToggleButton color="primary" bind:value>Primary</ToggleButton>
<ToggleButton color="danger" bind:value>Danger</ToggleButton>
<ToggleButton color="success" bind:value>Success</ToggleButton>
\`\`\`

### Toolbar Buttons
\`\`\`svelte
<script lang="ts">
	import { textBIcon } from 'entasis/icons/textB';
	import { textItalicIcon } from 'entasis/icons/textItalic';
	import { textUnderlineIcon } from 'entasis/icons/textUnderline';

	let format = $state({ bold: false, italic: false, underline: false });
</script>

<div class="flex gap-1">
	<ToggleButton bind:value={format.bold}>
		{#snippet prefix()}
			{@render textBIcon()}
		{/snippet}
	</ToggleButton>
	<ToggleButton bind:value={format.italic}>
		{#snippet prefix()}
			{@render textItalicIcon()}
		{/snippet}
	</ToggleButton>
	<ToggleButton bind:value={format.underline}>
		{#snippet prefix()}
			{@render textUnderlineIcon()}
		{/snippet}
	</ToggleButton>
</div>
\`\`\`

### With Change Handler
\`\`\`svelte
<script>
	function handleChange(value) {
		console.log('Toggled:', value);
	}
</script>

<ToggleButton onValueChange={handleChange}>
	Notify Me
</ToggleButton>
\`\`\`

### Disabled State
\`\`\`svelte
<ToggleButton disabled value>Disabled On</ToggleButton>
<ToggleButton disabled>Disabled Off</ToggleButton>
\`\`\`

## Accessibility

- Exposes the checked state through \`aria-pressed\` (or \`aria-checked\` when \`role="radio"\`)
- Renders \`type="button"\` unless explicitly overridden
- Keyboard accessible (Space/Enter to toggle)
- Focus states for keyboard navigation
- Screen reader friendly

## Notes

- Maintains toggle state between interactions
- Visual feedback for checked/unchecked states
- Can be used standalone or in ToggleButtonGroup
- Supports all standard button features

## Theme Customization

The ToggleButton component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main button element styles
- **prefix**: Prefix icon/content styles
- **suffix**: Suffix icon/content styles

### Available Variants

**root**:
- base: Base classes for button element
- Variants:
  - checked: boolean - Checked/toggled state styling
  - disabled: boolean - Disabled state styling
  - color: Color variants
  - variant: 'outline' | 'ghost' - Button variant
  - squared: boolean - Square button styling
  - size: 'small' | 'normal' | 'large' - Button size

**prefix**:
- base: Base classes for prefix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size
  - checked: boolean - Checked state styling

**suffix**:
- base: Base classes for suffix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size
  - checked: boolean - Checked state styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<ToggleButton 
  bind:value
  theme={{
    root: {
      base: 'rounded-md transition-all',
      checked: {
        true: 'bg-primary text-white',
        false: 'bg-gray-200'
      },
      size: {
        normal: 'px-4 py-2'
      }
    }
  }}
>
  Toggle
</ToggleButton>
\`\`\`

**Custom Checked State**:
\`\`\`svelte
<script lang="ts">
  import { checkIcon } from 'entasis/icons/check';
</script>

<ToggleButton 
  bind:value
  variant="outline"
  theme={{
    root: {
      variant: {
        outline: 'border-2'
      },
      checked: {
        true: 'border-primary bg-primary/10 text-primary',
        false: 'border-gray-300'
      }
    },
    prefix: {
      checked: {
        true: 'text-primary'
      }
    }
  }}
>
  {#snippet prefix()}
    {@render checkIcon()}
  {/snippet}
  Toggle
</ToggleButton>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setToggleButtonTheme } from 'entasis/toggle-button';
  
  setToggleButtonTheme({
    root: {
      base: 'transition-all duration-100',
      checked: {
        true: 'bg-primary text-white',
        false: 'bg-gray-200'
      },
      size: {
        normal: 'px-4 py-2 h-8'
      }
    },
    prefix: {
      size: {
        normal: 'max-w-6 max-h-6'
      }
    }
  });
</script>
\`\`\`
`;
