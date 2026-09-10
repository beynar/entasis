export const colorInputDescription = `
# ColorInput Component

The ColorInput is a form field for picking a color. It shows a color swatch and a text input inside
the shared Field frame, and opens a full ColorPicker panel in a Popover. Its value is a canonical hex
string (\`#rrggbb\`, or \`#rrggbbaa\` when alpha < 1).

## Basic Usage

\`\`\`svelte
<script>
	import { ColorInput } from 'svelai';
	let color = $state('#6366f1');
</script>

<ColorInput label="Brand color" bind:value={color} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: \`string | null\` (bindable) - The selected color. The canonical value is always hex:
  \`#rrggbb\`, or \`#rrggbbaa\` when alpha < 1. Any parseable CSS color (named colors, \`rgb()\`,
  \`rgba()\`, \`hsl()\`, \`hsla()\`, \`#rgb\`, \`#rrggbb\`, \`#rrggbbaa\`) is accepted programmatically and
  normalized to hex on commit. \`null\` renders the empty/neutral swatch and an empty input.
- **format**: \`'hex' | 'rgb' | 'hsl'\` (bindable, default: \`'hex'\`) - The text representation shown
  in the input and the picker's format select. The bound \`value\` stays hex regardless. Bindable so a
  format change from the picker flows back out.

### Display Props
- **placeholder**: \`string\` - Hint text shown in the empty color input. Defaults to the selected
  format's pattern: \`#rrggbb\`, \`rgb(r, g, b)\` or \`hsl(h, s%, l%)\`.

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **required**: boolean - Mark as required (a required color must be a non-empty string)
- **disabled**: boolean - Disable input, swatch and picker
- **size**: 'small' | 'normal' | 'large' - Field size, forwarded to the embedded ColorPicker

### Event Props
- **onValueChange**: \`(value: string) => void\` - Fires on every committed change, including continuously
  while dragging in the picker. Receives the canonical hex string.
- **onValidate**: \`(value: string) => string[] | boolean\` - Custom validation.

### Styling Props
- **class**: string - Additional CSS classes on the field root
- **theme**: ColorInputTheme - Theme overrides (also accepts Field theme parts)
- **i18n**: Partial<Messages> - Per-instance i18n overrides, also forwarded to the ColorPicker

## Structure

\`\`\`
<Popover>
	<Field>
		<Swatch />   <!-- opens the picker -->
		<Input />    <!-- shows the value in the chosen format -->
	</Field>
	<ColorPicker />  <!-- inside the popover panel -->
</Popover>
\`\`\`

## Examples

### With alpha
\`\`\`svelte
<ColorInput label="Overlay" value="#00000080" />
\`\`\`

### RGB text representation
\`\`\`svelte
<ColorInput label="Accent" bind:value={accent} format="rgb" />
\`\`\`

### Required inside a Form
\`\`\`svelte
<Form>
	<ColorInput name="color" label="Theme color" required />
</Form>
\`\`\`

### Disabled
\`\`\`svelte
<ColorInput label="Locked" value="#22c55e" disabled />
\`\`\`

## Interaction

- The swatch button toggles the picker popover; focusing the text input also opens it (like DateInput).
- The text input is masked (Maskito) for the selected format: hex auto-inserts the leading \`#\` and
  takes up to 8 hex digits; rgb/hsl are structured templates that auto-insert the \`rgb(\` / \`hsl(\`
  prefix, the \`, \` separators and hsl's \`%\` suffixes as digits flow in (3 digits per channel, or
  \`,\` to end a channel early — a missing closing \`)\` is completed on commit). Valid entries commit
  immediately (normalized to hex); an incomplete entry does not commit and the input text is restored
  from the canonical value on blur. Clearing the input sets the value to \`null\`.
- Dragging inside the picker updates the value live. The popover does not close on pick (color picking
  is continuous); it closes on click-outside or Escape.
- Changing the format select in the picker updates the input's text representation while keeping the
  bound value as hex.

## Accessibility

- The swatch sits inside a field action button (the same primitive as the password visibility
  toggle), which stretches to the field's full height for a generous hit target and carries
  \`aria-haspopup="dialog"\`, \`aria-expanded\`, \`aria-controls\`, and a localized "Choose Color" label.
- The text input carries a localized "Color value" label and is associated with the field label.
- The embedded ColorPicker exposes its saturation/brightness square and hue/alpha sliders as focusable
  \`role="slider"\` controls with full keyboard support (see the ColorPicker docs).

## Theme Customization

The theme object contains the following parts:
- **input**: The color text input element (size, disabled variants)
- **inputContainer**: The bordered field container (size, disabled variants)
- **popover**: The popover panel wrapping the ColorPicker
- **swatch**: The color swatch inside the leading action button (size variant, empty variant)

Field theme parts (label, description, error, ...) are also accepted on the same \`theme\` prop.

\`\`\`svelte
<ColorInput
	label="Brand color"
	bind:value={color}
	theme={{
		swatch: { size: { normal: 'size-6 rounded-full' } },
		inputContainer: { base: 'border-2' }
	}}
/>
\`\`\`

## Notes

- The canonical \`value\` is always hex; use \`format\` only to change the input's text representation.
- The swatch renders the color over a CSS checkerboard so colors with alpha < 1 read correctly, and
  shows a neutral muted square when the value is \`null\`.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
