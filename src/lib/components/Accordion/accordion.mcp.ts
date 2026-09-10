export const accordionDescription = `
# Accordion Component

The Accordion component provides an interactive collapsible container for organizing content. It supports single or multiple expanded items, various visual styles, and customizable transitions.

## Basic Usage

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
</script>

<Accordion 
	items={[
		{ title: 'Section 1', content: 'Content 1' },
		{ title: 'Section 2', content: 'Content 2' }
	]}
/>
\`\`\`

## Props

### Core Props
- **items**: Array<Item> (bindable) - Array of accordion items to display
- **value**: string[] (bindable) - Expanded item ids
- **defaultValue**: string[] - Initially expanded item ids when value is omitted
- **titleKey**: string - Key to extract title from items (default: 'title')
- **contentKey**: string - Key to extract content from items (default: 'content')
- **descriptionKey**: string - Key to extract description from items (default: 'description')

### Layout Props
- **variant**: 'classic' | 'card' | 'outlined' (default: 'classic')
  - classic: flat rows separated by a muted border (nova/shadcn look) — the title underlines on hover, the chevron rotates
  - card: the rows wrapped in a raised surface (rows inset with px-4)
  - outlined: the rows wrapped in a muted border (rows inset with px-4)

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Scales typography only: title, description and content text sizes plus the icon size. Spacing is controlled by density.

- **density**: 'small' | 'normal' | 'large' (default: 'normal')
  - Scales paddings and gaps only: trigger vertical padding, content bottom padding, header gap, and the gap between splitted items. Combine freely with size.

- **splitted**: boolean (default: false) - Breaks the list into one surface per item with a gap: each item gets its own raised card (card), its own border (outlined), or its own underline (classic)

### Event Props
- **onValueChange**: (value: string[]) => void - Called once when expanded item ids change
- **onToggle**: (options: { item: Item; index: number; open: boolean }) => void - Callback when item is toggled

### Slot Props
- **title**: Snippet - Custom title rendering
- **description**: Snippet - Custom description rendering
- **content**: Snippet - Custom content rendering
- **icon**: Snippet - Custom icon rendering

### Behavior Props
- **oneAtATime**: boolean (default: true) - Whether only one item can be expanded at a time

### Visual Props
- **icon**: 'chevron' | 'math' | Snippet | false (default: 'chevron')
  - chevron: Down chevron that rotates
  - math: Plus/minus icon
  - Custom snippet for custom icons
  - false: Hide icon

- **transitions**: SlideTransitionProps - Transition configuration for accordion content

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Accordion>
	<AccordionItem>
		<AccordionTrigger>
			<AccordionHeader>
				<Title />
				<Description />
			</AccordionHeader>
			<Icon />
		</AccordionTrigger>
		<AccordionContent />
	</AccordionItem>
</Accordion>
\`\`\`

## Examples

### Basic Example

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let items = [
		{ title: 'What is Svelte?', content: 'Svelte is a radical new approach to building user interfaces.' },
		{ title: 'Why use Svelte?', content: 'Svelte offers better performance and smaller bundle sizes.' }
	];
</script>

<Accordion {items} />
\`\`\`

### Multiple Expanded Items

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' },
		{ title: 'Section 2', content: 'Content 2' }
	];
</script>

<Accordion 
	{items}
	oneAtATime={false}
/>
\`\`\`

### Advanced Example

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	import { Icon } from 'svelai/icons';
	
	let items = [
		{ 
			title: 'Getting Started',
			description: 'Learn the basics',
			content: 'Start by installing Svelte...'
		}
	];
</script>

<Accordion {items} />
\`\`\`

### Different Variants

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let items = [
		{ title: 'Item 1', content: 'Content 1' }
	];
</script>

<!-- Default flat look -->
<Accordion {items} />

<!-- Raised card container -->
<Accordion variant="card" {items} />

<!-- Bordered container -->
<Accordion variant="outlined" {items} />

<!-- One surface per item -->
<Accordion variant="card" splitted {items} />
\`\`\`

### Different Icons

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	import { Icon } from 'svelai/icons';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' }
	];
</script>

<!-- Chevron icon -->
<Accordion icon="chevron" {items} />

<!-- Math (+/-) icon -->
<Accordion icon="math" {items} />

<!-- Custom icon -->
<Accordion {items}>
	{#snippet icon({ open })}
		<Icon name={open ? 'minus' : 'plus'} />
	{/snippet}
</Accordion>
\`\`\`

### With Custom Keys

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let faqs = [
		{ question: 'How to install?', answer: 'Run npm install...' }
	];
</script>

<Accordion 
	items={faqs}
	titleKey="question"
	contentKey="answer"
/>
\`\`\`

### With Event Handler

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' }
	];
	
	function handleToggle({ item, index, open }) {
		console.log(\`Item \${item.title} at index \${index} is now \${open ? 'open' : 'closed'}\`);
	}
</script>

<Accordion 
	{items}
	onToggle={handleToggle}
/>
\`\`\`

### Custom Content Rendering

\`\`\`svelte
<script>
	import { Accordion } from 'svelai/accordion';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' }
	];
</script>

<Accordion {items}>
	{#snippet title({ item })}
		<strong>{item.title}</strong>
	{/snippet}
	
	{#snippet content({ item })}
		<div class="p-4">
			{@html item.content}
		</div>
	{/snippet}
</Accordion>
\`\`\`

## Accessibility

- Automatically handles ARIA attributes
- Keyboard navigation support (Enter/Space to toggle)
- Focus management for expanded items
- Screen reader friendly with proper roles

## Notes

- Items are automatically assigned IDs if not provided
- Uses Melt UI's Accordion builder for accessibility
- Smooth transitions with Svelte's slide transition
- Supports bindable items for dynamic updates

## Theme Customization

The Accordion component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main accordion container styles
- **item**: Individual accordion item styles
- **trigger**: Accordion trigger button styles
- **header**: Header section styles (contains title and description)
- **title**: Title text styles
- **description**: Description text styles
- **icon**: Expand/collapse icon styles
- **content**: Content panel styles

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'small' | 'normal' | 'large' - Gap between splitted items (via compounds)
  - variant: 'classic' | 'card' | 'outlined' - Container surface (raised / bordered / none)
  - splitted: boolean - Gap layout for per-item surfaces

**item**:
- base: Base classes for individual items (muted separator when not splitted; own surface when splitted)
- Variants:
  - size: 'small' | 'normal' | 'large' - Item size
  - density: 'small' | 'normal' | 'large'
  - variant: 'classic' | 'card' | 'outlined' - Per-item surface when splitted
  - splitted: boolean
  - expanded: boolean - Expanded state styling

**trigger**:
- base: Base classes for trigger button
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'small' | 'normal' | 'large' - Vertical padding
  - variant: 'classic' | 'card' | 'outlined' - Horizontal inset on contained variants

**header**:
- base: Base classes for header section
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'small' | 'normal' | 'large' - Gap between title and description

**title**:
- base: Base classes for title text (underlines on trigger hover)
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**icon**:
- base: Base classes for expand/collapse icon (muted, rotates for the chevron)
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

**content**:
- base: Base classes for content panel
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - density: 'small' | 'normal' | 'large' - Bottom padding
  - variant: 'classic' | 'card' | 'outlined' - Horizontal inset on contained variants

### Usage Examples

**Bordered look (composition)**:
\`\`\`svelte
<Accordion
  items={items}
  class="rounded-lg border border-neutral-muted"
  theme={{
    item: { base: 'px-4' },
    content: { base: 'px-4' }
  }}
/>
\`\`\`

**Basic Theme Override**:
\`\`\`svelte
<Accordion
  items={items}
  theme={{
    trigger: {
      base: 'state-layer'
    },
    item: {
      expanded: {
        true: 'bg-primary/5'
      }
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setAccordionTheme } from 'svelai/accordion';

  setAccordionTheme({
    trigger: {
      base: 'transition-colors',
      density: {
        normal: 'px-4 py-3'
      }
    }
  });
</script>
\`\`\`
`;
