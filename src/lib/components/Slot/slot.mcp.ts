export const slotDescription = `
# Slot Component

The Slot component is a utility for rendering dynamic content - it can render snippets, strings, numbers, or other components with proper handling and props passing.

## Basic Usage

\`\`\`svelte
<Slot render={content} />
\`\`\`

## Props

### Core Props
- **render**: Slot - Content to render (can be string, number, Snippet, or component)
- **class**: string - CSS class to apply to the wrapper

## Slot Type

The Slot type accepts:
- **string** - Rendered as text
- **number** - Rendered as text
- **Snippet** - Rendered as a Svelte snippet with props
- **Component** - Rendered as a Svelte component

## Examples

### Render String
\`\`\`svelte
<Slot render="Hello World" />
\`\`\`

### Render Number
\`\`\`svelte
<Slot render={42} />
\`\`\`

### Render Snippet
\`\`\`svelte
{#snippet content()}
	<strong>Bold Text</strong>
{/snippet}

<Slot render={content} />
\`\`\`

### Render Snippet
\`\`\`svelte
{#snippet greeting()}
	<h1>Hello World!</h1>
{/snippet}

<Slot render={greeting} />
\`\`\`

### With CSS Class
\`\`\`svelte
<Slot 
	render={content}
	class="text-primary font-bold"
/>
\`\`\`

### Conditional Rendering
\`\`\`svelte
<script>
	let content = condition ? 'Yes' : 'No';
</script>

<Slot render={content} />
\`\`\`

### In Component Props
\`\`\`svelte
<script lang="ts">
	import { Slot, type SlotContent } from 'svelai/slot';

	let { title, description }: { title: SlotContent; description: SlotContent } = $props();
</script>

<div class="card">
	<Slot render={title} class="card-title" />
	<Slot render={description} class="card-description" />
</div>
\`\`\`

### Dynamic Icon
\`\`\`svelte
<script>
	let icon = condition ? checkIcon : xIcon;
</script>

<Slot render={icon} class="icon" />
\`\`\`

## Use Cases

### 1. Flexible Component Props
Allow component users to pass either static content or dynamic snippets:

\`\`\`svelte
<Button>
	<Slot render={label} />
</Button>
\`\`\`

### 2. Conditional Content
Render different content types based on runtime conditions:

\`\`\`svelte
<Slot render={isLoading ? 'Loading...' : data} />
\`\`\`

### 3. List Rendering
Render items with flexible content:

\`\`\`svelte
{#each items as item}
	<Slot render={item.label} />
{/each}
\`\`\`

## Notes

- Automatically handles different content types
- Safely renders null/undefined as empty
- Class is applied to the wrapper element
- Useful for building flexible, reusable components
`;
