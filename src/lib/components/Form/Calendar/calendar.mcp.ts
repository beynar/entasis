export const calendarDescription = `
# Calendar

Date-based calendar primitives for single, range, and multiple selection. CalendarPrimitive is the visual primitive; CalendarInput wraps single and range modes in the Form Field contract.

## Import

\`\`\`svelte
<script lang="ts">
  import { CalendarPrimitive, CalendarInput } from 'entasis/calendar';
</script>
\`\`\`

## Single date

\`\`\`svelte
<script lang="ts">
  let value = $state<Date | null>(null);
</script>

<CalendarPrimitive type="calendar" bind:value />
\`\`\`

## Range

\`\`\`svelte
<script lang="ts">
  let value = $state<[Date | null, Date | null] | null>(null);
</script>

<CalendarPrimitive type="calendar-range" bind:value />
\`\`\`

## Multiple dates

\`\`\`svelte
<script lang="ts">
  let value = $state<Date[]>([]);
</script>

<CalendarPrimitive type="calendar-multiple" bind:value />
\`\`\`

## Granularity

\`granularity\` picks a period instead of a day: \`'day'\` (default), \`'week'\`, \`'month'\` or \`'year'\`. The value keeps the shape of \`type\`, with \`Date\` values:

- A selected period is its **first day** (host-local noon, like every calendar date). A week starts on \`weekStartsOn\` (Monday by default, or Sunday with \`weekStartsOnMonday={false}\`).
- A range runs from the first day of its first period to the **last day** of its last period, so \`[start, end]\` stays an inclusive day range: picking March then May gives \`[1 March, 31 May]\`.
- Values set from outside are read by period: any day of a month selects that month.
- A period is disabled only when **all** of its days are (\`minDate\`, \`maxDate\`, \`disabledDates\`); a week with some disabled days stays selectable and marks those days \`data-unavailable\`.

\`\`\`svelte
<script lang="ts">
  let month = $state<Date | null>(null);
  let weeks = $state<[Date | null, Date | null] | null>(null);
</script>

<CalendarPrimitive type="calendar" granularity="month" bind:value={month} />
<CalendarPrimitive type="calendar-range" granularity="week" bind:value={weeks} />
\`\`\`

- **week**: the day grid, led by a column of ISO 8601 week numbers (a row that does not start on Monday takes the ISO week of its Thursday). Hovering a day highlights its whole row (\`data-highlighted="true"\` on its seven days, never for touch), and a click selects the row. Each day's accessible name ends with its week ("Week 12, 2026", from the catalog's \`calendarWeekLabel\`).
- **month**: a 3×4 grid of the year's months under the year, with Previous/Next year buttons.
- **year**: a 3×4 grid of a decade with one year on each side (2019–2030 for the 2020s; the side years carry \`data-outside\`), with Previous/Next decade buttons.

Labels come from Intl in the active locale (the \`locale\` prop, then the I18n locale). \`getPeriodStart\`, \`getPeriodEnd\` and \`getIsoWeek\` are exported to compute the same periods in app code.

## Main props

- \`type\`: \`'calendar' | 'calendar-range' | 'calendar-multiple'\`.
- \`granularity\`: \`'day' | 'week' | 'month' | 'year'\`, see above.
- \`value\`: bindable value matching the selected type.
- \`view\`: \`'single' | 'double'\`. Double view falls back to one month when the calendar container is narrower than 576px.
- \`disabledDates\`: individual dates or inclusive \`[start, end]\` ranges.
- \`minDate\` / \`maxDate\`: selection bounds.
- \`readOnly\`: months can be browsed but no date can be selected; the grid reports aria-readonly.
- \`events\`: values with \`start\` and \`end\`; matching events are exposed to the custom cell snippet.
- \`cell\`: custom day renderer receiving the complete Calendar cell payload.
- \`onViewChange\`: receives the first and last visible month after pointer, keyboard, or controlled-value navigation.

## Keyboard

The visible month title opens an in-place month and year chooser composed from two scroll areas. Each list uses roving focus with ArrowUp/ArrowDown and Home/End, ArrowLeft/ArrowRight move between the month and year lists (mirrored in RTL), and Escape returns to the day grid. Arrow keys held with Alt, Ctrl or Meta are left to the browser.

Day focus is roving. Arrow keys move by day or week, Home/End move to week boundaries, PageUp/PageDown move by month, and Shift+PageUp/PageDown move by year. Enter or Space uses the native day button activation.

Month and year grids (\`granularity\` \`'month'\` or \`'year'\`) follow the APG grid pattern: ArrowLeft/ArrowRight move one period (mirrored in RTL), ArrowUp/ArrowDown move one row of three, Home/End reach the row's ends (with Ctrl or Meta, the page's ends), PageUp/PageDown change the year of a month grid or the decade of a year grid, and Enter or Space selects. Focus skips disabled periods and moves to the next page when it leaves the one shown; one cell keeps the tab stop. A week granularity keeps the day keys: ArrowUp/ArrowDown move by week.

## Styling hooks

Day and period cells write \`data-date\` (the first day, \`yyyy-mm-dd\`), \`data-selected\`, \`data-in-range\`, \`data-start-of-range\`, \`data-end-of-range\`, \`data-disabled\` and \`data-is-today\`. Day cells add \`data-in-month\` and \`data-is-past\`; under a week granularity, \`data-highlighted="true"\` on the hovered week and \`data-unavailable\` on a day disabled inside a selectable week. Year cells beside their decade carry \`data-outside\`.

Month navigation slides in chronological direction while the viewport transitions to its new intrinsic height. Double view responds to the calendar container rather than the browser viewport, so it safely falls back to one month in narrow layouts. Both animations respect reduced-motion preferences.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
