export const spinnerDescription = `
# Spinner Component

The Spinner component is a standalone indeterminate loading indicator. It inherits \`spinnerVariant\` from Theme and allows a per-instance override. The \`default\` variant uses the global \`.ui-spinner\` engine from the Entasis Tailwind plugin.

## Basic Usage

\`\`\`svelte
<Spinner />
\`\`\`

## Props

- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - Controls indicator size and label typography.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' (default: 'neutral')
  - Applies a theme color token to the indicator.
- **variant**: 'default' | 'grid' | 'pulse' | 'puff' | 'lines' | 'circles' (default: Theme spinnerVariant, then 'default')
  - Selects the indicator animation and overrides the global Theme setting.
- **text**: string | Snippet
  - Optional visible loading text rendered after the indicator.
- **children**: Snippet
  - Rich visible label content. When provided, it replaces \`text\`.
- **label**: string (default: 'Loading')
  - Accessible label used when no visible text is rendered.
- **decorative**: boolean (default: false)
  - Removes status semantics and hides the spinner from assistive technology.
- **class**: string
  - Additional classes for the root element.
- **theme**: SpinnerThemeProps
  - Per-instance theme overrides.

## Examples

### Icon-only Spinner

\`\`\`svelte
<Spinner label="Loading results" />
\`\`\`

### Spinner With Text

\`\`\`svelte
<Spinner text="Loading results" />
\`\`\`

### Indicator Variants

\`\`\`svelte
<Spinner variant="grid" />
<Spinner variant="pulse" />
<Spinner variant="puff" />
<Spinner variant="lines" />
<Spinner variant="circles" />
\`\`\`

### Global Default

\`\`\`svelte
<Theme spinnerVariant="pulse">
	<Spinner />
</Theme>
\`\`\`

### Semantic Colors

\`\`\`svelte
<div class="flex items-center gap-3">
	<Spinner color="primary" />
	<Spinner color="success" />
	<Spinner color="danger" />
</div>
\`\`\`

### Decorative Spinner

\`\`\`svelte
<button aria-busy="true">
	<Spinner decorative size="small" />
	Saving
</button>
\`\`\`

## Accessibility

- The component renders \`role="status"\` and \`aria-live="polite"\` by default.
- When no visible text is provided, \`label\` becomes the accessible name.
- Use \`decorative\` when another nearby element already announces the loading state.

## Theme Customization

The theme object contains three parts:

- **root**: root inline-flex wrapper
- **indicator**: animated indicator element with size and variant classes
- **label**: visible text wrapper

\`\`\`svelte
<script>
	import { setSpinnerTheme } from 'entasis/spinner';

	setSpinnerTheme({
		indicator: {
			size: {
				normal: '[--spinner-size:1.5rem]'
			}
		}
	});
</script>
\`\`\`
`;
