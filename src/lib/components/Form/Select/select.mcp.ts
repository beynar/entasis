export const selectDescription = `
# Select Component

A custom (non-native) dropdown selection field: a combobox trigger opening a listbox popover,
with full keyboard navigation, grouped options, and Field/Form integration.

## Basic Usage

\`\`\`svelte
<Select
	label="Country"
	bind:value={country}
	items={[
		{ value: 'us', label: 'United States' },
		{ value: 'uk', label: 'United Kingdom' },
		{ value: 'ca', label: 'Canada' }
	]}
/>
\`\`\`

## Grouped options

Flat options and \`{ label, items }\` groups can be mixed freely; separators render between groups.

\`\`\`svelte
<Select
	label="Timezone"
	bind:value={tz}
	items={[
		{ label: 'Europe', items: [{ value: 'paris', label: 'Paris' }, { value: 'berlin', label: 'Berlin' }] },
		{ label: 'America', items: [{ value: 'nyc', label: 'New York' }, { value: 'la', label: 'Los Angeles' }] }
	]}
/>
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: string (bindable) - Selected value
- **items**: (SelectOption | SelectOptionGroup)[] - Flat \`{ value, label, disabled? }\` options and/or \`{ label, items }\` groups
- **placeholder**: string (default: 'Select an option') - Trigger text when no selection
- **separators**: boolean (default: true) - Render separators between consecutive groups

### Field Props (inherited)
- **label**: string | Snippet - Field label, and the trigger's accessible name; without it the trigger falls back to the placeholder
- **description**: string | Snippet - Helper text
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable the trigger
- **size**: 'small' | 'normal' | 'large' - Trigger and dropdown size
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height)
- **name**: string - Form field name; also renders a hidden input for native form posts

### Bindable Props
- **value**: string - Selected value
- **errors**: string[] - Validation errors
- **focused**: boolean - Trigger focus state

### Callbacks
- **onValueChange**: (value) => void - Fires when the selection changes
- **onValidate**: (value) => string[] | boolean - Custom validation

### Advanced Props
- **theme**: SelectThemeProps - Theme overrides (input, inputContainer, value, triggerIcon, content, group, groupLabel, item, itemIndicator, separator)

## Keyboard

- Closed: ArrowDown / ArrowUp / Enter / Space open the dropdown, anchored on the selected option
- Open: ArrowDown / ArrowUp move the highlight (wrap-around), Home / End jump, Enter / Space select, Escape closes, Tab closes and moves focus on
- Type-ahead: typing letters while the trigger has focus moves the highlight to the next option whose label starts with the typed text
- Disabled options are skipped by the highlight

## Accessibility

ARIA 1.2 select-only combobox pattern: the trigger is a \`role="combobox"\` button with
\`aria-haspopup="listbox"\`, \`aria-expanded\`, and \`aria-controls\`; DOM focus stays on the
trigger while \`aria-activedescendant\` tracks the highlighted \`role="option"\` (virtual focus).
The selected option shows a check indicator and \`aria-selected\`.

The trigger always has an accessible name: \`label\` names it through the Field label (a string
label as a \`<label for>\`, a snippet through \`aria-labelledby\`), and without one the trigger
falls back to \`placeholder\`, then to the catalog's "Select an option". Pass \`label\` whenever
an unlabelled select sits in a toolbar or filter row, so the name says which control it is
rather than repeating the placeholder.

## Notes

- Selection re-focuses the trigger (matches native select behavior)
- Clicking outside closes via trigger blur; option rows prevent mousedown so the click can land
- The dropdown scrolls beyond ~240px (ScrollArea); the highlight scrolls into view on keyboard nav

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
