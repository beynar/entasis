export const tailwindPluginDescription = `
# Main Tailwind plugin

\`@plugin 'svelai/tailwind-plugin'\`

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

Configure spacing, radius, typography scale, and raised borders at runtime through
\`Theme.designTokens\`.

Semantic spacing utilities use the active theme's \`xs\`, \`sm\`, \`md\`, \`lg\`, and \`xl\`
scale for gaps, padding, margins, and physical insets. For example, \`gap-lg\`, \`p-lg\`,
\`top-lg\`, and \`left-lg\` use the same spacing value. Inset utilities support \`top\`,
\`right\`, \`bottom\`, and \`left\`, including responsive variants.
`;
