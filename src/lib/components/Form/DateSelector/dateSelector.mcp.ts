export const dateSelectorDescription = `
# DateSelector

Popover calendar composition for selecting one date, a range, or multiple dates. It uses SvelAI's Popover, CalendarPrimitive, Button, and transitionSize attachment.
\`DateSelector\` is the raw popover primitive; \`DateSelectorInput\` wraps it in the standard field
chrome (label, description, errors, form registration) and extends InputProps — field type 'date'
for \`mode="date"\`, 'calendar-range' for \`mode="range"\` (\`mode="multiple"\` has no field type and
stays primitive-only).

## Import

\`\`\`svelte
<script lang="ts">
  import { DateSelector, DateSelectorInput } from 'svelai/date-selector';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<script lang="ts">
  let value = $state<Date | null>(null);
</script>

<!-- Field variant: label/description/errors like every other form input -->
<DateSelectorInput
	label="Due date"
	description="We'll remind you the day before"
	bind:value
/>

<!-- Raw popover primitive -->
<DateSelector bind:value />
\`\`\`

## DateSelectorInput (field variant)

Accepts every field prop from InputProps — \`label\`, \`description\`, \`name\`, \`required\`, \`errors\`,
\`onValidate\`, \`helper\`, snippets, … — plus the selector props (\`mode\`, \`presets\`, \`trigger\`,
\`closeOnSelect\`, \`position\`, \`minDate\`/\`maxDate\`, …). \`theme\` is split: \`theme.selector\` for the
popover parts, \`theme.field\` for the field wrapper.

## Selection modes

- \`mode="date"\` binds \`Date | null\`.
- \`mode="range"\` binds \`[Date | null, Date | null] | null\`.
- \`mode="multiple"\` binds \`Date[]\`.

The selector stays open after selection by default. Set \`closeOnSelect\` to close after a date, a complete range, or a multiple-date change.

## Presets

\`\`\`svelte
<DateSelector
  bind:value
  presets={[
    { label: 'Today', value: new Date() },
    { label: 'Tomorrow', value: new Date(2026, 6, 16) }
  ]}
/>
\`\`\`

Each preset value must match the active mode. Presets follow the same \`closeOnSelect\` policy as calendar selection.

## Custom trigger

The \`trigger\` prop follows Popover's trigger contract. A trigger snippet receives \`PopoverState\`; attach \`popover.reference\` to the trigger element and call \`popover.toggle()\`.

## Calendar configuration

Use \`view\`, \`weekStartsOnMonday\`, \`weekdayLength\`, \`locale\`, \`minDate\`, \`maxDate\`, and \`disabledDates\` to configure the embedded calendar. Set \`mobileSheet\` to render the selector as a bottom sheet below 768px.

The content container animates intrinsic height changes. Month navigation uses a direction-aware slide and respects reduced-motion preferences.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.
- **open**: bindable popover visibility.
- **defaultOpen**: initializes an uncontrolled selector once.
- **onOpenChange**: receives the new boolean once for each opening or closing interaction.

Selecting the current date or preset does not emit another value callback. With closeOnSelect,
that selection can still close the popover and emit one onOpenChange callback.

`;
