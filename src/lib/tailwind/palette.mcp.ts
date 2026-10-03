export const colorPaletteDescription = `
# Color palette

\`generateColorPalette\` from \`entasis/color-palette\` computes, at runtime, the palette the theme
plugin writes for one theme. It takes the same inputs as a \`@plugin 'entasis/tailwind-plugin/theme'\`
declaration (\`primary\`, \`secondary\`, \`danger\`, \`success\`, \`warning\`, \`info\`, \`neutral\`,
\`surface\`, their \`-light\`/\`-muted\`/… overrides, \`colorscheme\`, \`luminance\`, \`saturation\`
and the \`state-*-opacity\` values) and does not import Tailwind.

\`\`\`svelte
<script lang="ts">
	import { generateColorPalette } from 'entasis/color-palette';

	let brand = $state('#0f766e');
	const palette = $derived(
		generateColorPalette({ colorscheme: 'light', primary: brand, surface: '#fafafa', neutral: '#18181b' })
	);
	const style = $derived(
		Object.entries(palette.cssVariables)
			.map(([name, value]) => \`\${name}: \${value}\`)
			.join('; ')
	);
</script>

<div {style}>
	<!-- Components in here use the generated palette. -->
</div>
\`\`\`

- \`cssVariables\` maps \`--color-*\` and \`--state-*\` custom properties to values. Setting them on an
  element themes its subtree, since every utility reads those variables.
- \`colorsPalette\` holds the resolved hex colours for each role and variant.
- Spacing, radius, typography and the state roles stay on \`Theme\`'s \`designTokens\`.
`;
