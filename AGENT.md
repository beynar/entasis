# Uy Component Library - Color System & Tailwind Integration

This project uses **uy** as a component and theme library that extends Tailwind CSS with a sophisticated color system and custom utilities.

## Color System Overview

Uy defines a semantic color palette with 8 main color categories, each with 6 shades:

### Semantic Colors

- **primary** - Main brand color (default: indigo)
- **secondary** - Complementary color (automatically generated from primary if not specified)
- **danger** - Error/destructive actions (default: red)
- **success** - Success states (default: green/blue)
- **warning** - Warning states (default: amber)
- **info** - Informational states (default: cyan)
- **background** - Page and surface backgrounds (adapts to color scheme)
- **foreground** - Default text color for content on background surfaces, provides text color hierarchy

### Color Shades

Each color has 6 variations:

- **DEFAULT** - Base color
- **light** - 10% lighter
- **lighter** - 25% lighter
- **dark** - 10% darker
- **muted** - Heavily mixed with background (90% opacity)
- **contrast** - Accessible text color that provides readable contrast on a colored background

## Custom Tailwind Classes

### **Recommended: Direct Semantic Color Classes**

**Use these direct color classes as the primary approach:**

```css
/* Backgrounds */
bg-primary, bg-primary-light, bg-primary-dark, bg-primary-muted, bg-primary-contrast
bg-secondary, bg-secondary-light, bg-secondary-dark, bg-secondary-muted, bg-secondary-contrast
bg-danger, bg-danger-light, bg-danger-dark, bg-danger-muted, bg-danger-contrast
bg-success, bg-success-light, bg-success-dark, bg-success-muted, bg-success-contrast
bg-warning, bg-warning-light, bg-warning-dark, bg-warning-muted, bg-warning-contrast
bg-info, bg-info-light, bg-info-dark, bg-info-muted, bg-info-contrast
bg-background, bg-background-light, bg-background-dark, bg-background-muted, bg-background-contrast
bg-foreground, bg-foreground-light, bg-foreground-dark, bg-foreground-muted, bg-foreground-contrast

/* Text colors - Use foreground colors for text on background surfaces */
text-primary, text-primary-light, text-primary-dark, text-primary-muted, text-primary-contrast
text-secondary, text-secondary-light, text-secondary-dark, text-secondary-muted, text-secondary-contrast
text-danger, text-danger-light, text-danger-dark, text-danger-muted, text-danger-contrast
text-success, text-success-light, text-success-dark, text-success-muted, text-success-contrast
text-warning, text-warning-light, text-warning-dark, text-warning-muted, text-warning-contrast
text-info, text-info-light, text-info-dark, text-info-muted, text-info-contrast
text-background, text-background-light, text-background-dark, text-background-muted, text-background-contrast
text-foreground, text-foreground-light, text-foreground-dark, text-foreground-muted, text-foreground-contrast

/* Border colors follow same pattern */
border-primary, border-primary-light, border-primary-dark, border-primary-muted, border-primary-contrast
border-secondary, border-secondary-light, border-secondary-dark, border-secondary-muted, border-secondary-contrast
border-danger, border-danger-light, border-danger-dark, border-danger-muted, border-danger-contrast
border-success, border-success-light, border-success-dark, border-success-muted, border-success-contrast
border-warning, border-warning-light, border-warning-dark, border-warning-muted, border-warning-contrast
border-info, border-info-light, border-info-dark, border-info-muted, border-info-contrast
border-background, border-background-light, border-background-dark, border-background-muted, border-background-contrast
border-foreground, border-foreground-light, border-foreground-dark, border-background-muted, border-foreground-contrast
```

### **Advanced: Color Utilities with Data Attributes**

**Note: These are for internal use and advanced scenarios. Prefer direct color classes above.**

#### Context-Aware Color Utilities

```css
bg-color          /* Uses --color CSS variable */
bg-color-light    /* Uses --color-light CSS variable */
bg-color-lighter  /* Uses --color-lighter CSS variable */
bg-color-dark     /* Uses --color-dark CSS variable */
bg-color-muted    /* Uses --color-muted CSS variable */
bg-color-contrast       /* Uses --color-contrast CSS variable */

text-color        /* Uses --color CSS variable */
text-color-light  /* Uses --color-light CSS variable */
text-color-lighter /* Uses --color-lighter CSS variable */
text-color-dark   /* Uses --color-dark CSS variable */
text-foreground-muted  /* Uses --color-muted CSS variable */
text-color-contrast     /* Uses --color-contrast CSS variable */

border-color      /* Uses --color CSS variable */
border-color-light /* Uses --color-light CSS variable */
border-color-lighter /* Uses --color-lighter CSS variable */
border-color-dark /* Uses --color-dark CSS variable */
border-color-muted /* Uses --color-muted CSS variable */
border-color-contrast   /* Uses --color-contrast CSS variable */
```

#### Data Attributes for Color Context

```html
<div data-color="primary">
	<button class="bg-color text-color-contrast">Primary Button</button>
</div>

<div data-color="danger">
	<button class="bg-color text-color-contrast">Danger Button</button>
</div>

<div data-color="background">
	<div class="bg-color border-color-lighter">Background Card</div>
</div>
```

### Special Utilities

#### Raised Effect

```css
raised-sm    /* Small elevation with border and shadow */
raised-md    /* Medium elevation */
raised-lg    /* Large elevation */
raised-none  /* No elevation */
```

#### Layout Utilities

```css
flex-full    /* flex: 0 0 100% */
h-window     /* height: var(--window-height) */
w-window     /* width: var(--window-width) */
```

#### Direct Child Variant

```css
dc:; /* Targets direct children (& > *) */
```

## Usage Examples

### Primary Component Styling

### Backgrounds with Foreground Text

```html
<div class="bg-background min-h-screen">
	<div class="bg-background-light raised-md border-background-muted rounded-lg border p-6">
		<!-- Use foreground colors for text hierarchy on background surfaces -->
		<h1 class="text-foreground text-2xl font-bold">Main Heading</h1>
		<h2 class="text-foreground-dark text-lg font-semibold">Subheading</h2>
		<p class="text-foreground-muted">Body text with reduced contrast</p>
		<small class="text-foreground-lighter">Secondary information</small>
	</div>
</div>
```

## Best Practices

1. **Use direct semantic color classes**: Prefer `bg-primary`, `text-danger`, etc. as the primary approach
2. **Use foreground colors for text hierarchy**: On background surfaces, use `text-foreground` and its shades for proper text hierarchy
3. **Leverage automatic contrast**: The `contrast` shade provides automatic readable contrast (e.g., `text-primary-contrast` on `bg-primary`)
4. **Background for layouts**: Use `bg-background` for main layout backgrounds and `text-foreground` for text content
5. **Data attributes for advanced cases**: Only use `data-color` attributes and context-aware classes (`bg-color`, `text-color`) for internal library use or complex dynamic scenarios
6. **Color shades for states**: Use `muted` for subtle backgrounds, `light`/`lighter` for borders, `dark` for emphasis

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
  - ghost: Transparent background, shows background on hover
  - link: Text-only styling with underline on hover

- **color**: 'background' | 'primary' | 'secondary' | 'foreground' | 'danger' | 'success' | 'warning' | 'info' (default: 'foreground')

  - Determines the color scheme of the button

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: 24px height, smaller padding and text
  - normal: 32px height, standard padding
  - large: 36px height, larger padding and text

### Layout Props

- **fullWidth**: boolean (default: false) - Makes button take full width of container
- **squared**: boolean - Makes button square (aspect-ratio 1:1), auto-determined if only prefix/suffix is provided
- **disabled**: boolean (default: false) - Disables button interaction
- **loading**: boolean (default: false) - Shows loading state and disables interaction

### Link Props

- **href**: string - Makes button render as anchor tag
- **target**: string - Link target (e.g., "\_blank")
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

- **ref**: HTMLElement - Reference to the button element
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

The button follows this DOM structure:
\`\`\`
<Button>
<Prefix /> <!-- Optional prefix content -->
<Children /> <!-- Main button content -->
<Suffix /> <!-- Optional suffix content -->
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
<Icon name="plus" />
{/snippet}
Add Item
</Button>

<Button squared>
	{#snippet prefix()}
		<Icon name="settings" />
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
<Button class="shadow-lg border-2" color="primary" variant="outline">
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

# Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools of the svelte-mcp-server:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
