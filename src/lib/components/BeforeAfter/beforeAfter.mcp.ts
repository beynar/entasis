export const beforeAfterDescription = `
# BeforeAfter Component

Import from \`entasis/before-after\`. Two contents laid one over the other with a draggable divider between them: the before side shows up to the divider, the after side past it.

The divider is a slider. Its value, steps, keys and drags are the Slider's own state, on a range input kept inside the divider, so it is focusable, adjustable by assistive technology, and mirrored in right-to-left.

## Basic Usage

\`\`\`svelte
<script>
	import { BeforeAfter } from 'entasis/before-after';
</script>

<BeforeAfter
	ratio="16x9"
	labels
	before={{ src: '/room-before.jpg', alt: 'The room before the renovation' }}
	after={{ src: '/room-after.jpg', alt: 'The room after the renovation' }}
/>
\`\`\`

## Props

### Content
- **before** (required): \`{ src, alt, srcset?, sizes?, loading? }\` or a snippet. The first side: at the inline start of the divider (the left in left-to-right), on top when vertical.
- **after** (required): the same. The second side, under the first one. Without \`ratio\` it stays in the flow and gives the comparison its size; the before side fills the same box.
- **ratio**: '2x1' | '2x3' | '16x9' | '4x3' | '1x1' | '3x4' | '3x2' | '9x16' | '1x2' (the AspectRatio vocabulary). A fixed ratio that both sides fill. Use it when the two images differ in size, or with snippets.
- **labels**: boolean | \`{ before?, after? }\` (default: false). \`true\` shows "Before" and "After" in the active locale in each side's corner; an object names them yourself. A label belongs to its side, so the divider covers and reveals it. The names are also read with the divider's value.
- **handle**: Snippet<[{ value, dragging, orientation }]>. Replaces the round grip; the line and the 44px hit area stay.

### Value
- **value**: number, bindable. The share of the before side shown, 0 to 100: where the divider sits, from the inline start (from the top when vertical).
- **defaultValue**: number (default: 50).
- **onValueChange**: (value: number) => void. Each new share while the divider moves.
- **onValueCommit**: (value: number) => void. The settled share once a drag or a key press ends, if it changed.
- **step**: number (default: 1). What an arrow key moves by.
- **largeStep**: number (default: 10). What PageUp, PageDown and Shift+Arrow move by.

### Behaviour and appearance
- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal').
- **variant**: 'surface' | 'solid' | 'glass' (default: 'surface'). How the divider (line and handle) is painted: in the surface colour, filled with the \`color\` role, or frosted over the picture.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral'. The divider's colour role: its fill when \`solid\`, its icon otherwise. Defaults to the Theme's default colour.
- **handleVariant**: 'grip' | 'pill' | 'arrows' | 'none' (default: 'grip'). A round grip, a pill along the line, two bare arrows either side of the line, or the line alone (which then shows the focus ring).
- **lineVariant**: 'solid' | 'dashed' | 'none' (default: 'solid').
- **labelVariant**: 'solid' | 'soft' | 'outline' (default: 'solid'). The Chip variant of the labels.
- **labelPosition**: 'start' | 'center' | 'end' (default: 'start'). Where the labels sit along the divider: the top, middle or bottom of a horizontal comparison; the inline start, middle or end of a vertical one.
- **size**: 'small' | 'normal' | 'large' (default: 'normal'). The handle's size and the line's thickness (1, 2 or 4 px).
- **disabled**: boolean. The divider cannot be moved or focused.
- **readOnly**: boolean. Focusable and announced, but it cannot be moved.
- **label**: string. Accessible name of the divider. Defaults to "Before and after comparison" in the locale.
- **id**, **ref** (bindable, the root), **class**, **theme**.

## Interaction

- Mouse and pen: drag the divider, or press anywhere on the picture: the divider glides there and follows the pointer.
- Touch: drag the divider, swipe along its axis anywhere on the picture, or tap to bring it there. A swipe across the axis stays the page's scroll, and nothing moves on the press itself.
- Keyboard, with the divider focused: arrows move it by \`step\` (mirrored in right-to-left), Shift+Arrow, PageUp and PageDown by \`largeStep\`, Home and End to either end.
- Under reduced motion the divider moves without gliding.

## Structure and styling hooks

\`\`\`
[data-slot=before-after]            root: data-orientation, data-color, data-dragging, data-disabled, data-readonly
├─ [data-slot=before-after-after]   the after side (with its label)
├─ [data-slot=before-after-before]  the before side, cut at the divider with clip-path
└─ [data-slot=before-after-handle]  the divider's hit area
   ├─ input[type=range]             the focus target
   ├─ [data-slot=before-after-line]
   └─ [data-slot=before-after-grip]  data-variant (grip | pill | arrows); absent with handleVariant="none"
\`\`\`

Theme parts: \`root\`, \`side\`, \`image\`, \`label\`, \`rail\`, \`handle\`, \`line\`, \`grip\`.

## Examples

### Any content, as snippets
\`\`\`svelte
<BeforeAfter ratio="3x2" labels={{ before: 'Original', after: 'Graded' }}>
	{#snippet before()}
		<img src="/photo.jpg" alt="The original photo" class="size-full object-cover grayscale" />
	{/snippet}
	{#snippet after()}
		<img src="/photo.jpg" alt="The graded photo" class="size-full object-cover" />
	{/snippet}
</BeforeAfter>
\`\`\`

### Variants
\`\`\`svelte
<BeforeAfter variant="solid" color="primary" handleVariant="pill" before={before} after={after} />
<BeforeAfter variant="glass" lineVariant="none" before={before} after={after} />
<BeforeAfter handleVariant="arrows" lineVariant="dashed" before={before} after={after} />
<BeforeAfter handleVariant="none" size="large" labels labelVariant="soft" labelPosition="end" before={before} after={after} />
\`\`\`

### Controlled
\`\`\`svelte
<script lang="ts">
	let share = $state(30);
</script>

<BeforeAfter bind:value={share} before={before} after={after} onValueCommit={(value) => save(value)} />
\`\`\`

### Vertical
\`\`\`svelte
<BeforeAfter orientation="vertical" ratio="3x4" before={before} after={after} />
\`\`\`

## Accessibility

- The divider is a native range input named by \`label\`, with its value read as both shares ("Before 30%, After 70%", with your own labels when given).
- Both contents stay in the accessibility tree whatever the divider's position: give each image its own \`alt\`.
- \`readOnly\` announces \`aria-readonly\`; \`disabled\` disables the input.

## Notes

- Without \`ratio\`, give both images the same proportions: the before one is cropped to the after one's box.
- Content inside a side should not rely on its own drags or text selection: the picture is a drag surface.
`;
