export const toggleButtonGroupDescription = `
# ToggleButtonGroup Component

ToggleButtonGroup renders a keyed set of ToggleButton items and exposes a bindable checked map.

## Basic Usage

\`\`\`svelte
<script>
	let formatting = $state({ bold: true, italic: false, underline: false });
</script>

<ToggleButtonGroup
	bind:value={formatting}
	ariaLabel="Text formatting"
	color="neutral"
	items={{
		bold: { children: 'Bold' },
		italic: { children: 'Italic' },
		underline: { children: 'Underline' }
	}}
/>
\`\`\`

## Props

- **items**: Record<string, ToggleButtonGroupItem> (required) - Immutable keyed button configurations. Items do not contain \`checked\`.
- **ariaLabel**: string (required) - Accessible name for the group.
- **value**: Partial<Record<keyof items, boolean>> (bindable) - The only checked-state source. Missing keys are false.
- **defaultValue**: Partial<Record<keyof items, boolean>> - Initial checked map when value is omitted.
- **onValueChange**: (value) => void - Called once with the full checked map after a toggle.
- **size**: 'small' | 'normal' | 'large' - Applied to every item.
- **color**: Colors - Applied to every item.
- **variant**: 'outline' | 'ghost' - Applied to every item. Defaults to 'ghost'.
- **disabled**: boolean - Disables every item.
- **joined**: boolean (default: false) - Renders the buttons as contiguous segments.
- **class**: string - Additional CSS classes for the root.
- **theme**: ToggleButtonGroupThemeProps - Theme overrides.

## Examples

### Icon Toolbar

\`\`\`svelte
<ToggleButtonGroup
	bind:value={formatting}
	ariaLabel="Text formatting"
	items={{
		bold: { prefix: textBIcon, ariaLabel: 'Bold' },
		italic: { prefix: textItalicIcon, ariaLabel: 'Italic' },
		underline: { prefix: textUnderlineIcon, ariaLabel: 'Underline' }
	}}
/>
\`\`\`

### Joined Segments

\`\`\`svelte
<ToggleButtonGroup
	joined
	variant="outline"
	color="neutral"
	ariaLabel="Text formatting"
	value={{ bold: true }}
	items={{
		bold: { prefix: textBIcon, ariaLabel: 'Bold' },
		italic: { prefix: textItalicIcon, ariaLabel: 'Italic' },
		underline: { prefix: textUnderlineIcon, ariaLabel: 'Underline' }
	}}
/>
\`\`\`

### Change Handler

\`\`\`svelte
<ToggleButtonGroup
	ariaLabel="Density options"
	items={{
		compact: { children: 'Compact' },
		comfortable: { children: 'Comfortable' }
	}}
	onValueChange={(value) => {
		console.log(value);
	}}
/>
\`\`\`

## Theme

- **root**: Main button group container styles.

The root uses \`role="group"\` and \`ariaLabel\`; each ToggleButton exposes its independent state through \`aria-pressed\`. Use SegmentedControl rather than ToggleButtonGroup for mutually exclusive choices.

\`\`\`svelte
<ToggleButtonGroup
	ariaLabel="Options"
	items={items}
	theme={{
		root: {
			base: 'flex items-center gap-1'
		}
	}}
/>
\`\`\`
`;
