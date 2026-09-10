export const sliderDescription = `
# Slider Component

The Slider component is a Field-based numeric control for scalar values, range tuples, vertical layouts, multi-thumb values, and draggable selected ranges. It renders ARIA slider thumbs instead of relying on a native range input so every mode shares the same state machine and theme parts.

## Basic Usage

\`\`\`svelte
<script>
	let volume = $state(40);
</script>

<Slider label="Volume" bind:value={volume} min={0} max={100} step={5} showValue />
\`\`\`

## Range Usage

\`\`\`svelte
<script>
	let budget = $state([25, 75]);
</script>

<Slider
	mode="range"
	label="Budget"
	bind:value={budget}
	min={0}
	max={100}
	step={5}
	minStepsBetweenThumbs={2}
	dragRange
	showValue
	formatValue={(value) => \`$\${value}k\`}
/>
\`\`\`

## Props

Extends all Field props plus:

### Core Props
- **value**: number | number[] | null (bindable) - Current scalar or multi-thumb value
- **mode**: 'single' | 'range' (default: 'single') - Range mode defaults to two thumbs
- **variant**: 'default' | 'thick' | 'contained' (default: 'default') - Visual track style; \`thick\` renders a heavier track with an inset pill thumb, while \`contained\` places the label and optional value inside an input-like rail
- **thumbs**: number - Number of thumbs when the value is missing or scalar
- **min**: number (default: 0) - Minimum selectable value
- **max**: number (default: 100) - Maximum selectable value
- **step**: number (default: 1) - Pointer and keyboard increment
- **minStepsBetweenThumbs**: number (default: 0) - Minimum spacing between neighboring thumbs, in step units
- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal') - Track direction
- **dragRange**: boolean (default: false) - Allows dragging the selected range segment as a unit
- **color**: semantic color (default: 'primary') - Filled track and thumb color

### Display Props
- **showValue**: boolean (default: false) - Shows value chips beside the track
- **formatValue**: (value: number, index: number, values: number[]) => string - Formats thumb labels and aria-valuetext
- **marks**: Array<{ value: number; label?: string | Snippet }> - Optional tick marks along the track
- **thumbLabels**: string[] - Accessible labels for individual thumbs
- **i18n**: Partial<Messages> - Per-instance i18n overrides

### Field Props
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **required**: boolean - Validates that a value is present
- **disabled**: boolean - Disables pointer and keyboard interaction
- **size**: 'small' | 'normal' | 'large' - Control size
- **errors**: string[] | boolean (bindable) - Validation errors
- **focused**: boolean (bindable) - Focus state
- **onValueChange**: (value: number | number[]) => void - Called when value changes
- **onValidate**: (value: number | number[]) => string[] | boolean - Custom validation

### Slots
- **prefix**: Snippet - Content before the slider
- **suffix**: Snippet - Content after the slider
- **valueLabel**: Snippet<SliderValuePayload> - Custom per-thumb value label
- **rangeLabel**: Snippet<SliderRangePayload> - Custom selected range label

### Styling Props
- **class**: string - Classes for the field root
- **theme**: SliderThemeProps & FieldThemeProps - Theme overrides

## Form Integration

Use \`type: 'slider'\` for scalar values and \`type: 'slider-range'\` for submitted number arrays.

\`\`\`svelte
<Form
	inputs={{
		volume: {
			type: 'slider',
			label: 'Volume',
			value: 35,
			min: 0,
			max: 100,
			step: 5,
			showValue: true
		},
		comfortBand: {
			type: 'slider-range',
			label: 'Comfort band',
			value: [18, 24],
			min: 12,
			max: 32,
			dragRange: true,
			showValue: true
		}
	}}
/>
\`\`\`

## Structure

\`\`\`
<Field>
	<Label />
	<InputContainer>
		<Prefix />
		<SliderRoot>
			<HiddenInput />
			<Track role="group">
				<ScreenReaderInstructions />
				<TrackBackground />
				<SelectedRange />
				<Thumb role="slider" />
				<Marks />
			</Track>
			<ValueLabels />
		</SliderRoot>
		<Suffix />
	</InputContainer>
	<Description />
	<Error />
</Field>
\`\`\`

## Examples

### Vertical
\`\`\`svelte
<Slider
	orientation="vertical"
	label="Output"
	bind:value={output}
	min={0}
	max={100}
	step={10}
	showValue
/>
\`\`\`

### Thick Variant
\`\`\`svelte
<Slider
	variant="thick"
	size="normal"
	label="Temperature"
	bind:value={temperature}
	min={16}
	max={30}
	step={1}
	showValue
/>
\`\`\`

### Contained Variant

\`contained\` is intended for compact settings panels. It keeps the native Field label association while rendering the label inside the rail. Add \`showValue\` to place the formatted value at the opposite edge.

\`\`\`svelte
<Slider
  variant="contained"
  label="Background glow"
  bind:value={glow}
  min={0}
  max={3}
  step={0.1}
  showValue
  formatValue={(value) => value.toFixed(1)}
/>
\`\`\`

### Three Thumbs
\`\`\`svelte
<Slider
	label="Distribution"
	bind:value={distribution}
	min={0}
	max={100}
	step={5}
	thumbs={3}
	showValue
/>
\`\`\`

### Custom Range Label
\`\`\`svelte
<Slider mode="range" bind:value={range} showValue>
	{#snippet rangeLabel(payload)}
		<span>{payload.startValue} - {payload.endValue}</span>
	{/snippet}
</Slider>
\`\`\`

## Accessibility

- Each thumb is a button with \`role="slider"\`
- Single-thumb sliders use the visible Field label when present; multi-thumb sliders add per-thumb labels such as "Budget minimum" and "Budget maximum"
- The track is exposed as a labelled group when the label is plain text, with hidden keyboard instructions referenced by \`aria-describedby\`
- Thumb values expose \`aria-valuemin\`, \`aria-valuemax\`, \`aria-valuenow\`, \`aria-valuetext\`, and \`aria-orientation\`
- Multi-thumb \`aria-valuemin\`/\`aria-valuemax\` reflect each thumb's current movement bounds, including minimum thumb spacing
- Keyboard support: Arrow keys move by one step, Shift+Arrow and PageUp/PageDown move by ten steps, Home/End jump to bounds
- Multi-thumb sliders enforce ordering and optional minimum thumb spacing
- Disabled state blocks pointer, keyboard, and selected-range dragging

## Theme Customization

Theme parts:
- **inputContainer**: inherited Field input container wrapper
- **root**: Slider root layout
- **control**: Track and value-label layout
- **track**: Pointer surface and color carrier
- **trackBackground**: Unselected track
- **range**: Selected range segment
- **thumb**: Individual slider thumb button
- **thumbHitbox**: Invisible thick-variant thumb pointer target
- **thumbVisual**: Visible thumb shape
- **valueLabels**: Value chip group
- **valueLabel**: Individual value chip
- **containedLabel**: Label rendered inside the contained rail
- **containedTicks**: Decorative scale wrapper for the contained rail
- **containedTick**: Individual decorative scale line
- **marks**: Mark container
- **mark**: Individual mark positioning wrapper
- **markDot**: Mark dot
- **markLabel**: Mark text

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
