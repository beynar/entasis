export const ratingDescription = `
# Rating Component

A read-only star rating display with half/partial star support, a configurable star count, and RTL support. For a form input, use \`RatingInput\` (which builds on this component).

## Basic Usage

\`\`\`svelte
<Rating value={3} />
<Rating value={2.5} max={5} />
<Rating value={7.5} max={10} color="primary" size="large" />
<Rating value={2.5} dir="rtl" />
\`\`\`

## Props

### Core Props
- **value**: \`number | null\` (default: \`0\`)
  - The displayed value. Fractions render as partially filled stars (0.5 = half star; any fraction works, e.g. an average score of 3.7).
  - Read-only display data: Rating never writes it, so there is no \`defaultValue\` and no \`onValueChange\`. Use \`RatingInput\` for an editable rating.
- **max**: \`number\` (default: \`5\`)
  - Number of stars rendered, which is also the maximum value.

### Style Props
- **color**: \`Colors\` (default: \`'warning'\`)
  - Color of the filled stars; the default is the classic gold.
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
  - Star box dimensions and gap.
- **dir**: \`'ltr' | 'rtl'\` (optional)
  - Reading direction override. In \`rtl\` the stars order and fill from the right. Inherits the ambient direction when omitted.
- **disabled**: \`boolean\` (default: \`false\`) - Applies the disabled styling.
- **interactive**: \`boolean\` (default: \`false\`) - Applies pointer styling to the stars (used by wrappers like RatingInput).

### Content Props (Slots)
- **star**: \`Snippet<[{ index, fraction, layer }]>\` (optional)
  - Custom star icon. Rendered twice per star: once for the muted outline (\`layer: 'base'\`) and once for the colored fill overlay (\`layer: 'fill'\`). \`fraction\` is the star's filled fraction (0 to 1).

\`\`\`svelte
<Rating value={3.5}>
	{#snippet star({ layer })}
		{#if layer === 'base'}
			{@render heartIcon({ class: 'size-full' })}
		{:else}
			{@render heartIconFill({ class: 'size-full' })}
		{/if}
	{/snippet}
</Rating>
\`\`\`

### Advanced Props
- **ref**: \`HTMLElement | null\` (bindable) - Reference to the root star-row element.
- **onpointermove**: \`(event: PointerEvent) => void\` (optional)
- **onclick**: \`(event: MouseEvent) => void\` (optional)
  - Native handlers attached to every star. Read the one-based index from \`event.currentTarget.dataset.starIndex\`. Leave unset for a purely static display.
- **i18n**: \`Partial<Messages>\` - Per-instance i18n overrides merged over the global catalog.
- **theme**: \`RatingThemeProps\` - Theme overrides.

## Structure

A flex row (\`container\`) of \`max\` star boxes (\`star\`). Each star layers a muted outline icon (\`starBase\`) under a colored icon inside an overflow-hidden clip (\`starFill\`) whose width is the star's filled fraction. The clip is pinned with \`inset-inline-start\`, so RTL mirrors the fill automatically.

## Accessibility

- Standalone, the row is \`role="img"\` with an \`aria-label\` of "{value} of {max}" (localized via the i18n catalog's \`of\` key).
- The individual stars are \`aria-hidden\`; screen readers get one concise element.
- Wrappers (e.g. RatingInput) override the role/label by spreading their own attributes onto the root.

## Notes

- Display only: it never changes any value itself. Pair with \`RatingInput\` for form usage.
- Theme parts: \`container\`, \`star\`, \`starBase\`, \`starFill\` (variants: \`size\`, \`color\`, \`disabled\`, \`interactive\`).
`;
