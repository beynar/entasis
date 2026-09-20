export const aspectRatioDescription = `
# AspectRatio Component

The AspectRatio component maintains a consistent aspect ratio for its content, ensuring that content scales proportionally regardless of its natural dimensions. This is particularly useful for images, videos, and other media that need to maintain specific proportions.

## Basic Usage

\`\`\`svelte
<AspectRatio ratio="16x9">
	{#snippet children()}
		<img src="/image.jpg" alt="Description" />
	{/snippet}
</AspectRatio>
\`\`\`

## Props

### Core Props
- **ratio**: '2x1' | '2x3' | '16x9' | '4x3' | '1x1' | '3x4' | '3x2' | '9x16' | '1x2' (default: '2x1')
  - Specifies the aspect ratio to maintain
  - '2x1': 2:1 ratio (wide landscape)
  - '2x3': 2:3 ratio (portrait)
  - '16x9': 16:9 ratio (widescreen video)
  - '4x3': 4:3 ratio (traditional display)
  - '1x1': 1:1 ratio (square)
  - '3x4': 3:4 ratio (portrait)
  - '3x2': 3:2 ratio (photo)
  - '9x16': 9:16 ratio (vertical video/phone)
  - '1x2': 1:2 ratio (tall portrait)

### Layout Props
- **class**: string - Additional CSS classes for the aspect ratio container
- **ref**: HTMLElement | null - Reference to the aspect ratio container element

### Content Props (Slots)
- **children**: Snippet - Content to be displayed within the aspect ratio container

### Styling Props
- **theme**: AspectRatioThemeProps - Custom theme overrides

## Structure

The AspectRatio component uses a two-layer structure:

\`\`\`
<div class="relative w-full overflow-hidden aspect-[ratio]" data-aspect-ratio-wrapper="">
	<div class="absolute inset-0 h-full w-full">
		<!-- Your content -->
	</div>
</div>
\`\`\`

The outer container maintains the aspect ratio with overflow hidden to prevent content overflow, while the inner content fills the available space using absolute positioning.

## Examples

### Image with 16:9 Aspect Ratio
\`\`\`svelte
<AspectRatio ratio="16x9">
	{#snippet children()}
		<img src="/hero-image.jpg" alt="Hero" class="h-full w-full object-cover" />
	{/snippet}
</AspectRatio>
\`\`\`

### Square Image Gallery
\`\`\`svelte
<div class="grid grid-cols-3 gap-4">
	{#each images as image}
		<AspectRatio ratio="1x1">
			{#snippet children()}
				<img src={image.src} alt={image.alt} class="h-full w-full object-cover rounded-lg" />
			{/snippet}
		</AspectRatio>
	{/each}
</div>
\`\`\`

### Video Container
\`\`\`svelte
<AspectRatio ratio="16x9">
	{#snippet children()}
		<iframe
			src="https://www.youtube.com/embed/..."
			class="h-full w-full"
			allowfullscreen
		></iframe>
	{/snippet}
</AspectRatio>
\`\`\`

### Portrait Image
\`\`\`svelte
<AspectRatio ratio="3x4">
	{#snippet children()}
		<img src="/portrait.jpg" alt="Portrait" class="h-full w-full object-cover" />
	{/snippet}
</AspectRatio>
\`\`\`

### Vertical Video (9:16)
\`\`\`svelte
<AspectRatio ratio="9x16">
	{#snippet children()}
		<video src="/vertical-video.mp4" class="h-full w-full object-cover" controls></video>
	{/snippet}
</AspectRatio>
\`\`\`

### Card with Fixed Aspect Ratio
\`\`\`svelte
<Card>
	{#snippet title()}
		Card Title
	{/snippet}
	{#snippet children()}
		<AspectRatio ratio="16x9">
			<div class="bg-gradient-to-br from-primary to-secondary flex h-full w-full items-center justify-center">
				<span class="text-primary-contrast text-2xl font-bold">Content</span>
			</div>
		</AspectRatio>
		<p>Card content below the aspect ratio container.</p>
	{/snippet}
</Card>
\`\`\`

### Responsive Aspect Ratio
\`\`\`svelte
<AspectRatio ratio="16x9" class="max-w-4xl">
	{#snippet children()}
		<img src="/responsive-image.jpg" alt="Responsive" class="h-full w-full object-cover" />
	{/snippet}
</AspectRatio>
\`\`\`

## Accessibility

- The component maintains semantic structure without adding unnecessary ARIA attributes
- Ensure images within the component have proper \`alt\` attributes
- Videos should include proper captions and controls

## Notes

- The aspect ratio is maintained using the padding-bottom technique (padding-bottom percentage is calculated from the ratio)
- This ensures compatibility across all browsers and maintains the aspect ratio regardless of content size
- Content inside should use \`object-cover\` or \`object-contain\` classes for images/videos to fill the space properly
- The component uses absolute positioning for the inner content container to ensure proper scaling
- Works well with responsive images and videos
- Can be nested within other components like Card, Dialog, etc.

## Theme Customization

The AspectRatio component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Outer aspect ratio container styles
- **content**: Inner content container styles

### Available Variants

**root**:
- base: Base classes for the outer container (maintains aspect ratio)

**content**:
- base: Base classes for the inner content container (fills the aspect ratio space)

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<AspectRatio 
  ratio="16x9"
  theme={{
    root: {
      base: 'rounded-lg overflow-hidden lift-3'
    },
    content: {
      base: 'bg-gradient-to-br from-primary to-secondary'
    }
  }}
>
  {#snippet children()}
    <img src="/image.jpg" alt="Image" class="h-full w-full object-cover" />
  {/snippet}
</AspectRatio>
\`\`\`

**Custom Container Styling**:
\`\`\`svelte
<AspectRatio 
  ratio="1x1"
  theme={{
    root: {
      base: 'rounded-full border-4 border-primary overflow-hidden'
    },
    content: {
      base: 'p-4 flex items-center justify-center'
    }
  }}
>
  {#snippet children()}
    <div class="text-center">Square Content</div>
  {/snippet}
</AspectRatio>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setAspectRatioTheme } from 'entasis/aspect-ratio';
  
  setAspectRatioTheme({
    root: {
      base: 'rounded-xl overflow-hidden lift-4'
    },
    content: {
      base: 'transition-transform hover:scale-105'
    }
  });
</script>
\`\`\`
`;
