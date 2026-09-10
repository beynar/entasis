export const calendarDescription = `
# Calendar

Date-based calendar primitives for single, range, and multiple selection. CalendarPrimitive is the visual primitive; CalendarInput wraps single and range modes in the Form Field contract.

## Import

\`\`\`svelte
<script lang="ts">
  import { CalendarPrimitive, CalendarInput } from 'svelai/calendar';
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

## Main props

- \`type\`: \`'calendar' | 'calendar-range' | 'calendar-multiple'\`.
- \`value\`: bindable value matching the selected type.
- \`view\`: \`'single' | 'double'\`. Double view falls back to one month when the calendar container is narrower than 576px.
- \`disabledDates\`: individual dates or inclusive \`[start, end]\` ranges.
- \`minDate\` / \`maxDate\`: selection bounds.
- \`events\`: values with \`start\` and \`end\`; matching events are exposed to the custom cell snippet.
- \`cell\`: custom day renderer receiving the complete Calendar cell payload.
- \`onViewChange\`: receives the first and last visible month after pointer, keyboard, or controlled-value navigation.

## Keyboard

The visible month title opens an in-place month and year chooser composed from two scroll areas. Each list uses roving focus with ArrowUp/ArrowDown and Home/End; Escape returns to the day grid.

Day focus is roving. Arrow keys move by day or week, Home/End move to week boundaries, PageUp/PageDown move by month, and Shift+PageUp/PageDown move by year. Enter or Space uses the native day button activation.

Month navigation slides in chronological direction while the viewport transitions to its new intrinsic height. Double view responds to the calendar container rather than the browser viewport, so it safely falls back to one month in narrow layouts. Both animations respect reduced-motion preferences.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
