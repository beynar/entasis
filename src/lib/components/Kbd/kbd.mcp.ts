export const kbdDescription = `
# Kbd Component

The Kbd component displays keyboard keys and shortcuts. It renders a single key, or a group of keys side by side with an optional separator, using semantic \`<kbd>\` elements.

## Basic Usage

\`\`\`svelte
<Kbd>Esc</Kbd>
<Kbd keys={['⌘', 'K']} />
<Kbd keys={['Ctrl', 'B']} separator="+" />
\`\`\`

## Props

### Core Props
- **keys**: (string | Snippet)[] - Renders multiple keys side by side inside a group. Each entry is a string label or a snippet for rich content (icons, etc). When set, \`children\` is ignored.
- **separator**: string | Snippet - Separator rendered between adjacent keys when \`keys\` is set (e.g. \`"+"\` for \`Ctrl + B\`).
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: Compact keys for dense UI
  - normal: Standard key size
  - large: Larger keys for emphasis
- **color**: Colors (default: 'neutral')
  - neutral: Neutral keycap
  - Any semantic color (\`primary\`, \`danger\`, \`success\`, ...): soft treatment — the color's muted tint with readable tinted text

### Content Slots
- **children**: Snippet | string - Content of a single key (ignored when \`keys\` is set)

### Styling Props
- **class**: string - Additional CSS classes applied to the root element
- **theme**: KbdThemeProps - Custom theme overrides

## Structure

Single key:
\`\`\`
<kbd>          <!-- kbd part -->
  children
</kbd>
\`\`\`

Key combo:
\`\`\`
<kbd>          <!-- group part -->
  <kbd>⌘</kbd> <!-- kbd part -->
  <span>+</span> <!-- separator part (between keys) -->
  <kbd>K</kbd>
</kbd>
\`\`\`

## Examples

### Single Keys
\`\`\`svelte
<Kbd>Esc</Kbd>
<Kbd>⌘</Kbd>
<Kbd>Enter</Kbd>
\`\`\`

### Key Combos
\`\`\`svelte
<Kbd keys={['⌘', 'K']} />
<Kbd keys={['Ctrl', 'Shift', 'P']} separator="+" />
\`\`\`

### With an Icon Snippet
\`\`\`svelte
<script>
	import { commandIcon } from 'entasis/icons/command';
</script>

{#snippet cmd()}
	{@render commandIcon({})}
{/snippet}
<Kbd keys={[cmd, 'K']} />
\`\`\`

### Sizes
\`\`\`svelte
<Kbd size="small">S</Kbd>
<Kbd size="normal">N</Kbd>
<Kbd size="large">L</Kbd>
\`\`\`

### Inline in Text
\`\`\`svelte
<p>
	Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette.
</p>
\`\`\`

### Inside a Button
\`\`\`svelte
<Button variant="outline" color="neutral">
	Search
	{#snippet suffix()}
		<Kbd keys={['⌘', 'K']} />
	{/snippet}
</Button>
\`\`\`

## Accessibility

- Uses semantic \`<kbd>\` elements for both the group and individual keys
- \`pointer-events-none\` and \`select-none\` keep keys decorative and non-interactive
- Screen readers announce key labels as regular text

## Notes

- When \`keys\` is provided, the component renders a wrapping \`<kbd>\` group and ignores \`children\`
- The separator is only rendered between adjacent keys, never before the first key
- SVG icons inside keys are automatically sized to match the key size unless they carry an explicit \`size-*\` class

## Theme Customization

The Kbd component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Individual key styles
- **group**: Wrapper styles when \`keys\` is set
- **separator**: Separator styles between keys

### Theme Type Definition

\`\`\`typescript
import type { KbdThemeProps } from 'entasis/kbd';

const customTheme: KbdThemeProps = {
	root: {
		base: 'rounded raised-1',
		size: {
			small: 'h-4 min-w-4 px-0.5 text-[0.625rem]',
			normal: 'h-5 min-w-5 px-1 text-xs',
			large: 'h-6 min-w-6 px-1.5 text-sm'
		}
	},
	group: {
		size: {
			normal: 'gap-1.5'
		}
	},
	separator: {
		base: 'text-neutral'
	}
};
\`\`\`

### Available Variants

**root**:
- base: Base classes applied to every key
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls key height, min-width, padding, text, and icon size

**group**:
- base: Base classes for the key group wrapper
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls the gap between keys

**separator**:
- base: Base classes for the separator
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls the separator text size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Kbd theme={{ root: { base: 'raised-1' } }}>
	Esc
</Kbd>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
	import { setKbdTheme } from 'entasis/kbd';

	setKbdTheme({
		root: {
			base: 'rounded border border-neutral-muted'
		}
	});
</script>
\`\`\`
`;
