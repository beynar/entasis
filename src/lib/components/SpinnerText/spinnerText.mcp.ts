export const spinnerTextDescription = `
# SpinnerText Component

SpinnerText combines the existing Spinner with a stable-width sequence of loading messages. Messages cycle on a configurable delay and transition vertically or through a left-to-right reveal without shifting surrounding layout.

## Import

\`\`\`svelte
<script lang="ts">
	import { SpinnerText } from 'svelai/spinner-text';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<SpinnerText
	texts={['Reading files', 'Building context', 'Preparing answer']}
	delay={1800}
	shimmer
/>
\`\`\`

## Props

- **texts**: \`readonly string[]\` (required) - Messages displayed in sequence. The first message is rendered during SSR.
- **delay**: \`number\` (default: \`2200\`) - Milliseconds between message changes. Zero, negative, and non-finite values pause cycling.
- **transition**: \`'vertical' | 'reveal'\` (default: \`'vertical'\`) - Moves the outgoing message down while the next enters from above, or replaces both through opposing left-to-right clip reveals.
- **shimmer**: \`boolean\` (default: \`false\`) - Applies the Svelai shimmer utility to the active message.
- **showSpinner**: \`boolean\` (default: \`true\`) - Shows or hides the leading Spinner.
- **spinnerVariant**: \`'default' | 'grid' | 'pulse' | 'puff' | 'lines' | 'circles'\` (default: Theme \`spinnerVariant\`, then \`'default'\`) - Overrides the global spinner animation for this instance.
- **spinner**: \`Snippet<[SpinnerTextSpinnerPayload]>\` - Replaces the default visual spinner. Receives the resolved \`color\`, \`size\`, and \`variant\`.
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`) - Controls spinner dimensions, gap, text size, and line height.
- **color**: \`Colors\` (default: \`'neutral'\`) - Semantic color applied to both spinner and text.
- **label**: \`string\` (default: \`'Loading'\`) - Accessible fallback when \`texts\` is empty.
- **ref**: \`HTMLElement | null\` (bindable) - Root status element.
- **class**: \`string\` - Additional root classes.
- **theme**: \`SpinnerTextThemeProps\` - Per-instance theme overrides.

Standard Svelte attachments are spread onto the root status element.

## Custom spinner

\`\`\`svelte
<script lang="ts">
	import { Spinner } from 'svelai/spinner';
	import { SpinnerText } from 'svelai/spinner-text';
</script>

<SpinnerText texts={['Thinking', 'Composing']} color="primary">
	{#snippet spinner({ size, color })}
		<Spinner variant="circles" decorative {size} {color} />
	{/snippet}
</SpinnerText>
\`\`\`

## Behavior

- A root attachment owns the interval and restarts it when \`texts\` length or \`delay\` changes.
- One or zero messages do not create an interval.
- All messages occupy the same hidden CSS grid cell, so the component reserves the width of its longest message and does not resize on every transition.
- The vertical transition uses the design system's configured duration and easing.
- The reveal transition clips the outgoing text from the left while revealing the incoming text from the left.
- Vertical uses 1.5 times the configured theme duration; reveal uses 2.5 times that duration. Both use the configured easing.
- The default Spinner is visually reduced one step relative to the message line height. Custom spinner snippets retain full control over their dimensions.
- Shimmer behavior remains owned by the existing global shimmer utility.
- The default indicator delegates to Spinner and remains compatible with global spinner theme configuration.

## Accessibility

- The root uses \`role="status"\`, \`aria-live="polite"\`, and \`aria-atomic="true"\`.
- Visual transition layers and the spinner are hidden from assistive technology.
- A single screen-reader-only message changes with the active text, avoiding duplicate announcements while outgoing and incoming visual layers overlap.
- When \`texts\` is empty, \`label\` supplies the accessible status name.

## Theme parts

- **root** - Inline status wrapper, semantic color, and size-specific gap.
- **spinner** - Default or custom spinner container.
- **viewport** - Clipped text transition viewport.
- **sizer** - Hidden grid that reserves the longest message width.
- **sizerItem** - Individual hidden sizing message.
- **message** - Active visual message and optional shimmer state.

## Motion

- **motion** theme slot, keyed by \`mode\`: the \`vertical\` slide runs on \`slow\`, the \`reveal\`
  wipe on \`slower\`. Only \`duration\` / \`easing\` are read; the geometry is fixed.
- Ladder: \`<Theme components={{ spinnerText: { motion } }}>\` → \`setSpinnerTextTheme({ motion })\`
  → \`theme.motion\`. Reduced motion collapses it to 0 (the text swaps instantly).
`;
