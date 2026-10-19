export const timeInputDescription = `
# TimeInput

Masked time entry composed with Field, with a popover list of time options. The value is a number
counted from midnight, in the unit chosen by \`as\`.

## Import

\`\`\`svelte
<script lang="ts">
  import { TimeInput } from 'entasis/time-input';
</script>
\`\`\`

## Usage

\`\`\`svelte
<script lang="ts">
  let value = $state<number | null>(null);
</script>

<TimeInput label="Start time" format="HH:MM" bind:value />
\`\`\`

## Props

- **as**: 'minuteSinceMidnight' | 'secondSinceMidnight' | 'millisecondSinceMidnight' - Unit of the numeric value; defaults to milliseconds
- **format**: Maskito time mode such as \`HH:MM\` or \`HH:MM:SS\`; controls display and parsing
- **minValues** / **maxValues**: per-segment bounds passed to the time mask
- **placeholder**: string - Defaults to the \`format\` string
- **disabled**: boolean - Disable the input and the picker button; a disabled field leaves Form values and posts nothing
- **readOnly**: boolean - The input stays focusable and is announced as read-only; typing and picker choices are refused, and the value still validates and submits. A read-only Form, FormGroup or fieldset Field makes it read-only too
- **size**: 'small' | 'normal' | 'large' - Input size

The clock button stays out of the Tab order, so Tab moves to the next field; ArrowDown in the input opens the picker.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
