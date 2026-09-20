export const separatorDescription = `
# Separator Component

The Separator component is a visual divider that separates content in an interface. It supports both horizontal and vertical orientations, optional labels, customizable colors, and variable thickness.

## Basic Usage

\`\`\`svelte
<Separator />
\`\`\`

## Props

### Core Props
- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal') - The direction of the separator
- **color**: Colors (default: 'neutral') - The color of the separator line
  - Available: primary, secondary, success, warning, danger, info, neutral
- **thickness**: number (default: 1) - The thickness of the separator in pixels
- **decorative**: boolean (default: false) - Whether the separator is purely decorative (affects ARIA role)

### Content Slots
- **children**: Snippet - Optional label text to display in the middle of the separator

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: SeparatorThemeProps - Custom theme overrides

## Separator Structure

\`\`\`
<Separator>
	<Label />  <!-- Optional: shown in the middle -->
</Separator>
\`\`\`

## Examples

### Basic Horizontal Separator
\`\`\`svelte
<Separator />
\`\`\`

### Vertical Separator
\`\`\`svelte
<div class="flex h-24">
	<div>Left content</div>
	<Separator orientation="vertical" />
	<div>Right content</div>
</div>
\`\`\`

### With Label
\`\`\`svelte
<Separator>
	{#snippet children()}
		OR
	{/snippet}
</Separator>
\`\`\`

### With String Label
\`\`\`svelte
<Separator children="OR" />
\`\`\`

### Different Colors
\`\`\`svelte
<Separator color="primary" />
<Separator color="secondary" />
<Separator color="danger" />
<Separator color="success" />
\`\`\`

### Different Thicknesses
\`\`\`svelte
<Separator thickness={1} />
<Separator thickness={2} />
<Separator thickness={4} />
\`\`\`

### Thicker Separator
\`\`\`svelte
<Separator thickness={3} color="primary" />
\`\`\`

### With Label and Color
\`\`\`svelte
<Separator color="primary">
	{#snippet children()}
		Continue
	{/snippet}
</Separator>
\`\`\`

### In a Form
\`\`\`svelte
<form>
	<input type="email" placeholder="Email" />
	<input type="password" placeholder="Password" />
	<button type="submit">Sign In</button>
	
	<Separator>
		{#snippet children()}
			OR
		{/snippet}
	</Separator>
	
	<button type="button">Sign in with Google</button>
</form>
\`\`\`

### In a Menu
\`\`\`svelte
<div class="menu">
	<MenuOption title="Profile" />
	<MenuOption title="Settings" />
	
	<Separator />
	
	<MenuOption color="danger" title="Log Out" />
</div>
\`\`\`

### Vertical with Label
\`\`\`svelte
<div class="flex items-center h-32">
	<div>Section A</div>
	<Separator orientation="vertical">
		{#snippet children()}
			OR
		{/snippet}
	</Separator>
	<div>Section B</div>
</div>
\`\`\`

### Custom Styling
\`\`\`svelte
<Separator class="my-8" />
\`\`\`

### With Custom Theme
\`\`\`svelte
<Separator 
	theme={{
		root: { base: 'opacity-50' }
	}}
/>
\`\`\`

### Decorative Separator
\`\`\`svelte
<!-- Pure visual decoration, no semantic meaning -->
<Separator decorative />
\`\`\`

### Non-Decorative (Semantic)
\`\`\`svelte
<!-- Has semantic meaning, announces to screen readers -->
<Separator decorative={false} />
\`\`\`

### Complex Layout
\`\`\`svelte
<div class="space-y-4">
	<section>
		<h2>Personal Information</h2>
		<p>Your personal details</p>
	</section>
	
	<Separator color="primary" thickness={2}>
		{#snippet children()}
			Account Settings
		{/snippet}
	</Separator>
	
	<section>
		<h2>Security</h2>
		<p>Password and authentication</p>
	</section>
</div>
\`\`\`

### With Attachments
\`\`\`svelte
<script>
	import { spinnerOverlay } from 'entasis/spinner-overlay';
	
	let loading = $state(false);
</script>

<Separator 
	{@attach spinnerOverlay({ loading })}
>
	{#snippet children()}
		Loading...
	{/snippet}
</Separator>
\`\`\`

## Accessibility

- Uses proper ARIA attributes (\`aria-orientation\`)
- Role is set to "separator" by default for semantic separators
- Role is set to "none" when \`decorative={true}\` for purely visual separators
- Label content is accessible to screen readers
- Follows ARIA separator pattern guidelines

## Notes

- Default orientation is horizontal
- Default color is 'neutral' for subtle separation
- Thickness controls the border width of the line
- Label automatically positions in the center with proper spacing
- Vertical separators require a parent with defined height
- Works well with MenuOption, Dialog, and other components
- Can be used purely for decoration or as semantic content dividers

## Theme Customization

The Separator component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main separator container styles
- **label**: Separator label text styles

### Available Variants

**root**:
- base: Base classes applied to all separators
- Variants:
  - orientation: 'horizontal' | 'vertical' - Layout direction and styling
  - color: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Border color

**label**:
- base: Base classes for label text
- Variants:
  - orientation: 'horizontal' | 'vertical' - Label styling based on separator orientation

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Separator 
  theme={{
    root: {
      base: 'opacity-60',
      orientation: {
        horizontal: 'my-4'
      },
      color: {
        primary: 'before:border-primary/50 after:border-primary/50'
      }
    }
  }}
/>
\`\`\`

**Color Customization**:
\`\`\`svelte
<Separator 
  color="danger"
  theme={{
    root: {
      color: {
        danger: 'before:border-red-500 after:border-red-500'
      },
      orientation: {
        horizontal: 'my-6'
      }
    },
    label: {
      base: 'text-red-600 font-semibold'
    }
  }}
>
  {#snippet children()}
    Warning
  {/snippet}
</Separator>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setSeparatorTheme } from 'entasis/separator';
  
  setSeparatorTheme({
    root: {
      base: 'transition-opacity',
      orientation: {
        horizontal: 'my-3',
        vertical: 'mx-3'
      },
      color: {
        neutral: 'before:border-neutral/30 after:border-neutral/30'
      }
    }
  });
</script>
\`\`\`
`;
