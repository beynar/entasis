export const headingDescription = `
# Heading Component

The Heading component renders semantic heading elements (h1-h6) with consistent styling and additional visual options.

## Basic Usage

\`\`\`svelte
<Heading>Default Heading</Heading>
<Heading size="h1">Main Title</Heading>
<Heading size="h3">Subtitle</Heading>
\`\`\`

## Props

### Core Props
- **size**: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' (default: 'h2')
  - Determines visual size and default semantic element
  
- **as**: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' - Override the rendered HTML element
  - Use when visual size should differ from semantic level

### Visual Props
- **weight**: 'light' | 'normal' | 'bold' (default: 'normal')
  - Font weight of the heading

- **align**: 'left' | 'center' | 'right' (default: 'left')
  - Text alignment

- **underline**: boolean (default: false) - Adds underline decoration

- **muted**: boolean (default: false) - Reduces text opacity for secondary headings

- **balanced**: boolean (default: true) - Enables text-wrap: balance for better line breaks

- **trim**: 'none' | 'start' | 'end' | 'both' (default: 'both')
  - Text trimming for better vertical rhythm

### Content Props
- **children**: Snippet - Heading content

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: HeadingThemeProps - Per-instance theme overrides

## Examples

### Different Heading Levels
\`\`\`svelte
<Heading size="h1">Heading 1</Heading>
<Heading size="h2">Heading 2</Heading>
<Heading size="h3">Heading 3</Heading>
<Heading size="h4">Heading 4</Heading>
<Heading size="h5">Heading 5</Heading>
<Heading size="h6">Heading 6</Heading>
\`\`\`

### Visual vs Semantic Hierarchy
\`\`\`svelte
<!-- Looks like h1 but semantically h2 -->
<Heading size="h1" as="h2">
	Large Visual Heading
</Heading>
\`\`\`

### Font Weights
\`\`\`svelte
<Heading weight="light">Light Heading</Heading>
<Heading weight="normal">Normal Heading</Heading>
<Heading weight="bold">Bold Heading</Heading>
\`\`\`

### Text Alignment
\`\`\`svelte
<Heading align="left">Left Aligned</Heading>
<Heading align="center">Center Aligned</Heading>
<Heading align="right">Right Aligned</Heading>
\`\`\`

### With Underline
\`\`\`svelte
<Heading underline>Underlined Heading</Heading>
\`\`\`

### Muted Heading
\`\`\`svelte
<Heading>Primary Heading</Heading>
<Heading muted>Secondary Muted Heading</Heading>
\`\`\`

### Without Text Balancing
\`\`\`svelte
<Heading balanced={false}>
	This heading won't use text balancing
</Heading>
\`\`\`

### Text Trimming
\`\`\`svelte
<Heading trim="none">No Trim</Heading>
<Heading trim="start">Trim Start</Heading>
<Heading trim="end">Trim End</Heading>
<Heading trim="both">Trim Both</Heading>
\`\`\`

### Page Title Pattern
\`\`\`svelte
<Heading size="h1" weight="bold" trim="both">
	Welcome to Our Site
</Heading>
<Heading size="h3" muted trim="start">
	Discover amazing features
</Heading>
\`\`\`

### Section Headers
\`\`\`svelte
<section>
	<Heading size="h2" underline>
		Features
	</Heading>
	<p>Our amazing features...</p>
</section>

<section>
	<Heading size="h2" underline>
		Pricing
	</Heading>
	<p>Choose your plan...</p>
</section>
\`\`\`

### Custom Styling
\`\`\`svelte
<Heading class="gradient-text" size="h1" weight="bold">
	Gradient Heading
</Heading>
\`\`\`

## Accessibility

- Uses semantic HTML heading elements
- Maintains proper document outline
- \`as\` prop allows visual/semantic separation
- Screen readers announce heading levels correctly

## Notes

- By default, \`size\` determines both visual appearance and HTML element
- Use \`as\` to separate visual size from semantic meaning
- Text balancing improves readability on multiple lines
- Trim helps maintain consistent vertical spacing
- Data attributes are added for all visual props for CSS targeting

## Theme Customization

The Heading component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main heading element styles

### Available Variants

**root**:
- base: Base classes applied to all headings
- Variants:
  - size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' - Text size based on heading level
  - weight: 'normal' | 'bold' | 'light' - Font weight
  - align: 'left' | 'center' | 'right' - Text alignment
  - balanced: boolean - Text balancing (text-wrap: balance)
  - underline: boolean - Underline decoration
  - muted: boolean - Reduced opacity for secondary headings
  - trim: 'none' | 'start' | 'end' | 'both' - Cap/baseline text trimming

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Heading 
  size="h1"
  theme={{
    root: {
      base: 'bg-clip-text',
      size: {
        h1: 'text-5xl font-extrabold'
      }
    }
  }}
>
  Custom Heading
</Heading>
\`\`\`

**Size and Weight Customization**:
\`\`\`svelte
<Heading 
  size="h2"
  weight="bold"
  theme={{
    root: {
      size: {
        h2: 'text-4xl'
      },
      weight: {
        bold: 'font-black'
      }
    }
  }}
>
  Bold Heading
</Heading>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setHeadingTheme } from 'svelai/heading';
  
  setHeadingTheme({
    root: {
      base: 'tracking-tight',
      size: {
        h1: 'text-5xl',
        h2: 'text-4xl',
        h3: 'text-3xl'
      },
      weight: {
        bold: 'font-extrabold'
      }
    }
  });
</script>
\`\`\`
`;
