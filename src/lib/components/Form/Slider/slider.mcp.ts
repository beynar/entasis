export const sliderDescription = `
# Slider Component

The Slider component is a Field-based numeric control for scalar values, range tuples, vertical layouts, multi-thumb values, and draggable selected ranges. Each thumb is a visually hidden native \`<input type="range">\` inside a styled thumb, so every mode shares one state machine and theme parts while mobile screen readers can adjust the value with their own gestures (VoiceOver swipe up and down, TalkBack adjust), which send no key events.

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
- **value**: number | number[] | null (bindable) - Current scalar or multi-thumb value; an array keeps its array shape, even with one element (\`[25]\` stays \`[26]\` after ArrowRight, never \`26\`)
- **mode**: 'single' | 'range' (default: 'single') - Range mode defaults to two thumbs
- **variant**: 'default' | 'thick' | 'contained' (default: 'default') - Visual track style; \`thick\` renders a heavier track with an inset pill thumb, while \`contained\` places the label and optional value inside an input-like rail
- **thumbs**: number - Number of thumbs when the value is missing or scalar
- **min**: number (default: 0) - Minimum selectable value
- **max**: number (default: 100) - Maximum selectable value
- **step**: number (default: 1) - Pointer and keyboard increment
- **largeStep**: number (default: 10 × step) - Amount PageUp, PageDown and Shift+Arrow change the value by. The result still snaps to \`step\`
- **minStepsBetweenThumbs**: number (default: 0) - Minimum spacing between neighboring thumbs, in step units
- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal') - Track direction
- **thumbCollisionBehavior**: 'none' | 'push' | 'swap' (default: 'none') - What a thumb does when it meets a neighbour. \`none\` stops it at the neighbour (and at \`minStepsBetweenThumbs\`), \`push\` moves the neighbours along while there is room, \`swap\` lets it pass: the thumbs trade places, and focus and the drag follow the moving thumb. Each thumb's \`aria-valuemin\`/\`aria-valuemax\` follow the mode
- **thumbDisabled**: boolean[] - Disables thumbs by index. A disabled thumb keeps its value (and its place in the submitted value) but cannot be focused or moved, and it blocks the thumbs next to it in every collision mode. Track presses move the closest free thumb, and dragging the selected range is off while any thumb is disabled
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
- **readOnly**: boolean - Refuses every edit (pointer, keys and assistive technology) while thumbs stay focusable, announced with \`aria-readonly\`, and the value is still submitted. The track and thumbs carry \`data-readonly\`
- **onValueChange**: (value: number | number[]) => void - Called when value changes, on every pointer move
- **onValueCommit**: (value: number | number[]) => void - Called when an interaction ends with a value that differs from the one it started with: on pointer release, on pointer cancel, after each accepted key press, and when assistive technology finishes an adjustment. Never called for a no-op. Use it to save on release
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

Use \`type: 'slider'\` for scalar values and \`type: 'slider-range'\` for submitted number arrays. A \`slider-range\` holds one or more values, so a one-thumb array value such as \`[25]\` is submitted as \`[25]\`.

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
			<Track role="group">
				<ScreenReaderInstructions />
				<TrackBackground />
				<SelectedRange />
				<Thumb>
					<input type="range" />
					<ThumbVisual />
				</Thumb>
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

### Save On Release
\`\`\`svelte
<Slider
	label="Volume"
	bind:value={volume}
	onValueCommit={(value) => saveVolume(value)}
/>
\`\`\`

### Thumb Collisions
\`\`\`svelte
<!-- push: a thumb moves its neighbours along -->
<Slider label="Split" bind:value={split} thumbs={3} thumbCollisionBehavior="push" />

<!-- swap: a thumb passes its neighbour and the two trade places -->
<Slider mode="range" label="Window" bind:value={window} thumbCollisionBehavior="swap" />
\`\`\`

### Disabled Thumb
\`\`\`svelte
<Slider
	mode="range"
	label="Budget"
	bind:value={budget}
	thumbDisabled={[true, false]}
/>
\`\`\`

### Read Only
\`\`\`svelte
<Slider label="Level" value={72} readOnly />
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

- Each thumb contains a visually hidden \`<input type="range">\` (role slider), the one focus target. Clicking the Field label focuses the first thumb. The input also submits the value natively under the field name, once per thumb; a slider without a name submits nothing, and a disabled slider is left out
- Mobile screen-reader adjust gestures change the input directly: the slider reads the new value from its \`input\` event and reports one commit on \`change\`
- Single-thumb sliders use the visible Field label when present; multi-thumb sliders add per-thumb labels such as "Budget minimum" and "Budget maximum"
- The track is exposed as a group named by the rendered label (\`aria-labelledby\`), whether the label is text or a snippet, with hidden keyboard instructions referenced by \`aria-describedby\`
- Thumb values expose \`aria-valuemin\`, \`aria-valuemax\`, \`aria-valuenow\`, \`aria-valuetext\`, and \`aria-orientation\`
- Multi-thumb \`aria-valuemin\`/\`aria-valuemax\` reflect each thumb's current movement bounds, including minimum thumb spacing
- Keyboard support: Arrow keys move by one step, Shift+Arrow and PageUp/PageDown move by \`largeStep\` (ten steps by default), Home/End jump to bounds. Each accepted key press is one \`onValueCommit\`
- Read-only sliders expose \`aria-readonly\` on every thumb and refuse edits from every source
- ArrowLeft / ArrowRight follow the writing direction: in RTL, ArrowLeft increases and ArrowRight decreases (vertical sliders are unaffected)
- In RTL a horizontal track mirrors to match: the minimum sits at the right edge, thumbs, the filled range, marks and contained ticks are placed from the inline start, and a pointer press reads its value from the right edge. An I18n direction that the document does not carry is applied to the whole slider field (label, description, errors and track) through a \`dir\` attribute on the field root, and it takes precedence over a \`dir\` in \`fieldAttrs\`, as it does for the arrow keys and pointer. The slider follows its nearest direction, so an ltr slider inside an rtl page stays ltr; set the direction with I18n or a \`dir\` attribute rather than CSS \`direction\` alone
- Multi-thumb sliders enforce ordering and optional minimum thumb spacing
- Disabled state blocks pointer, keyboard, and selected-range dragging; a disabled thumb leaves the tab order

## Theme Customization

Theme parts:
- **inputContainer**: inherited Field input container wrapper
- **root**: Slider root layout
- **control**: Track and value-label layout
- **track**: Pointer surface and color carrier
- **trackBackground**: Unselected track
- **range**: Selected range segment
- **thumb**: Individual slider thumb wrapper; it holds the hidden range input, and the focus ring is drawn on the visual through \`group-has-[:focus-visible]\`
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
- **onValueCommit**: called with the settled value when an interaction ends with a different value.

`;
