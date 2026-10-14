export const progressDescription = `
# Progress Component

Progress is a linear progress bar: a track with a fill that animates when the value changes. It is determinate by default and indeterminate when the value is null. A label and the value text sit in a header above the track.

Use Progress for work that is moving toward completion (uploads, imports, steps). Use Meter for a measurement on a known scale (disk usage), and ProgressCircle for a compact circular indicator.

## Basic Usage

\`\`\`svelte
<Progress value={45} label="Uploading" showValue />
\`\`\`

## Props

- **value**: number | null (default: 0)
  - Progress between min and max. Values outside the range are clamped. null is indeterminate: aria-valuenow is dropped, data-indeterminate is set and the fill slides along the track.
- **min**: number (default: 0)
  - Value at which the track is empty (aria-valuemin).
- **max**: number (default: 100)
  - Value at which the track is full (aria-valuemax). data-complete is set once the clamped value reaches it.
- **format**: Intl.NumberFormatOptions
  - Formats the clamped value for the value text (for example { style: 'unit', unit: 'megabyte' }). Without it the text is the percentage of the range.
- **getAriaValueText**: (payload: { value, formattedValue, min, max }) => string
  - Overrides aria-valuetext. value is null while indeterminate.
- **locale**: Intl.LocalesArgument
  - Locale of the value text (default: the I18n locale, so French reads "45 %").
- **label**: string | Snippet
  - Visible label in the header. It names the bar; without one the bar is named "Progress" from the i18n catalog.
- **showValue**: boolean (default: false)
  - Shows the value text on the trailing side of the header. It is always announced; this only makes it visible.
- **valueLabel**: Snippet<[{ value, formattedValue, percent, status }]>
  - Replaces the visible value text. status is 'indeterminate' | 'progressing' | 'complete'.
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Track thickness and text size.
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal')
  - Whitespace between the header and the track.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' (default: the Theme default color)
  - Semantic color of the fill.
- **ref**: HTMLElement | null (bindable)
  - Reference to the root element.
- **class**: string
  - Additional classes for the root element.
- **theme**: ProgressThemeProps
  - Per-instance theme overrides.

## Structure

\`\`\`
<Progress>              role="progressbar"
	<Header>            only with a label or showValue
		<Label />
		<Value />
	</Header>
	<Track>
		<Indicator />
	</Track>
</Progress>
\`\`\`

## Examples

\`\`\`svelte
<Progress value={72} color="success" />
<Progress value={null} label="Loading" />
<Progress value={3} max={5} label="Files" showValue format={{ style: 'decimal' }} />
<Progress value={30} min={20} max={40} label="Temperature" size="large" density="comfortable" />
\`\`\`

### Custom value text

\`\`\`svelte
<Progress value={2048} max={4096} label="Download" showValue format={{ style: 'unit', unit: 'megabyte' }}>
	{#snippet valueLabel({ formattedValue, status })}
		{status === 'complete' ? 'Done' : formattedValue}
	{/snippet}
</Progress>
\`\`\`

## Accessibility

- The root is \`role="progressbar"\` with \`aria-valuemin\`, \`aria-valuemax\`, \`aria-valuenow\` (the clamped value, omitted while indeterminate) and \`aria-valuetext\` (the formatted value; "Indeterminate progress" from the i18n catalog while indeterminate).
- A visible \`label\` names the bar through \`aria-labelledby\` and is presentational, so NVDA reads the name; without a label the bar is named from the catalog.
- The value text is always present as text inside the bar (visually hidden unless \`showValue\` draws it; an indeterminate bar has no visible value, so the hidden text stays), because NVDA ignores the name of a progressbar with no text content.
- The fill's slide animation stops under reduced motion (OS setting or the Theme reduceMotion override).

## Styling Hooks

- **data-indeterminate**, **data-progressing**, **data-complete** on the root (and data-indeterminate on the indicator)
- **data-color**, **data-size**, **data-density** on the root
- data-slot values: progress, progress-header, progress-label, progress-value, progress-track, progress-indicator

## Theme Parts

- **root** (density): column layout of header and track
- **header**: label and value row
- **label** (size): label text
- **value** (size): visible value text
- **track** (size): background track
- **indicator** (color): the fill
`;
