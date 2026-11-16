export const dateInputDescription = `
# DateInput

Masked native text entry composed with Field and DateSelector. The bindable value is a native \`Date | null\`.

## Import

\`\`\`svelte
<script lang="ts">
  import { DateInput } from 'entasis/date-input';
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

\`type="datetime"\` edits the day and the hour: its default format is \`dd/mm/yyyy HH:MM\` (also \`mm/dd/yyyy HH:MM\` and \`yyyy/mm/dd HH:MM\`), and picking a day in the calendar or editing only the date keeps the hour. A Form entry \`{ type: 'datetime' }\` renders it. \`timeZone\` (an IANA name such as \`Europe/Paris\`) shows and reads the day and hour in that zone whatever the browser's; the value stays a \`Date\`, the same instant. An hour that occurs twice when clocks go back reads as its first occurrence; an hour skipped when they go forward moves to the hour after.

\`\`\`svelte
<script lang="ts">
	import { DateInput } from 'entasis/date-input';

	let startsAt = $state<Date | null>(null);
</script>

<DateInput label="Starts at" type="datetime" timeZone="Europe/Paris" bind:value={startsAt} />
\`\`\`

## Granularity: a week, a month or a year

\`granularity\` (\`'day' | 'week' | 'month' | 'year'\`, default \`'day'\`) makes the value a whole period: its **first day at midnight** (in \`timeZone\` when given). The calendar popup picks with the same granularity, and the default mask follows it:

- \`month\`: typed \`mm/yyyy\`, or \`yyyy/mm\` in locales that write the year first (Japanese, Chinese).
- \`year\`: typed \`yyyy\`.
- \`week\`: typed as any day of the week (\`dd/mm/yyyy\`); the value is that week's first day (Monday, or Sunday with \`weekStartsOnMonday={false}\`), the text shows that day once the field loses focus, and the ISO week number ("W12", the catalog's \`calendarWeekShort\`) sits beside it.

\`\`\`svelte
<DateInput label="Billing month" granularity="month" bind:value />
<DateInput label="Sprint week" granularity="week" bind:value={week} />
<DateInput label="Fiscal year" granularity="year" bind:value={year} />
\`\`\`

A \`format\` you pass still wins; whatever date it reads is moved to the start of its period. A granularity other than \`'day'\` edits no hour, even with \`type="datetime"\`.

## Selector options

- \`presets\`: date shortcuts shaped as \`{ label, value }\`.
- \`disabledDates\`: individual dates or inclusive date ranges.
- \`minDate\` / \`maxDate\`: calendar selection bounds.
- \`calendarView\`: \`'single' | 'double'\`.
- \`mobileSheet\`: renders the DateSelector as a bottom sheet below 768px.
- \`closeOnSelect\`: closes after choosing a date; defaults to \`false\`.
- \`onSelect\`: the pick event -- fires only when a date is chosen from the selector or its
  presets; \`onValueChange\` is the value state change and reports both typed and picked dates.

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

The selector never opens on focus, so tabbing through the field does not pop it. Open it with ArrowDown while the input has focus (focus moves onto the selected day, and Escape returns to the input), or from the full-height calendar button (which carries \`aria-haspopup="dialog"\`, \`aria-expanded\`, and \`aria-controls\`). It stays open after selection unless \`closeOnSelect\` is enabled. Calendar days support arrow, Home/End, and PageUp/PageDown navigation.

## Disabled and read-only

- **disabled**: boolean - Disable the input and the calendar button; a disabled field leaves Form values and posts nothing.
- **readOnly**: boolean - The input stays focusable and is announced as read-only; typing and selector picks are refused, and the value still validates and submits. A read-only Form, FormGroup or fieldset Field makes it read-only too.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
