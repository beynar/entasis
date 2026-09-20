export const colorPickerDescription = `
# ColorPicker Component

A standalone color picker panel (a faithful clone of the kibo-ui color picker). It is a
self-contained rounded panel — a saturation/value square, a hue slider, an alpha slider, an
eyedropper button, and a format select with a color text input and an alpha percentage input.
\`ColorPicker\` is the raw panel primitive; \`ColorPickerInput\` wraps it in the standard field
chrome (label, description, errors, form registration) and extends InputProps with type 'color'.

## Basic Usage

\`\`\`svelte
<script>
	import { ColorPicker, ColorPickerInput } from 'entasis/color-picker';
	let color = $state('#6366f1');
</script>

<!-- Field variant: label/description/errors like every other form input -->
<ColorPickerInput
	label="Brand color"
	description="Used for buttons and links across the app"
	bind:value={color}
/>

<!-- Raw panel primitive -->
<ColorPicker bind:value={color} />
<ColorPicker bind:value={color} format="rgb" size="large" />
<ColorPicker value="#22c55e80" onValueChange={(hex) => console.log(hex)} />
<ColorPicker value="#000000" disabled />
\`\`\`

## ColorPickerInput (field variant)

Accepts every field prop from InputProps ('color') — \`label\`, \`description\`, \`name\`, \`required\`,
\`errors\`, \`onValidate\`, \`helper\`, snippets, … — plus the panel props \`format\` and \`i18n\`.
\`theme\` is split: \`theme.picker\` for the panel parts, \`theme.field\` for the field wrapper.
\`bind:value\` is the canonical hex string (nullable).

## Props

### Core Props
- **value**: \`string\` (bindable, default: \`'#000000'\`)
  - The selected color. The canonical output is always hex: \`#rrggbb\`, or \`#rrggbbaa\` when alpha < 1.
  - Any parseable CSS color is accepted programmatically (named colors, \`rgb()\`, \`rgba()\`, \`hsl()\`, \`hsla()\`, \`#rgb\`, \`#rrggbb\`, \`#rrggbbaa\`).
  - Hue and saturation are preserved internally, so dragging a color to black/white or typing a gray never loses the chosen hue.
- **format**: \`'hex' | 'rgb' | 'hsl'\` (bindable, default: \`'hex'\`)
  - Controls the text representation shown in the input. The bound \`value\` stays hex regardless of this.

### Style Props
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
  - Scales the panel width, slider heights, thumb sizes and text sizes.
- **disabled**: \`boolean\` (default: \`false\`) - Disables every control and dims the panel.

### Event Props
- **onValueChange**: \`(value: string) => void\`
  - Fires on every committed change, including continuously while dragging. Receives the canonical hex string.

### Advanced Props
- **class**: \`string\` - Extra classes merged onto the root panel.
- **theme**: \`ColorPickerThemeProps\` - Theme overrides for the panel parts.
- **i18n**: \`Partial<Messages>\` - Per-instance i18n overrides merged over the global catalog.

## Structure

A rounded \`root\` panel containing, top to bottom:
1. The \`area\` — a saturation/value square with a solid hue backdrop and two gradient overlays
   (\`areaSaturation\` white→transparent left-to-right, \`areaValue\` transparent→black top-to-bottom),
   plus a draggable circular \`areaThumb\`.
2. A \`controls\` row — a square \`eyedropperButton\` and a \`sliders\` column with a rainbow
   \`hueTrack\` (0–360) and a checkerboard \`alphaTrack\` (the \`alphaGradient\` overlays a pure-CSS
   checkerboard), each with a white \`sliderThumb\`.
3. An \`inputs\` row — a native \`select\` (hex/rgb/hsl), the color \`input\`, and an
   \`alphaField\` wrapping the \`alphaInput\` (0–100) and its \`alphaSuffix\` (\`%\`). The text
   input always shows the solid color (no alpha suffix); alpha lives in the % input and the
   alpha slider, so the row is identical in every format.

## Interaction

- The square and both sliders support click-to-jump and continuous pointer drag.
- The color text input is masked (Maskito) for the selected format: hex auto-inserts the leading \`#\`
  and takes up to 8 hex digits; rgb/hsl are structured templates auto-inserting the \`rgb(\`/\`hsl(\`
  prefix, \`, \` separators and hsl's \`%\` suffixes as digits flow in (\`,\` ends a channel early; a
  missing \`)\` is completed on commit). Entries commit on Enter or blur; an incomplete entry reverts.
  The text always shows the solid form; a typed/eyedropped color without an explicit alpha keeps the
  current alpha (pasting \`rgba()\`/8-digit hex still applies the pasted alpha).
- The alpha input is masked to 0–100 and commits on change; the format select only changes the text representation.
- The eyedropper uses the native \`window.EyeDropper\` API and is disabled where unsupported (SSR-safe).

## Accessibility

- The area thumb and both slider thumbs are focusable \`role="slider"\` elements with
  \`aria-valuemin\`/\`aria-valuemax\`/\`aria-valuenow\` and localized \`aria-label\`s.
- Keyboard: on the square, Left/Right adjust saturation and Up/Down adjust value; on the sliders,
  arrow keys step (Shift for a larger step) and Home/End jump to min/max.
- The eyedropper, color input, format select and alpha input all carry localized aria-labels.

## Notes
- Canonical \`value\` is hex; use \`format\` only to change the input's text representation.
- Theme parts: \`root\`, \`area\`, \`areaSaturation\`, \`areaValue\`, \`areaThumb\`, \`controls\`,
  \`eyedropperButton\`, \`sliders\`, \`hueTrack\`, \`alphaTrack\`, \`alphaGradient\`, \`sliderThumb\`,
  \`inputs\`, \`select\`, \`input\`, \`alphaField\`, \`alphaInput\`, \`alphaSuffix\` (each with a \`size\` variant).

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
