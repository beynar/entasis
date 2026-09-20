export const tailwindPluginDescription = `
# Main Tailwind plugin

\`@plugin 'entasis/tailwind-plugin'\`

This palette-agnostic plugin registers shared utilities, variants, keyframes, and spinner CSS.
Use it when colors are defined separately instead of through the theme plugin.

## Configuration

\`spinner\`
- **Type**: \`Spinner\` object
- **Default**: Auto-generated
- **Description**: Custom spinner configuration for the \`.ui-spinner\` class

## Shared utilities

### \`.state-layer\`
- Composites \`currentColor\` at \`--state-hover-opacity\` on hover and \`data-highlighted="true"\`
- Composites \`currentColor\` at \`--state-pressed-opacity\` on \`:active\`
- Does not activate for disabled, \`data-disabled\`, or \`aria-disabled="true"\` elements
- Theme plugin defaults the opacities to 5% and 10% in light themes, and 16% and 32% in dark themes

### \`bg-selected-muted\` / \`rounded-<step>-concentric\`
- \`bg-selected-muted\` composites \`var(--color-selected, var(--color))\` at
  \`--state-selected-opacity\` (0.07 light, 0.10 dark), so a persistent selection reads the same on
  \`surface\`, \`surface-raised\` and \`surface-floating\`. \`bg-color-muted\` stays opaque.
- \`rounded-<step>-concentric\` (also \`rounded-t-<step>-concentric\` /
  \`rounded-b-<step>-concentric\`, with \`<step>\` one of \`xs sm md lg xl 2xl 3xl 4xl\`) keeps the
  child on its own design step but caps it at what concentricity allows inside a rounded padded
  container:
  \`min(var(--radius-<step>), var(--radius-parent) - max(--pad-parent-x, --pad-parent-y))\`. The
  container declares nothing: every \`rounded-<step>\` publishes \`--radius-parent\` to its
  children and \`p\` / \`px\` / \`py\` publish \`--pad-parent-x/-y\`, so the two boxes stay
  concentric at every \`radius\` preset. Outside any rounded container the parent radius is
  infinite, so the child is exactly its step; a negative difference clamps to 0, a square corner.
  Put it on a child that sits flush against the padding box; a floating child (an avatar, a
  Button, a Chip) keeps its own radius.

Configure spacing, radius, typography scale, and raised borders at runtime through
\`Theme.designTokens\`.

Semantic spacing utilities use the active theme's \`xs\`, \`sm\`, \`md\`, \`lg\`, and \`xl\`
scale for gaps, padding, margins, and physical insets. For example, \`gap-lg\`, \`p-lg\`,
\`top-lg\`, and \`left-lg\` use the same spacing value. Inset utilities support \`top\`,
\`right\`, \`bottom\`, and \`left\`, including responsive variants.
`;
