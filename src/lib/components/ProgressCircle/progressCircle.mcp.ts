export const progressCircleDescription = `
# ProgressCircle Component

ProgressCircle is a compact circular progress indicator with a visible track and an arc that animates when the value changes. A null value makes it indeterminate: the arc spins.

## Basic Usage

\`\`\`svelte
<ProgressCircle />
\`\`\`

## Props

- **value**: number | null (default: 0)
  - Progress between min and max. Values outside the range are clamped. null is indeterminate: aria-valuenow is dropped, data-indeterminate is set and the arc spins.
- **min**: number (default: 0)
  - Value at which the arc is empty (aria-valuemin).
- **max**: number (default: 100)
  - Value at which the arc is full (aria-valuemax). data-complete is set once the clamped value reaches it.
- **format**: Intl.NumberFormatOptions
  - Formats the clamped value for the value text (for example { style: 'unit', unit: 'megabyte' }). Without it the text is the percentage of the range.
- **getAriaValueText**: (payload: { value, formattedValue, min, max }) => string
  - Overrides aria-valuetext. value is null while indeterminate.
- **locale**: Intl.LocalesArgument
  - Locale of the value text (default: the I18n locale).
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Selects semantic component geometry.
- **diameter**: number
  - Optional explicit circle diameter in pixels.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' (default: 'primary')
  - Applies a theme color token to the animated arc.
- **label**: string (default: 'Progress')
  - Accessible label used when the component is not decorative.
- **decorative**: boolean (default: false)
  - Removes progress semantics and hides the element from assistive technology.
- **class**: string
  - Additional classes for the root element.
- **theme**: ProgressCircleThemeProps
  - Per-instance theme overrides.

## Examples

\`\`\`svelte
<ProgressCircle size="small" />
<ProgressCircle value={45} color="danger" />
<ProgressCircle value={72} diameter={56} color="success" />
<ProgressCircle value={null} label="Loading" />
<ProgressCircle value={30} min={20} max={40} label="Temperature" />
\`\`\`

## Accessibility

- The component renders \`role="progressbar"\` with \`aria-valuenow\` (the clamped value), \`aria-valuemin\`, \`aria-valuemax\`, and \`aria-valuetext\` (the formatted value, for example "45%") by default. While indeterminate, aria-valuenow is omitted and the value text is "Indeterminate progress" (i18n progressIndeterminate).
- A visually hidden presentational text node inside the root carries the value text, because NVDA ignores the name of a progressbar with no text content.
- Styling hooks: data-indeterminate, data-progressing and data-complete on the root.
- Use \`label\` to provide a specific accessible name.
- Use \`decorative\` when nearby UI already announces the loading state.

## Theme Parts

- **root**: inline wrapper and color/size token host
- **svg**: animated SVG element
- **track**: background circle
- **indicator**: active arc
`;
