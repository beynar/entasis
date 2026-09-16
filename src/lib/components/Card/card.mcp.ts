export const cardDescription = `
# Card Component

The Card component is a flexible container component used to display content in a structured, visually distinct card format. It supports multiple sections (header, title, description, action, content, footer) through slots and can be made interactive with links or click handlers.

## Basic Usage

\`\`\`svelte
<Card>
	{#snippet title()}
		Card Title
	{/snippet}
	{#snippet description()}
		Card description text
	{/snippet}
	{#snippet children()}
		Card content goes here
	{/snippet}
</Card>
\`\`\`

## Props

### Core Props
- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' (default: 'neutral')
  - Determines the color scheme of the card

- **variant**: 'solid' | 'outline' | 'soft' | 'ghost' (default: 'solid')
- **elevation**: 1 | 2 | 3 | 4 | 5 (default: 1) - Elevation step a solid card lifts by on the theme's elevation scale; other variants cast no shadow
  - solid: Filled background with shadow (raised effect)
  - outline: Transparent background with colored border
  - soft: Semi-transparent background with color
  - ghost: Transparent background, no border

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Scales the typography only: title (text-sm / text-base / text-lg), description and body text
  - Combine with density to control spacing independently

- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal')
  - Controls paddings and gaps between header/content/footer
  - small: p-3 / gap-3 for dense dashboards
  - normal: p-4 / gap-4 everyday scale
  - large: p-6 / gap-6 roomy marketing/detail surfaces (vega default)

### Layout Props
- **disabled**: boolean (default: false)
  - Disables interactions and applies opacity styling

- **showBorders**: boolean (default: false)
  - Shows edge-to-edge neutral-muted boundaries below the header and above the footer
  - Boundary spacing follows density and is owned by the adjacent header/footer section

### Interactive Props
- **href**: string - Makes the card a link (renders as <a>)
- **target**: string - Link target attribute (e.g., '_blank')
- **rel**: string - Link rel attribute (e.g., 'noopener noreferrer')
- **onclick**: (event: MouseEvent) => void - Native click handler (renders as role="button" with keyboard activation via Enter/Space)
- **onpointerenter**: (event: PointerEvent) => void - Native pointer enter handler
- **onpointerleave**: (event: PointerEvent) => void - Native pointer leave handler

Cards with href or onclick automatically get the internal \`clickable\` styling: pointer cursor, a hover effect matched to the surface (solids lift with a stronger ring and shadow, outline/ghost gain a translucent wash of the card color, soft deepens its tint), a pressed translate, and a keyboard focus ring. No prop needed — it follows from the interactivity.

Interactive descendants stay independent: clicks (and Enter/Space) on buttons, links, form controls, or role="button|link|checkbox|radio|switch|menuitem" elements inside the card never trigger the card's own onclick, and on href cards they don't navigate — only clicks on the card surface itself do.

### Content Props (Slots)
- **header**: Snippet - Custom header content (overrides default header structure)
- **title**: Snippet - Card title text
- **description**: Snippet - Card description text
- **action**: Snippet | ButtonProps - Action button/element (positioned top-right in header)
  - Can be a snippet (custom content) or a ButtonProps object for easy composition
  - When using ButtonProps object, a Button component is automatically rendered
- **content**: Snippet - Custom content (overrides default content structure)
- **footer**: Snippet - Footer content
- **children**: Snippet - Default content (rendered inside content section)

### Styling Props
- **class**: string - Additional CSS classes for the card container
- **ref**: HTMLElement | null - Reference to the card element
- **theme**: CardThemeProps - Custom theme overrides

## Structure

The Card component uses a flexible slot-based structure:

\`\`\`
<Card>
	<!-- Header section (optional) -->
	{#snippet header()}
		<!-- Custom header -->
	{/snippet}
	
	<!-- Or use default header structure -->
	{#snippet title()}
		Title
	{/snippet}
	{#snippet description()}
		Description
	{/snippet}
	{#snippet action()}
		Action button
	{/snippet}
	
	<!-- Content section -->
	{#snippet content()}
		<!-- Custom content -->
	{/snippet}
	
	<!-- Or use children -->
	{#snippet children()}
		Default content
	{/snippet}
	
	<!-- Footer section (optional) -->
	{#snippet footer()}
		Footer content
	{/snippet}
</Card>
\`\`\`

## Examples

### Basic Card
\`\`\`svelte
<Card>
	{#snippet title()}
		Card Title
	{/snippet}
	{#snippet description()}
		This is a description of the card content.
	{/snippet}
	{#snippet children()}
		<p>Card content goes here.</p>
	{/snippet}
</Card>
\`\`\`

### Card with Action Button (Snippet)
\`\`\`svelte
<script lang="ts">
	import { Card } from 'svelai/card';
	import { Button } from 'svelai/button';
	import { dotsThreeVerticalIcon } from 'svelai/icons/dotsThreeVertical';
</script>

<Card>
	{#snippet title()}
		Settings
	{/snippet}
	{#snippet description()}
		Manage your preferences
	{/snippet}
	{#snippet action()}
		<Button variant="ghost" size="small">
			{@render dotsThreeVerticalIcon()}
		</Button>
	{/snippet}
	{#snippet children()}
		<p>Settings content...</p>
	{/snippet}
</Card>
\`\`\`

### Card with Action Button (ButtonProps Object)
\`\`\`svelte
<Card
	action={{
		variant: 'ghost',
		size: 'small',
		children: 'Action'
	}}
>
	{#snippet title()}
		Settings
	{/snippet}
	{#snippet description()}
		Manage your preferences
	{/snippet}
	{#snippet children()}
		<p>Settings content...</p>
	{/snippet}
</Card>
\`\`\`

### Card with Action Button (ButtonProps with onclick)
\`\`\`svelte
<Card
	action={{
		variant: 'ghost',
		size: 'small',
		children: 'Delete',
		color: 'danger',
		onclick: () => console.log('Deleted!')
	}}
>
	{#snippet title()}
		Dangerous Action
	{/snippet}
	{#snippet children()}
		<p>This action cannot be undone.</p>
	{/snippet}
</Card>
\`\`\`

### Interactive Card (Link)
\`\`\`svelte
<Card href="/article/123" target="_blank" rel="noopener">
	{#snippet title()}
		Article Title
	{/snippet}
	{#snippet description()}
		Read more about this topic
	{/snippet}
	{#snippet children()}
		<p>Article preview...</p>
	{/snippet}
</Card>
\`\`\`

### Interactive Card (Click Handler)
\`\`\`svelte
<Card onclick={(event) => console.log(event)} onpointerenter={(event) => console.log(event)}>
	{#snippet title()}
		Clickable Card
	{/snippet}
	{#snippet children()}
		<p>Click me!</p>
	{/snippet}
</Card>
\`\`\`

### Card Variants
\`\`\`svelte
<!-- Solid (default, with raised shadow) -->
<Card variant="solid" color="primary">
	{#snippet children()}
		Solid card with shadow
	{/snippet}
</Card>

<!-- Outline -->
<Card variant="outline" color="primary">
	{#snippet children()}
		Card with border
	{/snippet}
</Card>

<!-- Soft -->
<Card variant="soft" color="primary">
	{#snippet children()}
		Card with muted background
	{/snippet}
</Card>

<!-- Ghost -->
<Card variant="ghost" color="primary">
	{#snippet children()}
		Transparent card
	{/snippet}
</Card>
\`\`\`

### Sizes and Density
\`\`\`svelte
<!-- size scales the typography -->
<Card size="small" title="Small type" />
<Card size="normal" title="Normal type (default)" />
<Card size="large" title="Large type" />

<!-- density scales the paddings and gaps -->
<Card density="compact" title="Dense dashboard card" />
<Card density="normal" title="Everyday card (default)" />
<Card density="comfortable" title="Roomy detail card" />
\`\`\`

### Card with Border Separators
Enable edge-to-edge boundaries between sections using the \`showBorders\` prop.

\`\`\`svelte
<Card showBorders={true}>
	{#snippet title()}
		Title
	{/snippet}
	{#snippet children()}
		Content with border above
	{/snippet}
	{#snippet footer()}
		Footer with border above
	{/snippet}
</Card>
\`\`\`

### Custom Header
\`\`\`svelte
<Card>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h3>Custom Header</h3>
			<Button size="small">Action</Button>
		</div>
	{/snippet}
	{#snippet children()}
		Content
	{/snippet}
</Card>
\`\`\`

### Disabled Card
\`\`\`svelte
<Card disabled={true}>
	{#snippet title()}
		Disabled Card
	{/snippet}
	{#snippet children()}
		This card is disabled
	{/snippet}
</Card>
\`\`\`

## Accessibility

- When \`href\` is provided, the card renders as an \`<a>\` element with \`role="link"\`
- When \`onclick\` is provided without \`href\`, the card renders as a \`<div>\` with \`role="button"\`
- Disabled cards have \`pointer-events-none\` and reduced opacity
- The card uses semantic HTML structure with data attributes for styling hooks

## Notes

- The \`solid\` variant draws a \`ring-neutral-muted\` hairline and lifts by \`elevation\` (\`lift-1\` … \`lift-5\`) on the theme's elevation scale
- Header uses CSS Grid with container queries (@container) for responsive layout
- Action slot is automatically positioned top-right when present (via \`hasAction\` variant)
- Borders are optional and can be enabled with \`showBorders={true}\` (subtle neutral-muted, 1px)
- All slots are optional - the card adapts to missing sections
- \`children\` slot is rendered inside the content section by default
- Custom \`header\` or \`content\` slots override the default structure

## Theme Customization

The Card component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main card container styles
- **header**: Card header section styles
- **title**: Card title text styles
- **description**: Card description text styles
- **action**: Action button/element styles
- **content**: Card content section styles
- **footer**: Card footer section styles

### Theme Type Definition

\`\`\`typescript
import type { CardThemeProps } from 'svelai/card';

// Example theme customization
const customTheme: CardThemeProps = {
  root: {
    base: 'custom-base-classes',
    size: {
      small: 'py-2 gap-2',
      normal: 'py-4 gap-4',
      large: 'py-6 gap-6'
    },
		color: {
			primary: 'bg-primary text-primary-contrast',
			neutral: 'bg-neutral text-neutral-contrast'
		},
    variant: {
      solid: 'bg-color border-color lift-1',
      outline: 'bg-transparent border-color'
    }
  },
  header: {
    density: {
      compact: 'px-2 gap-1',
      normal: 'px-4 gap-2',
      comfortable: 'px-6 gap-3'
    },
    hasAction: {
      true: 'grid-cols-[1fr_auto]',
      false: ''
    }
  },
  title: {
    size: {
      small: 'text-sm',
      normal: 'text-base',
      large: 'text-lg'
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes applied to all cards
- Variants:
  - size: 'small' | 'normal' | 'large' - Typography scale
  - density: 'compact' | 'normal' | 'comfortable' - Padding and gap spacing
  - color: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Color scheme
  - variant: 'solid' | 'outline' | 'soft' | 'ghost' - Visual style variant
  - clickable: boolean - Internal; set automatically when href/onclick is present (hover, press, focus ring)
  - disabled: boolean - Disabled state styling

**header**:
- base: Base classes for header container
- Variants:
  - size: 'small' | 'normal' | 'large' - Padding and gap spacing
  - hasAction: boolean - Grid layout when action is present
  - hasBorder: boolean - Border styling
  - variant: 'solid' | 'outline' | 'soft' | 'ghost' - Inherited from card

**title**:
- base: Base classes for title text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - variant: 'solid' | 'outline' | 'soft' | 'ghost' - Text color based on card variant

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - variant: 'solid' | 'outline' | 'soft' | 'ghost' - Text color based on card variant

**action**:
- base: Base classes for action element (positioned top-right)

**content**:
- base: Base classes for content section
- Variants:
  - size: 'small' | 'normal' | 'large' - Horizontal padding
  - hasBorder: boolean - Border styling
  - hasBorderTop: boolean - Top border
  - hasBorderBottom: boolean - Bottom border

**footer**:
- base: Base classes for footer section
- Variants:
  - size: 'small' | 'normal' | 'large' - Padding and gap spacing
  - hasBorder: boolean - Border styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Card 
  theme={{
    root: {
      base: 'border-2 border-dashed',
      variant: {
        solid: 'raised-5'
      }
    },
    title: {
      size: {
        large: 'text-2xl font-bold'
      }
    }
  }}
>
  {#snippet title()}
    Custom Styled Card
  {/snippet}
</Card>
\`\`\`

**Color and Variant Customization**:
\`\`\`svelte
<Card 
  color="primary"
  variant="outline"
  theme={{
    root: {
      variant: {
        outline: 'border-4 border-primary/50 bg-primary/5'
      }
    },
    content: {
      density: {
        comfortable: 'px-8 py-6'
      }
    }
  }}
>
  {#snippet children()}
    Custom outline card
  {/snippet}
</Card>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setCardTheme } from 'svelai/card';
  
  setCardTheme({
    root: {
      base: 'rounded-2xl transition-all duration-300',
      variant: {
        solid: 'raised-4 hover:raised-5',
        outline: 'border-2 hover:border-opacity-80'
      }
    },
    header: {
      density: {
        normal: 'px-6 gap-3'
      }
    }
  });
</script>
\`\`\`
`;
