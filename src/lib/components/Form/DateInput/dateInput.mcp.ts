export const dateInputDescription = `
# DateInput

Masked native text entry composed with Field and DateSelector. The bindable value is a native \`Date | null\`.

## Import

\`\`\`svelte
<script lang="ts">
  import { DateInput } from 'svelai/date-input';
</script>
\`\`\`

## Usage

\`\`\`svelte
<script lang="ts">
  let value = $state<Date | null>(null);
</script>

<DateInput label="Start date" bind:value />
\`\`\`

## Date formatting

Use \`format\` with \`dd\`, \`mm\`, \`yy\`, and \`yyyy\` segments. Supported values include \`dd/mm/yyyy\`, \`mm/dd/yyyy\`, \`mm/yyyy\`, and \`yyyy/mm/dd\`. The \`separator\` prop replaces the slash in the rendered mask.

## Selector options

- \`presets\`: date shortcuts shaped as \`{ label, value }\`.
- \`disabledDates\`: individual dates or inclusive date ranges.
- \`minDate\` / \`maxDate\`: calendar selection bounds.
- \`calendarView\`: \`'single' | 'double'\`.
- \`mobileSheet\`: renders the DateSelector as a bottom sheet below 768px.
- \`closeOnSelect\`: closes after choosing a date; defaults to \`false\`.
- \`onCalendarSelect\`: called only when a date is chosen from the selector or its presets;
  \`onValueChange\` continues to report both typed and selected valid dates.

\`\`\`svelte
<DateInput
  label="Delivery date"
  bind:value
  minDate={new Date()}
  presets={[
    { label: 'Tomorrow', value: new Date(2026, 6, 16) },
    { label: 'Next week', value: new Date(2026, 6, 22) }
  ]}
/>
\`\`\`

The input opens its selector on focus or from the full-height field action button. It stays open after selection unless \`closeOnSelect\` is enabled. Calendar days support arrow, Home/End, and PageUp/PageDown navigation.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
