export const accordionDescription = `
# Accordion Component

The Accordion component provides an interactive collapsible container for organizing content. It supports single or multiple expanded items, various visual styles, and customizable transitions.

## Basic Usage

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
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
- **disabledKey**: string - Key whose boolean disables one item (default: 'disabled')
- **disabled**: boolean (default: false) - Disables every item
- **headingLevel**: 2 | 3 | 4 | 5 | 6 (default: 3) - Level of the heading element that wraps each trigger

### Layout Props
- **variant**: 'classic' | 'card' | 'outline' (default: 'classic')
  - classic: flat rows separated by a muted border (nova/shadcn look) — the title underlines on hover, the chevron rotates
  - card: the rows wrapped in a raised surface (rows inset with px-4)
  - outline: the rows wrapped in a muted border (rows inset with px-4)

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Scales typography only: title, description and content text sizes plus the icon size. Spacing is controlled by density.

- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal')
  - Scales paddings and gaps only: trigger vertical padding, content bottom padding, header gap, and the gap between splitted items. Combine freely with size.

- **splitted**: boolean (default: false) - Breaks the list into one surface per item with a gap: each item gets its own raised card (card), its own border (outline), or its own underline (classic)

### Event Props
- **onValueChange**: (value: string[]) => void - Called once after the expanded item ids change, with the new ids. Not called for initialization or for ids a parent assigns.
- **onItemOpenChange**: (payload: { item: Item; index: number; open: boolean; details: OpenChangeDetails }) => void - Called before one item opens or closes. \`details.reason\` is \`'trigger-press'\` or \`'find-in-page'\`, \`details.event\` carries the DOM event, and \`details.cancel()\` keeps the item as it was (\`onValueChange\` is then not called). See \`entasis/types\` for \`OpenChangeDetails\`.
- **onItemAfterOpen**: (payload: { item: Item; index: number }) => void - Called once each time an item finishes opening: after its slide, or at once when no animation plays (reduced motion, zero duration, find-in-page). Not called for items open at the start.
- **onItemAfterClose**: (payload: { item: Item; index: number }) => void - Called once each time an item finishes closing, also when no animation plays or the panel is removed mid-close.

### Slot Props
- **title**: Snippet - Custom title rendering
- **description**: Snippet - Custom description rendering
- **content**: Snippet - Custom content rendering
- **icon**: Snippet - Custom icon rendering

### Behavior Props
- **oneAtATime**: boolean (default: true) - Whether only one item can be expanded at a time
- **hiddenUntilFound**: boolean (default: false) - Keeps collapsed panels in the DOM under \`hidden="until-found"\`, so the browser's find-in-page, text fragments and \`#id\` links reach their content and open the item (reason \`find-in-page\`, no animation). Collapsed content stays out of the accessibility tree and the tab order until then. A disabled item is not findable: its collapsed panel stays under plain \`hidden\`.
- **keepMounted**: boolean (default: false) - Keeps collapsed panels mounted under \`hidden\`, preserving their state (form values, scroll). Not findable by the browser.

### Visual Props
- **icon**: 'chevron' | 'plus-minus' | 'none' | Snippet (default: 'chevron')
  - chevron: Down chevron that rotates
  - plus-minus: Plus/minus glyph
  - none: Hide the indicator
  - Custom snippet for custom icons

- **transition**: ResponsiveProps<FSOProps> - Slide transition override for the expanded content; beats the \`motion\` theme slot

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Accordion>
	<AccordionItem>
		<Heading>                       <!-- h2 to h6, headingLevel -->
			<AccordionTrigger>          <!-- button: id, aria-expanded, aria-controls, data-index -->
				<AccordionHeader>
					<Title />
					<Description />
				</AccordionHeader>
				<Icon />
			</AccordionTrigger>
		</Heading>
		<AccordionContent />            <!-- region: id, aria-labelledby the trigger -->
	</AccordionItem>
</Accordion>
\`\`\`

The heading wraps the button, as the WAI-ARIA accordion pattern asks, so assistive technology lists the headings. A collapsed item has no panel in the DOM unless \`hiddenUntilFound\` or \`keepMounted\` is set, so its content is neither read nor tabbable; \`aria-controls\` is present while the panel exists.

## Examples

### Basic Example

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
	
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
	import { Accordion } from 'entasis/accordion';
	
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
	import { Accordion } from 'entasis/accordion';
	
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
	import { Accordion } from 'entasis/accordion';
	
	let items = [
		{ title: 'Item 1', content: 'Content 1' }
	];
</script>

<!-- Default flat look -->
<Accordion {items} />

<!-- Raised card container -->
<Accordion variant="card" {items} />

<!-- Bordered container -->
<Accordion variant="outline" {items} />

<!-- One surface per item -->
<Accordion variant="card" splitted {items} />
\`\`\`

### Different Icons

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
	import { starIcon } from 'entasis/icons/star';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' }
	];
</script>

<!-- Chevron icon -->
<Accordion icon="chevron" {items} />

<!-- Plus/minus icon -->
<Accordion icon="plus-minus" {items} />

<!-- Custom icon (a snippet, no payload) -->
<Accordion {items}>
	{#snippet icon()}
		{@render starIcon()}
	{/snippet}
</Accordion>
\`\`\`

### With Custom Keys

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
	
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

### Find-in-page and disabled items

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';

	let items = [
		{ title: 'Shipping', content: 'Orders ship within two days.' },
		{ title: 'Returns', content: 'Free returns for 30 days.', disabled: true }
	];
</script>

<!-- Ctrl+F finds "two days" and opens Shipping; Returns is skipped by Tab. -->
<Accordion {items} hiddenUntilFound />
\`\`\`

### With Event Handler

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
	
	let items = [
		{ title: 'Section 1', content: 'Content 1' }
	];
	
	function handleToggle({ item, index, open, details }) {
		console.log(\`Item \${item.title} at index \${index} is opening: \${open} (\${details.reason})\`);
		// details.cancel() would keep it as it was.
	}
</script>

<Accordion 
	{items}
	onItemOpenChange={handleToggle}
/>
\`\`\`

### Custom Content Rendering

\`\`\`svelte
<script>
	import { Accordion } from 'entasis/accordion';
	
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

- Each trigger is a native \`<button>\` inside a heading element (\`headingLevel\`), with \`aria-expanded\` and, while its panel exists, \`aria-controls\`.
- Each panel is a \`role="region"\` labelled by its trigger.
- Enter and Space toggle an item. Tab moves between triggers and into open content; arrow, Home and End keys are left to the page (they neither move focus nor block scrolling), following the current WAI-ARIA guidance.
- A disabled item's trigger has the native \`disabled\` attribute: it is skipped by Tab and announced as unavailable.
- Collapsed content is not copied anywhere for screen readers. Use \`hiddenUntilFound\` to make it findable.
- Migration: the \`accessible\` prop is removed (collapsed content is no longer duplicated into screen-reader-only text).

## Notes

- Items are automatically assigned IDs if not provided
- Expanded ids are tracked by the component itself; there is no builder dependency
- Panels animate their height through the shared disclosure panel (\`--disclosure-panel-height\` is set on the panel)
- Styling hooks: \`data-open\` / \`data-closed\` on the item, trigger and content, \`data-disabled\`, \`data-index\`, and \`data-entering\` / \`data-exiting\` on the panel
- Supports bindable items for dynamic updates

## Theme Customization

The Accordion component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main accordion container styles
- **item**: Individual accordion item styles
- **trigger**: Accordion trigger button styles
- **heading**: The \`h2\`-\`h6\` element that wraps each trigger (margin-free by default)
- **header**: Header section styles (contains title and description, inside the trigger)
- **title**: Title text styles
- **description**: Description text styles
- **icon**: Expand/collapse icon styles
- **content**: Content styles, on the element inside the region panel (so a hidden-until-found panel reserves no space)

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'compact' | 'normal' | 'comfortable' - Gap between splitted items (via compounds)
  - variant: 'classic' | 'card' | 'outline' - Container surface (raised / bordered / none)
  - splitted: boolean - Gap layout for per-item surfaces

**item**:
- base: Base classes for individual items (muted separator when not splitted; own surface when splitted)
- Variants:
  - size: 'small' | 'normal' | 'large' - Item size
  - density: 'compact' | 'normal' | 'comfortable'
  - variant: 'classic' | 'card' | 'outline' - Per-item surface when splitted
  - splitted: boolean
  - expanded: boolean - Expanded state styling

**trigger**:
- base: Base classes for trigger button
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'compact' | 'normal' | 'comfortable' - Vertical padding
  - variant: 'classic' | 'card' | 'outline' - Horizontal inset on contained variants

**header**:
- base: Base classes for header section
- Variants:
  - size: 'small' | 'normal' | 'large'
  - density: 'compact' | 'normal' | 'comfortable' - Gap between title and description

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
  - density: 'compact' | 'normal' | 'comfortable' - Bottom padding
  - variant: 'classic' | 'card' | 'outline' - Horizontal inset on contained variants

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
  import { setAccordionTheme } from 'entasis/accordion';

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

## Motion

- **motion** theme slot: the panel's height animation. \`duration\`, \`delay\` and \`easing\` apply; the preset's slide offsets and opacity do not (panels collapse along their height only).
- Takes \`in\` / \`out\` params plus a \`duration\` / \`easing\` motion token.
- Ladder: \`<Theme components={{ accordion: { motion } }}>\` → \`setAccordionTheme({ motion })\` →
  \`theme.motion\` → the \`transition\` prop. Reduced motion collapses it to 0.
`;
