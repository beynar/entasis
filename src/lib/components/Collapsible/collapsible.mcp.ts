export const collapsibleDescription = `
# Collapsible Component

The Collapsible component provides a way to show and hide content with a toggle trigger. It supports both controlled and uncontrolled modes, keyboard navigation, and smooth slide transitions.

## Basic Usage

\`\`\`svelte
<Collapsible>
	{#snippet trigger()}
		Click to expand
	{/snippet}
	This content will be shown when expanded.
</Collapsible>
\`\`\`

## Props

### Core Props
- **open**: boolean (optional)
  - Current bindable disclosure state.

- **defaultOpen**: boolean (default: false)
  - Initial open state when \`open\` is omitted.
  - Ignored when \`open\` prop is provided.

- **disabled**: boolean (default: false)
  - Disables the collapsible trigger and prevents toggling.
  - Applies opacity styling and removes pointer events.

- **onOpenChange**: (open: boolean) => void (optional)
  - Callback fired once after a component-owned open state change.
  - Receives the new open state as parameter.

### Layout Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Controls padding and text size of trigger and content.
  - small: Reduced padding (py-2 px-2) and text-sm
  - normal: Standard padding (py-3 px-4) and text-base
  - large: Increased padding (py-4 px-6) and text-lg

- **icon**: 'chevron' | 'plus-minus' | 'none' | Snippet (default: 'chevron')
  - Disclosure indicator rendered in the trigger.
  - chevron: rotating chevron; plus-minus: plus/minus glyph; none: no indicator.
  - Pass a snippet (it receives \`{ open }\`) for a custom icon.

### Content Props (Slots)
- **trigger**: Snippet - Content rendered in the toggle button
  - Required for the component to function
  - Typically contains text, icons, or both

- **children**: Snippet<{ open: boolean }> - Content shown when expanded
  - Rendered inside the content container with a slide transition
  - Receives the current \`open\` state as a payload

### Advanced Props
- **theme**: CollapsibleThemeProps - Theme configuration overrides
  - Allows customizing styles for container, trigger, and content parts

## Examples

### Example 1 - Uncontrolled
\`\`\`svelte
<script lang="ts">
	import { Collapsible } from 'svelai/collapsible';
	import { caretDownIcon } from 'svelai/icons/caretDown';
</script>

<Collapsible defaultOpen={false} icon="none">
	{#snippet trigger()}
		<span>Toggle Content</span>
		{@render caretDownIcon()}
	{/snippet}
	<p>This content can be toggled.</p>
</Collapsible>
\`\`\`

### Example 2 - Controlled
\`\`\`svelte
<script>
	let open = false;
</script>

<Collapsible bind:open={open} onOpenChange={(open) => console.log('State:', open)}>
	{#snippet trigger()}
		Toggle (Currently: {open ? 'Open' : 'Closed'})
	{/snippet}
	<p>Controlled content</p>
</Collapsible>
\`\`\`

### Example 3 - Explicit Children Snippet
\`\`\`svelte
<Collapsible>
	{#snippet trigger()}
		Show Details
	{/snippet}
	{#snippet children({ open })}
		<p>This panel is {open ? 'open' : 'closed'}.</p>
		<ul>
			<li>Item 1</li>
			<li>Item 2</li>
		</ul>
	{/snippet}
</Collapsible>
\`\`\`

### Example 4 - Disabled State
\`\`\`svelte
<Collapsible disabled={true}>
	{#snippet trigger()}
		Disabled Collapsible
	{/snippet}
	This content cannot be toggled.
</Collapsible>
\`\`\`

### Example 5 - Different Sizes
\`\`\`svelte
<Collapsible size="small">
	{#snippet trigger()}
		Small Collapsible
	{/snippet}
	Small content
</Collapsible>

<Collapsible size="large">
	{#snippet trigger()}
		Large Collapsible
	{/snippet}
	Large content
</Collapsible>
\`\`\`

## Structure

The component renders:
- A container \`<div>\` with data attributes for state
- A trigger \`<button>\` with ARIA attributes
- A content \`<div>\` with slide transition (only when open)

## Accessibility

- **ARIA Attributes**:
  - \`aria-expanded\` on trigger indicates open/closed state
  - \`aria-controls\` links trigger to content element
  - \`data-state\` attribute provides state information for styling

- **Keyboard Support**:
  - **Enter** or **Space**: Toggles the collapsible
  - Focus management handled by browser default behavior

- **Semantic HTML**:
  - Uses \`<button>\` element for trigger (proper focus and keyboard handling)
  - Content is hidden from accessibility tree when closed

## Notes

- The component uses Svelte's built-in \`slide\` transition with a 200ms duration.
- When \`open\` prop is provided, the component is controlled. Otherwise, it manages its own state.
- Content is completely removed from DOM when closed (not just hidden) for better performance.

## Theme Customization

The Collapsible component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main collapsible container styles
- **trigger**: Toggle trigger button styles
- **content**: Collapsible content panel styles
- **icon**: Expand/collapse icon styles

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - size: 'small' | 'normal' | 'large' - Container size

**trigger**:
- base: Base classes for trigger button
- Variants:
  - size: 'small' | 'normal' | 'large' - Trigger padding and text size
  - disabled: boolean - Disabled state styling

**content**:
- base: Base classes for content panel
- Variants:
  - size: 'small' | 'normal' | 'large' - Content gap and text size

**icon**:
- base: Base classes for expand/collapse icon
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Collapsible 
  theme={{
    root: {
      base: 'w-full'
    },
    trigger: {
      base: 'flex items-center justify-between w-full',
      size: {
        normal: 'px-4 py-2'
      }
    }
  }}
>
  {#snippet trigger()}
    Toggle
  {/snippet}
  Content
</Collapsible>
\`\`\`

**Custom Trigger Styling**:
\`\`\`svelte
<Collapsible 
  theme={{
    trigger: {
      base: 'state-layer rounded-lg transition-colors',
      size: {
        large: 'px-6 py-4 text-lg'
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed'
      }
    },
    icon: {
      size: {
        normal: 'size-5'
      }
    }
  }}
>
  {#snippet trigger()}
    Custom Trigger
  {/snippet}
  Content
</Collapsible>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setCollapsibleTheme } from 'svelai/collapsible';
  
  setCollapsibleTheme({
    root: {
      base: 'w-full flex flex-col'
    },
    trigger: {
      base: 'transition-all hover:opacity-80',
      size: {
        normal: 'px-2 py-2 text-sm'
      }
    },
    content: {
      size: {
        normal: 'gap-2 mt-2'
      }
    }
  });
</script>
\`\`\`

## Motion

- **motion** theme slot, keyed by \`variant\`: \`default\` slides the content open on the y axis,
  \`peek\` animates its clip height on \`slow\` / \`enter\`.
- Ladder: \`<Theme components={{ collapsible: { motion } }}>\` → \`setCollapsibleTheme({ motion })\`
  → \`theme.motion\` → the \`transition\` prop. Reduced motion collapses it to 0.
`;
