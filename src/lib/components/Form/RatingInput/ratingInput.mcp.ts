export const ratingInputDescription = `
# RatingInput Component

The RatingInput component is a star rating field with optional half-star support, a configurable star count, and full RTL support. Its value is a number.

## Basic Usage

\`\`\`svelte
<script>
	let rating = $state(3);
</script>

<RatingInput label="Rating" bind:value={rating} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: number | null (bindable, default null) - Current rating; null (or 0) means "no rating"
- **max**: number (default: 5) - Number of stars, which is also the maximum value
- **halfSteps**: boolean (default: false) - When true the value snaps to 0.5 increments (half stars)
- **readonly**: boolean (default: false) - Displays the value without allowing interaction (aria-readonly=true); still shows the stars
- **clearable**: boolean (default: true) - When true, clicking the exact current value clears it back to null
- **dir**: 'ltr' | 'rtl' - Reading direction override; inherits the ambient direction when omitted
- **color**: Colors (default: 'warning') - Color of the filled stars (the classic gold/amber star)

### Content Props (Slots)
- **star**: Snippet<[{ index, fraction, layer }]> (optional) - Custom star icon, forwarded to the underlying Rating display component. Rendered twice per star: once for the muted outline (layer: 'base') and once for the colored fill overlay (layer: 'fill'). See the Rating component docs for an example.

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **required**: boolean - Mark as required (a required rating must be at least half a star)
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large' - Star size

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides
- **i18n**: Partial<Messages> - Per-instance i18n overrides

## Examples

### Basic Rating (integer)
\`\`\`svelte
<RatingInput label="Rating" bind:value={rating} max={5} />
\`\`\`

### Half Steps
\`\`\`svelte
<RatingInput label="Rating" bind:value={rating} halfSteps />
\`\`\`

### Half Steps in RTL (fills from the right)
\`\`\`svelte
<RatingInput label="Rating" bind:value={rating} halfSteps dir="rtl" />
\`\`\`

### Custom Star Count
\`\`\`svelte
<RatingInput label="Score" bind:value={score} max={10} />
\`\`\`

### Readonly
\`\`\`svelte
<RatingInput label="Average" value={4.5} halfSteps readonly />
\`\`\`

### Disabled
\`\`\`svelte
<RatingInput label="Rating" value={3} disabled />
\`\`\`

### Required (inside a Form)
\`\`\`svelte
<Form inputs={{ rating: { type: 'rating', label: 'Rating', required: true } }} />
\`\`\`

## Keyboard Interactions

The rating row is a single tab stop with \`role="slider"\`.

- **Arrow Right / Arrow Up**: Increase the value by the step (0.5 when halfSteps, else 1)
- **Arrow Left / Arrow Down**: Decrease the value by the step
- **Home**: Clear the value (sets it to null)
- **End**: Set the value to max

Value semantics do NOT flip in RTL: Arrow Right always increases the numeric value. Only the visual fill is mirrored.

## Accessibility

- The row container carries \`role="slider"\` and is the single focusable element (\`tabindex\` 0 when interactive, -1 when readonly/disabled)
- ARIA: \`aria-valuemin={0}\`, \`aria-valuemax={max}\`, \`aria-valuenow\`, \`aria-valuetext\`, \`aria-orientation="horizontal"\`, \`aria-readonly\`, \`aria-disabled\`
- Individual stars are \`aria-hidden\` and not focusable; the pointer selects a value and half-star hits are computed from the pointer position within each star
- Clicking a star focuses the slider container (native focus fixup), so arrow keys work immediately after a pointer selection and \`focused\` becomes true — same as clicking a text input

## RTL

When the effective direction is RTL (via the \`dir\` prop or the inherited ambient direction), the stars render right-to-left and the fill grows from the right. The fill uses the CSS logical property \`inset-inline-start\`, so the visual mirroring is automatic. Note again: the numeric value is unaffected by direction — only the visual fill mirrors.

## Half Steps

With \`halfSteps\`, the left half of a star (in the reading direction) selects n-0.5 and the right half selects n. The fill is rendered with an overflow-hidden clip whose width is the star's fill fraction, giving exact 0.5 (and arbitrary partial) fills.

## Theme Customization

The RatingInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **container**: The flex row of stars (gap + focus ring)
- **star**: The fixed-size box wrapping one star (cursor-pointer when interactive)
- **starBase**: The outline (empty) star color
- **starFill**: The filled star, driven by the \`color\` variant

### Available Variants

**container**:
- size: 'small' | 'normal' | 'large' - Gap between stars
- disabled: boolean - Disabled state styling

**star**:
- size: 'small' | 'normal' | 'large' - Star box size
- interactive: boolean - cursor-pointer when interactive

**starFill**:
- color: Colors - Fill color of the star (defaults to 'warning')

### Global Theme Setting

The star rendering lives in the \`Rating\` display component, so the theme is shared: set it once and both \`Rating\` and \`RatingInput\` pick it up.

\`\`\`svelte
<script>
	import { setRatingTheme } from 'entasis/rating-input'; // also exported from 'entasis/rating'

	setRatingTheme({
		starFill: {
			color: {
				primary: 'text-primary'
			}
		}
	});
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
