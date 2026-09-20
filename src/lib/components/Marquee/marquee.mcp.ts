export const marqueeDescription = `
# Marquee Component

The Marquee component creates an infinite scrolling animation for displaying content. It automatically duplicates the slot content to create a seamless infinite loop effect and supports customizable speed, direction, fade effects, and pause-on-hover functionality.

## Basic Usage

\`\`\`svelte
<script>
	import { Marquee } from 'entasis/marquee';
	
	const items = [
		{ id: 1, text: 'Item 1' },
		{ id: 2, text: 'Item 2' },
		{ id: 3, text: 'Item 3' }
	];
</script>

<Marquee>
	{#each items as item}
		<div class="px-4 py-2 bg-surface rounded">
			{item.text}
		</div>
	{/each}
</Marquee>
\`\`\`

## Props

### Core Props
- **children**: Snippet (required)
  - Content to display in the marquee
  - Parent component handles iteration over items
  - Content is automatically duplicated based on \`numberOfCopies\`

- **direction**: 'left' | 'up' (default: 'left')
  - \`'left'\`: Horizontal scrolling from right to left
  - \`'up'\`: Vertical scrolling from bottom to top

- **numberOfCopies**: number (default: 2)
  - Minimum number of times to duplicate the content for a seamless loop
  - The component measures the viewport and first copy, then adds copies when the content is too short to cover the viewport continuously
  - The effective count is bounded to 100 copies

### Animation Props
- **speed**: 'fast' | 'normal' | 'slow' | number (default: 'fast')
  - Animation speed control
  - \`'fast'\`: 20 seconds per cycle
  - \`'normal'\`: 40 seconds per cycle
  - \`'slow'\`: 80 seconds per cycle
  - \`number\`: Custom duration in seconds (e.g., \`30\` for 30 seconds)

- **reverse**: boolean (default: false)
  - If true, animation runs in reverse direction
  - For 'left': scrolls left to right
  - For 'up': scrolls top to bottom

- **pauseOnHover**: boolean (default: true)
  - If true, animation pauses when mouse hovers over the marquee
  - If false, animation continues regardless of hover state

### Visual Props
- **fade**: boolean (default: true)
  - If true, applies the shared scroll-fade utility at the marquee edges
  - Uses a static scroll-fade mode because the marquee is clipped animation, not a native scroll container

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Controls spacing between duplicated content copies
  - \`small\`: Compact spacing (gap-2)
  - \`normal\`: Standard spacing (gap-4)
  - \`large\`: Expanded spacing (gap-6)

### Styling Props
- **ref**: HTMLDivElement | null (bindable)
  - Reference to the marquee container

- **class**: string
  - Additional CSS classes for the marquee container

- **innerClass**: string
  - Additional CSS classes for each duplicated copy of the content

- **theme**: MarqueeThemeProps
  - Custom theme overrides for advanced styling

## Examples

### Basic Horizontal Marquee

\`\`\`svelte
<script>
	import { Marquee } from 'entasis/marquee';
	
	const testimonials = [
		{ author: 'John Doe', quote: 'Amazing product!' },
		{ author: 'Jane Smith', quote: 'Highly recommended!' },
		{ author: 'Bob Johnson', quote: 'Best purchase ever!' }
	];
</script>

<Marquee>
	{#each testimonials as item}
		<div class="px-8 py-4 bg-surface rounded-lg">
			<p class="text-lg font-semibold">"{item.quote}"</p>
			<p class="text-sm text-muted">— {item.author}</p>
		</div>
	{/each}
</Marquee>
\`\`\`

### Logo Carousel

\`\`\`svelte
<script>
	import { Marquee } from 'entasis/marquee';
	
	const logos = [
		{ name: 'Company 1', logo: '/logo1.png' },
		{ name: 'Company 2', logo: '/logo2.png' },
		{ name: 'Company 3', logo: '/logo3.png' }
	];
</script>

<Marquee speed="normal" size="large">
	{#each logos as logo}
		<img src={logo.logo} alt={logo.name} class="h-12 w-auto" />
	{/each}
</Marquee>
\`\`\`

### Vertical Marquee

\`\`\`svelte
<Marquee direction="up" class="h-[400px]">
	{#each items as item}
		<div class="px-6 py-4 bg-surface rounded">
			{item.content}
		</div>
	{/each}
</Marquee>
\`\`\`

### With Fade Effect

\`\`\`svelte
<Marquee fade={true}>
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Reverse Direction

\`\`\`svelte
<Marquee reverse={true}>
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Custom Speed

\`\`\`svelte
<Marquee speed={30}>
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Different Sizes

\`\`\`svelte
<!-- Small -->
<Marquee size="small">
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>

<!-- Normal (default) -->
<Marquee size="normal">
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>

<!-- Large -->
<Marquee size="large">
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Custom Number of Copies

\`\`\`svelte
<!-- More copies for smoother appearance -->
<Marquee numberOfCopies={4} speed={30}>
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Disable Pause on Hover

\`\`\`svelte
<Marquee pauseOnHover={false}>
	{#each items as item}
		<div>{item.content}</div>
	{/each}
</Marquee>
\`\`\`

### Combined Effects

\`\`\`svelte
<Marquee 
	fade={true}
	reverse={true}
	speed="slow"
	size="large"
>
	{#each items as item}
		<div class="px-8 py-6 bg-surface rounded-lg">
			{item.content}
		</div>
	{/each}
</Marquee>
\`\`\`

## Structure

The Marquee component renders:
- A container \`<div>\` with overflow hidden and optional scroll-fade utility classes
- Multiple copies of the content (default 2) based on \`numberOfCopies\`
- Each copy has the animation applied independently
- Parent component iterates over items in the slot

## Animation Details

- Uses CSS keyframe animations for smooth GPU-accelerated performance
- Content is duplicated \`numberOfCopies\` times to create seamless infinite scroll
- Animation translates each copy by -100% of its width/height plus gap
- Animation duration is controlled via CSS custom property \`--animation-duration\`
- Pause on hover uses CSS \`animation-play-state\` for instant response
- Reverse mode uses CSS \`direction: reverse\` for the animation

## Accessibility

- Uses \`role="presentation"\` on the container as the marquee is decorative
- Consider providing alternative static content for screen readers
- Ensure sufficient color foreground for text content
- Pause on hover helps users interact with and read content
- Animation is disabled when the user requests reduced motion

## Notes

- Parent component is responsible for iterating over items (similar to Carousel pattern)
- Content is automatically duplicated internally based on \`numberOfCopies\`
- The component uses CSS animations for optimal performance
- Custom speed values are specified in seconds (e.g., \`30\` = 30 seconds per cycle)
- For vertical marquees, ensure the container has a defined height
- Increasing \`numberOfCopies\` creates smoother appearance but uses more DOM elements
- The fade effect uses the shared scroll-fade utility classes

## Theme Customization

The Marquee component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main marquee container styles
- **inner**: Inner scrolling content container styles

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - direction: 'left' | 'up' - Scroll direction
  - size: 'small' | 'normal' | 'large' - Gap between duplicated content
  - fade: boolean - Applies shared scroll-fade utility classes

**inner**:
- base: Base classes for scrolling content
- Variants:
  - direction: 'left' | 'up' - Animation direction
  - size: 'small' | 'normal' | 'large' - Gap size
  - pauseOnHover: boolean - Pause animation on hover
  - reverse: boolean - Reverse animation direction

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Marquee 
  theme={{
    root: {
      base: 'group flex overflow-hidden relative',
      direction: {
        left: 'flex-row'
      },
      size: {
        normal: 'gap-4'
      }
    }
  }}
>
  {#each items as item}
    <div>{item.content}</div>
  {/each}
</Marquee>
\`\`\`

**Custom Animation Styling**:
\`\`\`svelte
<Marquee 
  theme={{
    inner: {
      base: 'flex shrink-0 justify-around whitespace-nowrap',
      direction: {
        left: 'flex-row animate-marquee-left'
      },
      pauseOnHover: {
        true: 'group-hover:[animation-play-state:paused]'
      },
      size: {
        large: 'gap-6'
      }
    }
  }}
>
  {#each items as item}
    <div>{item.content}</div>
  {/each}
</Marquee>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setMarqueeTheme } from 'entasis/marquee';
  
  setMarqueeTheme({
    root: {
      base: 'group flex overflow-hidden relative',
      direction: {
        left: 'flex-row'
      },
      size: {
        normal: 'gap-4'
      }
    },
    inner: {
      base: 'flex shrink-0 justify-around whitespace-nowrap',
      direction: {
        left: 'flex-row animate-marquee-left'
      },
      pauseOnHover: {
        true: 'group-hover:[animation-play-state:paused]'
      }
    }
  });
</script>
\`\`\`
`;
