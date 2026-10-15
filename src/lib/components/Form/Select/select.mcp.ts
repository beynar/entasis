export const selectDescription = `
# Select Component

A custom (non-native) selection field: a combobox trigger opening a listbox popover, with full
keyboard navigation, type-to-select, grouped options, read-only and multiple selection, browser
autofill and Field/Form integration. Like a native select (and Radix's item-aligned or Base UI's
\`alignItemWithTrigger\` position), the listbox opens over the trigger with the selected option
sitting on the value.

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

## Multiple selection

\`multiple\` makes the Select hold a list of values (field type \`select-multiple\`). The list stays
open while options are toggled with a click, Enter or Space, the listbox is \`aria-multiselectable\`,
every selected option shows its check, and \`value\` is an array in item order.

\`\`\`svelte
<Select
	multiple
	label="Toppings"
	bind:value={toppings}
	items={[
		{ value: 'olives', label: 'Olives' },
		{ value: 'basil', label: 'Basil' },
		{ value: 'ham', label: 'Ham' }
	]}
/>
\`\`\`

The trigger lists the first two selected labels and counts the rest (\`Olives, Basil +1\`); pass
\`formatValue\` to write your own text. The list opens on the first selected option in item order.
A native form submits one hidden input per value under the same \`name\` (read them with
\`FormData.getAll\`), and a required multiple Select needs at least one value. In a Form, use
\`type: 'select-multiple'\`.

## Props

Extends all Field component props plus:

### Core Props
- **value**: string | null (bindable) - Selected value; with \`multiple\`, a (readonly) string array in item order
- **multiple**: boolean (default: false) - Hold several values; the list stays open while options are toggled
- **formatValue**: (options: SelectOption[]) => string - With \`multiple\`, the text the trigger shows for the selected options (default: two labels and \`+N\`)
- **clearable**: boolean (default: false) - Adds a button that clears the selection (\`null\`, or \`[]\` with \`multiple\`) and returns focus to the trigger; hidden while empty, read-only or disabled
- **id**: string - Id of the trigger button, so an external \`<label for>\` can name it; without a \`label\` the trigger's placeholder fallback steps aside when such a label exists
- **autocomplete**: string - Autofill token (\`country\`, \`address-level1\`...). Renders a visually hidden text input the browser can autofill; the filled text selects the option whose value matches, else whose label matches (ignoring case and accents). Autofill never opens the list and is ignored while disabled or read-only
- **items**: readonly (SelectOption | SelectOptionGroup)[] - Flat \`{ value, label, disabled? }\` options and/or \`{ label, items }\` groups; readonly arrays and \`as const\` data are accepted
- **placeholder**: string (default: 'Select an option') - Trigger text when no selection
- **separators**: boolean (default: true) - Render separators between consecutive groups
- **alignItemWithTrigger**: boolean (default: true) - Open over the trigger with the selected option (the first enabled one when nothing is selected) on the trigger's middle and its text on the value text. A list taller than the viewport is capped 8px from the edges and pre-scrolled so the option stays on the trigger, and a \`max-height\` the theme puts on the \`list\` slot caps it further; a trigger too close to the bottom for four rows gives up the alignment and the panel rises into view. Wheel and touch scrolling outside the panel are blocked while it is open, so the trigger cannot move away from it. Only a mouse or keyboard open aligns: a list opened by touch is a dropdown below the trigger. \`false\` opens a dropdown below the trigger always, capped at 240px or the room left beside the trigger

### Field Props (inherited)
- **label**: string | Snippet - Field label, and the trigger's accessible name; without it the trigger falls back to the placeholder
- **description**: string | Snippet - Helper text
- **required**: boolean - Mark as required. A native form is blocked from submitting while nothing is selected (the browser's report moves to the trigger); a disabled Select is not required
- **disabled**: boolean - Disable the trigger; the hidden inputs are disabled too, so a native form post leaves the value out
- **readOnly**: boolean - The list opens and can be browsed (arrows, Home, End, typing, hover), but no option can be chosen and the value cannot change. The trigger carries \`aria-readonly\` and \`data-readonly\` (the popup does not), typing on the closed trigger picks nothing, \`clearable\` hides its button, and the value is still submitted by a native form
- **open**: boolean (bindable) - Whether the list is open
- **defaultOpen**: boolean (default: false) - Initial open state when \`open\` is not provided
- **size**: 'small' | 'normal' | 'large' - Trigger and dropdown size
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height)
- **name**: string - Form field name; also renders a hidden input per value for native form posts (disabled while the Select is disabled; a read-only Select still submits)

### Bindable Props
- **value**: string - Selected value
- **errors**: string[] - Validation errors
- **focused**: boolean - Trigger focus state

### Callbacks
- **onValueChange**: (value) => void - Fires when the selection changes: the new string or \`null\`, or with \`multiple\` the new array (once per toggle)
- **onValidate**: (value) => string[] | boolean - Custom validation
- **onOpenChange**: (open, details) => void - Runs before the list opens or closes. \`details\` carries \`reason\` (\`'trigger-press'\`, \`'list-navigation'\` for an arrow-key open, \`'item-press'\`, \`'escape-key'\`, \`'outside-press'\` (a press outside the list), \`'focus-out'\`, \`'close-press'\`, \`'imperative-action'\`), the originating \`event\`, the \`trigger\`, the \`interaction\` (\`'mouse'\`, \`'touch'\`, \`'pen'\`, \`'keyboard'\`, \`'programmatic'\`) and \`cancel()\`, which keeps the list as it is. Setting \`open\` from outside is silent
- **onAfterOpen** / **onAfterClose**: () => void - Once per open and close, after the transition (right away when none plays)

### Advanced Props
- **triggerAttrs**: native attributes for the trigger button (handlers run before the built-in ones; \`preventDefault()\` cancels them)
- **theme**: SelectThemeProps - Theme overrides (input, inputContainer, value, triggerIcon, content, list, listbox, group, groupLabel, separator). The \`list\` slot is the scrolling list: its \`dropdown\` variant carries the 240px cap of a dropdown, and a \`max-height\` you put on it caps an item-aligned list too

## Keyboard

- Closed: ArrowDown / ArrowUp / Enter / Space open the dropdown, anchored on the selected option (the first selected one with \`multiple\`)
- Open: ArrowDown / ArrowUp move the highlight (wrap-around), Home / End jump, Enter / Space select (toggle with \`multiple\`), Escape closes, Tab closes and moves focus on
- Type-ahead: typing letters while the trigger has focus moves the highlight to the next option whose label starts with the typed text. Space continues the search while characters are buffered (\`united s\` reaches United States) and selects only when the search is over. The buffer clears after a second and whenever the list closes
- Typing on a closed trigger picks the matching option without opening the list, as a native select does, with one \`onValueChange\` (not with \`multiple\` or \`readOnly\`)
- Disabled options are skipped by the highlight and the type-ahead

## Styling hooks

The trigger, the field container, the list panel and every option carry state attributes. \`data-highlighted\` and \`data-selected\` are written as \`"true"\`; match them by presence (\`[data-highlighted]\`).

Attributes are presence attributes (set while the state holds, omitted otherwise) unless they carry a value.

**Data attributes**
- \`data-popup-open\`: On the trigger button and the field container around it: present while the list is open.
- \`data-placeholder\`: On the trigger: present while no value is chosen and the placeholder shows.
- \`data-disabled\`: On the trigger: present while disabled. On an option: present while it is disabled.
- \`data-readonly\`: On the trigger: present while \`readOnly\`.
- \`data-popup-side\`: On the field container: \`none\` while the list is placed over the trigger, otherwise the side it sits on.
- \`data-highlighted\`: On an option: present while the keyboard or the pointer highlights it.
- \`data-selected\`: On an option: present while it is selected.
- \`data-open\`: On the list panel: present while open.
- \`data-closed\`: On the list panel: present while its exit transition plays.
- \`data-entering\`: On the list panel: present while the enter transition plays.
- \`data-exiting\`: On the list panel: present while the exit transition plays.
- \`data-side\`: On the list panel: \`none\` while it is placed over the trigger (aligned on the selected option), otherwise the side of the trigger it sits on.

**CSS variables** (set on the list panel's positioned wrapper and inherited by the list; the mobile sheet has none)
- \`--available-width\`: The width in px the panel can take before it reaches the viewport edges, minus 20px.
- \`--available-height\`: The room in px between the trigger and the viewport edge on the panel's side, minus 20px. Cap a scrolling list with \`max-height: min(240px, var(--available-height))\`.
- \`--anchor-width\`: The trigger's width in px, snapped to the device pixel grid.
- \`--anchor-height\`: The trigger's height in px, snapped to the device pixel grid.
- \`--transform-origin\`: The panel corner facing the trigger, mirrored in right-to-left documents; the point the panel scales from.

The typed maps \`selectDataAttributes\` and \`selectCssVariables\` (from \`entasis/select\`) list each name with its meaning.

## Accessibility

ARIA 1.2 select-only combobox pattern: the trigger is a \`role="combobox"\` button with
\`aria-haspopup="listbox"\`, \`aria-expanded\`, and \`aria-controls\`; DOM focus stays on the
trigger while \`aria-activedescendant\` tracks the highlighted \`role="option"\` (virtual focus).
The selected option shows a check indicator and \`aria-selected\`.

The scrolling viewport is the listbox (\`role="listbox"\`, \`tabindex="-1"\`), so the list scrolls
inside the element that owns the options and no extra scroll group or tab stop appears when it
overflows. The listbox owns only options and \`role="group"\` sets: bare options sit directly under
it, a group exists only for a labelled set. Group separators are \`role="presentation"\`, group
labels are \`aria-hidden\` (each group is named through \`aria-label\`), and the scrollbars are
\`aria-hidden\` and sit outside the listbox. \`multiple\` adds \`aria-multiselectable\`.

The trigger is the only tab stop; the label focuses it without opening the list. Touch
screen readers move focus onto options instead of using the virtual cursor, so focus entering the
panel keeps the list open (it closes when focus leaves both the trigger and the panel), Escape on a
focused option closes it and returns focus to the trigger, and a visually hidden "Close" button at
the end of the panel gives users with no Escape key a way out.

The trigger always has an accessible name: \`label\` names it through the Field label (a string
label as a \`<label for>\`, a snippet through \`aria-labelledby\`), and without one the trigger
falls back to \`placeholder\`, then to the catalog's "Select an option". Pass \`label\` whenever
an unlabelled select sits in a toolbar or filter row, so the name says which control it is
rather than repeating the placeholder.

## Notes

- Selection re-focuses the trigger (matches native select behavior); with \`multiple\` the list stays open and focus stays on the trigger
- Clicking outside closes via trigger blur; option rows prevent mousedown so the click can land. A list opened from outside (\`open\`, \`defaultOpen\`) moves focus to the trigger, so Escape, the arrow keys and clicking away work the same, and it is measured afresh each time it opens
- A \`<label for>\` pointing at \`id\` names the trigger and focuses it on click
- The list scrolls (ScrollArea) beyond the viewport when item-aligned, beyond 240px as a dropdown (less when there is less room beside the trigger: the dropdown list is capped by the Popover's \`--available-height\`, so it never runs under an on-screen keyboard or over its trigger); the highlight scrolls into view on keyboard nav
- While the dropdown is open, the input container carries \`data-popup-side\` (\`bottom\`, \`top\`, or \`none\` when item-aligned) and the panel \`data-side\`, so a theme can flatten the corner where they meet
- The trigger carries \`data-placeholder\` while nothing is selected and \`data-readonly\` while read-only
- Option rows are lean: a titled row with a check, using MenuOption's theme, and each option's id comes from a map, so a list of a thousand options opens without a search per row. Option ids are numbered in the order they are first needed, so values that would collide once sanitised (\`a.b\`, \`a_b\`) never share an id
- The panel covers the trigger while open, so clicking outside (not the trigger) closes it, as with a native select

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.
- **open**: bindable disclosure state; **defaultOpen** initial state; **onOpenChange** reports every user-driven change before it happens and may cancel it; **onAfterOpen** / **onAfterClose** fire once per open and close.

`;
