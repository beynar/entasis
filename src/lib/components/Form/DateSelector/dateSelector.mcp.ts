export const dateSelectorDescription = `
# DateSelector

Popover calendar composition for selecting one date, a range, or multiple dates. It uses Entasis's Popover, CalendarPrimitive, Button, and transitionSize attachment.
\`DateSelector\` is the raw popover primitive; \`DateSelectorInput\` wraps it in the standard field
chrome (label, description, errors, form registration) and extends InputProps — field type 'date'
for \`mode="date"\`, 'calendar-range' for \`mode="range"\` (\`mode="multiple"\` has no field type and
stays primitive-only).

## Import

\`\`\`svelte
<script lang="ts">
  import { DateSelector, DateSelectorInput } from 'entasis/date-selector';
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

## Granularity: weeks, months and years

\`granularity\` (\`'day' | 'week' | 'month' | 'year'\`, default \`'day'\`) makes one selection a whole period, in every \`mode\`. There are no separate month, week or year pickers.

\`\`\`svelte
<script lang="ts">
  let month = $state<Date | null>(null);
  let billing = $state<[Date | null, Date | null] | null>(null);
  let years = $state<Date[]>([]);
</script>

<DateSelector granularity="month" bind:value={month} />
<DateSelector granularity="week" mode="range" bind:value={billing} />
<DateSelector granularity="year" mode="multiple" bind:value={years} />
\`\`\`

- Values stay \`Date\`s in the mode's shape. A selected period is its **first day** (local noon, like day values); a week starts on Monday, or Sunday with \`weekStartsOnMonday={false}\`.
- A range runs from the first day of its first period to the **last day** of its last period, so it stays an inclusive day range: weeks 10 to 12 of 2026 are \`[2 March, 22 March]\`.
- Values set from outside are read by period, and every value the selector emits (picks and presets) is normalised that way; \`multiple\` keeps one date per period.
- A period is disabled only when all its days are (\`minDate\`, \`maxDate\`, \`disabledDates\`).
- The default trigger names the period: "March 2026", "Week 12, 2026" (the catalog's \`calendarWeekLabel\`), "2026", or "start – end" for a range.
- \`week\` shows the day grid with a leading column of ISO week numbers and selects whole rows (hover highlights the row). \`month\` shows a 3×4 grid of months paged by year, \`year\` a 3×4 grid of a decade with a year on each side. Arrow keys move one period (a row of three up and down; a week up and down), PageUp/PageDown change the year or decade, Home/End reach the row's ends. See the Calendar docs for the full keyboard and styling hooks.

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

The \`trigger\` prop follows Popover's trigger contract. A trigger snippet receives \`PopoverApi\` (from \`entasis/popover\`); attach \`popover.reference\` to the trigger element and call \`popover.toggle()\`.

## Calendar configuration

Use \`granularity\`, \`view\`, \`weekStartsOnMonday\`, \`weekdayLength\`, \`locale\`, \`minDate\`, \`maxDate\`, and \`disabledDates\` to configure the embedded calendar. Set \`readOnly\` to let the popup open while refusing date and preset choices. Set \`mobileSheet\` to render the selector as a bottom sheet below 768px. \`focusOnClose\` sets where focus goes when it closes (DateInput returns it to its text field), as on Popover.

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
