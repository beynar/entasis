export const imageZoomDescription = `
# ImageZoom

ImageZoom renders an accessible image trigger powered by LightGallery's Medium Zoom plugin. It
animates the source image into a focused full-viewport view while preserving controlled state,
high-resolution sources, slots, focus restoration, and configurable dismissal.

## Usage

\`\`\`svelte
<script>
	import { ImageZoom } from 'svelai/image-zoom';
</script>

<ImageZoom
	src="/photos/desk-thumb.jpg"
	zoomSrc="/photos/desk.jpg"
	zoomWidth={2400}
	zoomHeight={1600}
	alt="Desk setup with a laptop and notebook"
/>
\`\`\`

## Props

- **src**: string - Thumbnail image source. Optional when the children slot renders an image.
- **alt**: string - Accessible image text. Optional when the children slot image has alt text.
- **zoomSrc**: string - Full-size image source. Defaults to \`src\`.
- **zoomWidth / zoomHeight**: number - Intrinsic dimensions of \`zoomSrc\`. Provide both when \`zoomSrc\` differs from the thumbnail so the origin transition and final image use the same rectangle.
- **open**: boolean (bindable, default: false) - Controls the zoom layer.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **disabled**: boolean (default: false) - Prevents opening.
- **width / height / srcset / sizes / loading / decoding** - Forwarded to the thumbnail image.
- **zoomMargin**: number (default: 40) - Minimum viewport margin around the zoomed image.
- Zoom animation duration now comes from the \`motion\` theme slot (default token \`slower\`); see Motion below.
- **closeOnClickOutside**: boolean (default: true) - Closes from the backdrop.
- **closeOnEscape**: boolean (default: true) - Closes on Escape.
- **closeOnScroll**: boolean (default: true) - Closes on wheel, touch-scroll, page scroll, or nested-container scroll.
- **lockScroll**: boolean (default: false) - Locks page scroll while open.
- **buttonLabel**: string (default: "Zoom image") - Accessible trigger label.
- **closeLabel**: string (default: "Close image zoom") - Accessible close/backdrop label.
- **backgroundColor**: string (default: theme background) - CSS color used by the Medium Zoom backdrop.
- **licenseKey**: string (default: LightGallery evaluation key) - LightGallery license key. A production key is required unless the consuming project is GPLv3-compatible.
- **showIndicator**: boolean (default: true) - Toggles the thumbnail zoom indicator.
- **indicatorPosition**: "top-left" | "top-right" | "bottom-left" | "bottom-right" (default: "top-right") - Corner used for the thumbnail zoom indicator.
- **class**: string - Additional root classes.
- **theme**: ImageZoomThemeProps - Per-instance theme overrides.
- **onOpenChange**: (open: boolean) => void - Fired once when the library requests a new open state.
- **onAfterOpen**: (payload) => void - Fired after the open animation completes.
- **onAfterClose**: (payload) => void - Fired after the close animation completes.

## Slots

- **children**: custom thumbnail content. Receives \`ImageZoomPayload\`. When \`src\` or \`alt\` are omitted, ImageZoom reads them from the first child \`img\`.
- **caption**: caption rendered over the zoom layer. Receives \`ImageZoomPayload\`.
- **indicator**: custom thumbnail zoom indicator content. Receives \`ImageZoomPayload\`.

## Accessibility

- The thumbnail trigger is a native \`button type="button"\`.
- LightGallery renders and manages the modal dialog layer.
- Escape closes the dialog by default.
- Page or nested-container scroll closes the dialog by default.
- Focus remains trapped in the zoom layer and returns to the prior control after closing.
- Reduced motion disables the zoom transition.

## Examples

### Controlled

\`\`\`svelte
<script>
	let open = false;
</script>

<ImageZoom bind:open src="/image.jpg" alt="Product detail" />
\`\`\`

### High-resolution zoom source

\`\`\`svelte
<ImageZoom
	src="/image-640.jpg"
	zoomSrc="/image-2400.jpg"
	zoomWidth={2400}
	zoomHeight={1600}
	alt="Architectural detail"
/>
\`\`\`

### Child image source

\`\`\`svelte
<ImageZoom>
	{#snippet children()}
		<img src="/image.jpg" alt="Architectural detail" />
	{/snippet}
</ImageZoom>
\`\`\`

### Caption

\`\`\`svelte
<ImageZoom src="/image.jpg" alt="Mountain ridge">
	{#snippet caption()}
		<span>Shot in the late afternoon.</span>
	{/snippet}
</ImageZoom>
\`\`\`

### Custom indicator

\`\`\`svelte
<ImageZoom src="/image.jpg" alt="Mountain ridge" indicatorPosition="top-left">
	{#snippet indicator()}
		<span>2x</span>
	{/snippet}
</ImageZoom>
\`\`\`

## Motion

- **motion** theme slot: one preset (no variants). Only its resolved \`duration\` is used — it
  becomes LightGallery's zoom animation duration (default token \`slower\`).
- Ladder: \`<Theme components={{ 'image-zoom': { motion } }}>\` → \`setImageZoomTheme({ motion })\`
  → \`theme={{ motion: { duration: 250 } }}\`. Reduced motion collapses it to 0.
`;
