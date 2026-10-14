export const toggleButtonGroupDescription = `
# ToggleButtonGroup Component

ToggleButtonGroup renders an ordered list of ToggleButton items and exposes the pressed values as one bindable value.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	let formatting = $state(['bold']);
</script>

<ToggleButtonGroup
	bind:value={formatting}
	label="Text formatting"
	color="neutral"
	items={[
		{ value: 'bold', children: 'Bold' },
		{ value: 'italic', children: 'Italic' },
		{ value: 'underline', children: 'Underline' }
	]}
/>
\`\`\`

## Props

- **items**: ToggleButtonGroupItem[] (required) - Ordered button configurations. Each item carries a unique \`value\` plus ToggleButton props (no \`variant\`, \`color\`, or \`size\`; pressed state lives on the group value).
- **label**: string (required) - Accessible name for the group.
- **value**: string[] | string | undefined (bindable) - The only pressed-state source. \`type="multiple"\` holds every pressed value as an array; \`type="single"\` holds the checked value.
- **defaultValue**: same shape as value - Initial pressed state when value is omitted.
- **onValueChange**: (value) => void - Called once with the updated group value after a toggle.
- **size**: 'small' | 'normal' | 'large' - Applied to every item.
- **color**: Colors - Applied to every item.
- **variant**: 'outline' | 'ghost' - Applied to every item. Defaults to 'ghost'.
- **disabled**: boolean - Disables every item. A disabled group has no tab stop, unless an item sets \`focusableWhenDisabled\`.
- **joined**: boolean (default: false) - Renders the buttons as contiguous segments.
- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal') - Axis of the group. Horizontal lays the buttons out in a row and moves with ArrowLeft / ArrowRight; vertical stacks them (joined segments join top to bottom) and moves with ArrowUp / ArrowDown. Keys of the other axis are ignored. Reflected as \`data-orientation\`; the group role never carries \`aria-orientation\`.
- **loopFocus**: boolean (default: true) - Whether the arrow keys wrap from the last button to the first and back. False stops focus at the ends (Home / End still jump).
- **type**: 'single' | 'multiple' (default: 'multiple') - \`'multiple'\` lets any number of buttons be pressed (\`role="group"\`, \`aria-pressed\`) and its value is a \`string[]\`. \`'single'\` makes the selection exclusive: the value is a single string, the root becomes \`role="radiogroup"\`, each button \`role="radio"\` with \`aria-checked\`, pressing one clears the others, and the checked radio cannot be unpressed.
- **class**: string - Additional CSS classes for the root.
- **theme**: ToggleButtonGroupThemeProps - Theme overrides.

## Examples

### Icon Toolbar

\`\`\`svelte
<ToggleButtonGroup
	bind:value={formatting}
	label="Text formatting"
	items={[
		{ value: 'bold', prefix: textBIcon, label: 'Bold' },
		{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
		{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
	]}
/>
\`\`\`

### Joined Segments

\`\`\`svelte
<ToggleButtonGroup
	joined
	variant="outline"
	color="neutral"
	label="Text formatting"
	value={['bold']}
	items={[
		{ value: 'bold', prefix: textBIcon, label: 'Bold' },
		{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
		{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
	]}
/>
\`\`\`

### Single Selection (radio group)

\`\`\`svelte
<script lang="ts">
	let alignment = $state('left');
</script>

<ToggleButtonGroup
	type="single"
	label="Alignment"
	bind:value={alignment}
	items={[
		{ value: 'left', children: 'Left' },
		{ value: 'center', children: 'Center' },
		{ value: 'right', children: 'Right' }
	]}
/>
\`\`\`

### Change Handler

\`\`\`svelte
<ToggleButtonGroup
	label="Density options"
	items={[
		{ value: 'compact', children: 'Compact' },
		{ value: 'comfortable', children: 'Comfortable' }
	]}
	onValueChange={(value) => {
		console.log(value);
	}}
/>
\`\`\`

## Theme

- **root**: Main button group container styles.

## Accessibility

- \`type="multiple"\`: the root is \`role="group"\` named by \`label\`; each ToggleButton exposes its independent state through \`aria-pressed\`.
- \`type="single"\`: the root is \`role="radiogroup"\`; buttons are \`role="radio"\` with \`aria-checked\`.
- The group is a single tab stop (roving tabindex), and the group element itself is not focusable, so Shift+Tab leaves the group in one step. Tab lands on the first pressed enabled button, or the first enabled button when nothing is pressed. ArrowLeft / ArrowRight (ArrowUp / ArrowDown when \`orientation="vertical"\`) move between buttons (looping unless \`loopFocus={false}\`, mirrored in RTL), Home / End jump to the first / last, Space or Enter toggles the focused button. Alt, Ctrl or Meta with an arrow is left to the browser.
- An item with \`focusableWhenDisabled\` that is disabled stays in the arrow-key order and keeps the tab stop reachable, announced with \`aria-disabled\`; it cannot be toggled.
- Prefer SegmentedControl for a visually segmented exclusive choice; use \`type="single"\` when you want toggle-button styling with exclusive semantics.

## Theme example

\`\`\`svelte
<ToggleButtonGroup
	label="Options"
	items={items}
	theme={{
		root: {
			base: 'flex items-center gap-1'
		}
	}}
/>
\`\`\`
`;
