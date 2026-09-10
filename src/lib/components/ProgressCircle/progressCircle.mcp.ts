export const progressCircleDescription = `
# ProgressCircle Component

ProgressCircle is a compact determinate circular progress indicator with a visible track and an arc that animates when the value changes.

## Basic Usage

\`\`\`svelte
<ProgressCircle />
\`\`\`

## Props

- **value**: number (default: 0)
  - Progress value from 0 to 100. Values outside the range are clamped.
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
\`\`\`

## Accessibility

- The component renders \`role="progressbar"\` with \`aria-valuenow\`, \`aria-valuemin\`, and \`aria-valuemax\` by default.
- Use \`label\` to provide a specific accessible name.
- Use \`decorative\` when nearby UI already announces the loading state.

## Theme Parts

- **root**: inline wrapper and color/size token host
- **svg**: animated SVG element
- **track**: background circle
- **indicator**: active arc
`;
