export const segmentedControlDescription = `
# SegmentedControl

A compact single-selection input for switching between a small set of mutually exclusive modes. It uses radiogroup/radio semantics and an animated indicator that slides and resizes to the selected item.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { SegmentedControl } from 'svelai/segmented-control';
  import { gridFourIcon } from 'svelai/icons/gridFour';
  import { listIcon } from 'svelai/icons/list';

  const items = [
    { value: 'grid', label: 'Grid', icon: gridFourIcon },
    { value: 'list', label: 'List', icon: listIcon }
  ] as const;

  let value = $state<(typeof items)[number]['value']>('grid');
</script>

<SegmentedControl {items} bind:value />
\`\`\`

## Props

- **items**: \`readonly SegmentedControlItem[]\` — required options with unique \`value\` fields.
- **value**: \`string\` — bindable selected value; defaults to the first enabled item.
- **defaultValue**: \`string\` — initial selected value when value is omitted.
- **onValueChange**: \`(value: string) => void\` — called once after user interaction changes the value.
- **item**: \`Snippet<[SegmentedControlItem]>\` — replaces the default item renderer.
- **size**: \`'small' | 'normal' | 'large'\` — defaults to \`'normal'\`.
- **color**: semantic color — controls the selected pill and focus ring; defaults to \`'neutral'\`.
- **variant**: \`'normal' | 'pill'\` — controls corner radius; defaults to the moderately rounded \`'normal'\` shape.
- **disabled**: \`boolean\` — disables the full control.
- **ariaLabel**: \`string\` — accessible radiogroup name; defaults to \`'Segmented control'\`.
- **class**: additional root classes.
- **theme**: component theme overrides.

## Item shape

\`\`\`ts
type SegmentedControlItem<Value extends string = string> = {
  value: Value;
  label?: string | Snippet;
  icon?: string | Snippet;
  ariaLabel?: string;
  disabled?: boolean;
};
\`\`\`

The default renderer displays \`icon\`, then \`label\`. An item with only an icon remains icon-only; use \`ariaLabel\` when its value is not a suitable accessible name. If neither is provided, the value is displayed.

## Custom item renderer

\`\`\`svelte
<SegmentedControl {items} bind:value>
  {#snippet item(option)}
    <span>{option.label}</span>
    <span>{option.count}</span>
  {/snippet}
</SegmentedControl>
\`\`\`

Extra fields on item objects remain available to the snippet through generic inference.

## Shapes

\`variant="normal"\` uses a moderately rounded track and segments. Use \`variant="pill"\` for the fully rounded stadium shape.

\`\`\`svelte
<SegmentedControl {items} bind:value />
<SegmentedControl {items} bind:value variant="pill" />
\`\`\`

## Keyboard behavior

- Tab enters on the selected item, or the first enabled item when no value matches.
- Arrow Left/Right moves and selects, wrapping at the ends.
- Home/End selects the first/last enabled item.
- Disabled items are skipped.

Each item has an invisible, size-aware pointer target that extends beyond the visual track: 36px for small, 44px for normal, and 48px for large. Adjacent targets meet at the midpoint of the configured gap instead of overlapping.

Use SegmentedControl for mode or value selection. Use Tabbar when changing navigational views with tab semantics.
`;
