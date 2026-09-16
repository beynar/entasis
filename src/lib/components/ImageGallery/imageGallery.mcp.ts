export const imageGalleryDescription = `
# ImageGallery

ImageGallery enhances descendant images inside arbitrary HTML. It discovers matching \`img\`
elements, makes them keyboard reachable, and initializes LightGallery against those real elements.
LightGallery provides origin zoom, swipe navigation, thumbnails, pinch zoom, and image panning.

## Usage

\`\`\`svelte
<script>
	import { ImageGallery } from 'svelai/image-gallery';
</script>

<ImageGallery>
	<article>
		<img src="/photos/one.jpg" alt="Mountain lake" title="Morning at the lake" />
		<p>Any HTML can live here.</p>
		<img src="/photos/two.jpg" alt="Forest trail" />
	</article>
</ImageGallery>
\`\`\`

## Image Discovery

Images are discovered from the DOM with \`imageSelector\`, defaulting to \`img\`.

- \`src\` comes from \`img.currentSrc || img.src\`.
- \`alt\` comes from \`img.alt\`.
- The default caption comes from \`img.title || img.alt\`.
- The root attachment initializes LightGallery synchronously with the mounted wrapper and owns teardown.
- There is no \`items\` prop and no high-resolution data attribute contract in v1.

## Props

- **open**: boolean (bindable, default: false) - Controls the zoomed gallery.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **activeIndex**: number (bindable, default: 0) - Controls the active discovered image.
- **imageSelector**: string (default: "img") - Selector used inside the wrapper.
- **disabled**: boolean (default: false) - Prevents image enhancement and opening.
- **zoomMargin**: number (default: 32) - Minimum viewport margin around the zoomed image.
- Zoom animation duration and easing now come from the \`motion\` theme slot (default tokens \`normal\` / \`enter\`); see Motion below.
- **closeOnClickOutside**: boolean (default: true) - Closes from the backdrop.
- **closeOnEscape**: boolean (default: true) - Closes on Escape.
- **lockScroll**: boolean (default: true) - Locks page scroll while open.
- **buttonLabel**: string (default: "Open image gallery") - Accessible label prefix for enhanced images.
- **closeLabel**: string (default: "Close image gallery") - Accessible close button label.
- **previousLabel**: string (default: "Previous image") - Previous control label.
- **nextLabel**: string (default: "Next image") - Next control label.
- **licenseKey**: string (default: LightGallery evaluation key) - LightGallery license key. A production key is required unless the consuming project is GPLv3-compatible.
- **class**: string - Additional root classes.
- **theme**: ImageGalleryThemeProps - Per-instance theme overrides.
- **onOpenChange**: (open: boolean) => void - Fired once when the library requests a new open state.
- **onIndexChange**: ({ index, gallery }) => void - Fired when navigation changes the active image.
- **onAfterOpen**: (payload) => void - Fired after the open animation completes.
- **onAfterClose**: (payload) => void - Fired after the close animation completes.

## Slots

- **children**: arbitrary HTML to render and enhance.
- **caption**: custom caption content. Receives \`ImageGalleryPayload\`.

## Accessibility

- Discovered images receive \`role="button"\`, \`tabindex="0"\`, and an accessible label while mounted.
- Previous attributes are restored when ImageGallery is destroyed or disabled.
- Enter and Space open the gallery from a focused image.
- The zoom layer uses \`role="dialog"\` and \`aria-modal="true"\`.
- Focus moves into the LightGallery dialog after opening and returns to the source image after closing.
- Escape closes the gallery by default.
- LightGallery handles horizontal swipe and drag navigation.
- Wheel, double-click, and two-finger pinch zoom the active image; drag pans while zoomed.
- Static selector mode keeps LightGallery's \`zoomFromOrigin\` animation attached to the exact source image.

## Examples

### Controlled

\`\`\`svelte
<script>
	let open = $state(false);
	let activeIndex = $state(0);
</script>

<button onclick={() => { activeIndex = 1; open = true; }}>
	Open second image
</button>

<ImageGallery bind:open bind:activeIndex>
	<img src="/one.jpg" alt="First image" />
	<img src="/two.jpg" alt="Second image" />
</ImageGallery>
\`\`\`

### Custom caption

\`\`\`svelte
<ImageGallery>
	<img src="/one.jpg" alt="First image" title="Editorial caption" />

	{#snippet caption({ activeImage })}
		<p>{activeImage?.caption}</p>
	{/snippet}
</ImageGallery>
\`\`\`

## Motion

- **motion** theme slot: one preset (no variants). Its resolved \`duration\` / \`easing\` become
  the lightbox's animation duration and CSS easing (default tokens \`normal\` / \`enter\`).
- Ladder: \`<Theme components={{ 'image-gallery': { motion } }}>\` →
  \`setImageGalleryTheme({ motion })\` → \`theme.motion\`. Reduced motion collapses it to 0.
`;
