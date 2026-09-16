export const commandDescription = `
# Command Component

A command palette: a searchable, keyboard-navigable list of grouped commands. Renders inline by
default, or inside a modal Dialog (⌘K style) with \`dialog\`.

## Basic Usage

\`\`\`svelte
<script>
	import { Command } from 'svelai/command';
	import { calendarIcon } from 'svelai/icons/calendar';

	const items = [
		{
			heading: 'Suggestions',
			items: [
				{ value: 'calendar', label: 'Calendar', icon: calendarIcon },
				{ value: 'search-emoji', label: 'Search Emoji' },
				{ value: 'calculator', label: 'Calculator', disabled: true }
			]
		},
		{
			heading: 'Settings',
			items: [
				{ value: 'profile', label: 'Profile', shortcut: '⌘P' },
				{ value: 'settings', label: 'Settings', shortcut: '⌘S' }
			]
		}
	];
</script>

<Command {items} onSelect={(value) => console.log(value)} />
\`\`\`

## Dialog Mode (⌘K palette)

\`\`\`svelte
<Command dialog shortcut="k" {items} onSelect={run}>
	{#snippet trigger({ open })}
		<Button variant="outline" onclick={open}>Search... ⌘K</Button>
	{/snippet}
	{#snippet footer({ close })}
		<div class="border-neutral-muted text-neutral/70 border-t px-3 py-2 text-xs">
			↵ Select · Esc Close
		</div>
	{/snippet}
</Command>
\`\`\`

## Props

### Core Props
- **items**: CommandGroup[] (required)
  - \`CommandGroup\`: \`{ heading?: string; items: CommandItem[]; class?: string }\`
  - \`CommandItem\`: \`{ value: string; label: string; icon?: Slot; shortcut?: string; keywords?: string[]; disabled?: boolean; href?: string; onSelect?: (value) => void; class?: string }\`
  - Items with \`href\` render as \`<a>\` and navigate on click/Enter.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Typography and spacing scale.
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing density forwarded to the option rows (paddings, gaps, min-height).

### Dialog Mode Props
- **dialog**: boolean (default: false) - Render inside a modal Dialog instead of inline.
- **open**: boolean (bindable, default: false) - Dialog open state.
- **defaultOpen**: boolean (default: false) - Initial dialog state when open is omitted.
- **onOpenChange**: (open: boolean) => void - Fires once after a component-owned open state change.
- **shortcut**: string | false (default: false) - ⌘/Ctrl + key toggles the dialog (e.g. 'k').
- **closeOnSelect**: boolean (default: true) - Close the dialog when an item is selected.

### Selection Props
- **value**: string | null (bindable, default: null) - Value of the selected command.
- **defaultValue**: string | null (default: null) - Initial selected value when value is omitted.
- **onValueChange**: (value: string | null) => void - Fires once when the selected value changes.
  Selecting the same command again is silent; use onSelect for every activation.

### Search / Filtering Props
- **search**: string (bindable, default: '') - Search query.
- **defaultSearch**: string (default: '') - Initial query when search is omitted.
- **onSearchChange**: (search: string) => void - Fires once when the query changes.
- **placeholder**: string (default: 'Type a command or search...')
- **showInput**: boolean (default: true) - Render the search input row.
- **shouldFilter**: boolean (default: true) - Filter internally; set false to filter externally.
- **filter**: (item, search) => boolean - Custom match predicate (defaults to case-insensitive
  substring match on label + keywords + value).

### Event Props
- **onSelect**: (value: string) => void - Activation callback: fires for every selected item (after the item's own onSelect), including a repeat selection of the already-selected command.
- Callback-naming decision: Command owns a selected-value state, so the state change keeps the
  \`value\`/\`defaultValue\`/\`onValueChange\` trio and \`onSelect\` stays the pick event — the
  \`onSelect\` name is reserved for "the user picked this item", never for a value change.
- **onHighlightChange**: (value: string | undefined) => void - Fires when the highlighted option moves.

### Content Props (Slots)
- **empty**: Slot (default: 'No results found.') - Empty-state content.
- **item**: Snippet<[CommandItem]> - Custom row renderer, replaces icon/label/shortcut layout.
- **trigger**: Slot<{ open, close }> - Dialog trigger; call \`open()\` on click. Dialog mode only.
- **footer**: Slot<{ open, close }> - Bar rendered below the list (e.g. shortcut hints).

### Advanced Props
- **theme**: CommandThemeProps - Overrides for parts: command, inputWrapper, inputGroup, inputIcon,
  input, list, empty, group, groupHeading, separator, item, shortcut.
- **class**: string - Classes for the palette root.

## Keyboard

- **ArrowDown / ArrowUp**: move the highlight, wrapping around both ends.
- **Home / End**: jump to first / last selectable item.
- **Enter**: select the highlighted item (navigates for href items).
- **Escape**: closes the dialog (dialog mode).
- **⌘/Ctrl + shortcut**: toggles the dialog (dialog mode with \`shortcut\` set).

## Accessibility

- The input is a \`role="combobox"\` with \`aria-activedescendant\` pointing at the highlighted option.
- The list is a \`role="listbox"\`; rows are \`role="option"\` with \`aria-selected\`/\`aria-disabled\`.
- Pointer movement highlights rows; the highlight re-anchors to the first result while typing.

## Notes

- Filtering happens per group; groups with no matching items are hidden and separators stay contiguous.
- Dialog mode reuses the Dialog component (modal type) with padding stripped and its close button hidden.
- Disabled items render dimmed and are skipped by keyboard navigation.

## Motion

- In \`dialog\` mode the palette rides the Dialog's **motion** slot: \`commandDialogTheme.motion\`
  drops it in from just above its resting place on \`duration: 'fast'\`.
- Retune it with \`<Theme components={{ dialog: { motion } }}>\` or \`setDialogTheme({ motion })\`;
  reduced motion collapses it to 0.
`;
