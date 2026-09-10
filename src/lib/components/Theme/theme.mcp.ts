export const themeDescription = `
# Theme

\`Theme\` owns global theme selection, runtime design tokens, shared overlay state, and theme
transitions. Wrap the application once and use the \`ThemeState\` received by the children snippet.

## Runtime design tokens

\`\`\`svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'svelai/theme';

	let spacing = $state<'small' | 'normal' | 'large'>('normal');
	const designTokens = $derived({
		light: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'normal',
			typeScale: 'default',
			raisedWithBorder: true
		},
		dark: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'small',
			typeScale: 'compact',
			raisedWithBorder: false
		}
	} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>);
</script>

<Theme {designTokens} transition="radial-top-right">
	{#snippet children(theme)}
		<button onclick={() => (spacing = spacing === 'small' ? 'large' : 'small')}>
			Change density
		</button>
		<button onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
			Toggle color scheme
		</button>
	{/snippet}
</Theme>
\`\`\`

\`designTokens\` is keyed by logical theme name and respects the \`attribute\` and \`value\` props.
Changing the controlled object updates already-rendered Tailwind utilities without rebuilding CSS.

### ThemeDesignTokens

- \`spacing\`: \`'small' | 'normal' | 'large' | number\`. Globally scales density.
- \`spacingScale\`: partial overrides for the strictly increasing \`xs\`, \`sm\`, \`md\`, \`lg\`,
  and \`xl\` spacing multipliers. Defaults to 1/1.5/2/3/4.
- \`radius\`: \`'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number\`.
- \`typeScale\`: \`'compact' | 'default' | 'comfortable' | 'large' | TypeScaleOptions\`.
- \`raisedWithBorder\`: toggles the border used by \`raised-*\` utilities.

Component-level density remains a local variant. It selects utility classes whose values inherit
the active global spacing token.

Generated interfaces should use the public \`xs | sm | md | lg | xl\` vocabulary through component
props and named gap/padding utilities. \`micro\` and \`layout-*\` are internal recipe tokens. Prefer
parent-owned gaps over child margins; do not emit arbitrary spacing or unsupported radius values.

## Theme selection

The selection props come from \`svelte-themes\`: \`themes\`, \`defaultTheme\`, \`forcedTheme\`,
\`enableSystem\`, \`enableColorScheme\`, \`storageKey\`, \`attribute\`, \`value\`, and
\`colorScheme\`. The default themes are light and dark, with system selection enabled.

\`ThemeState\` exposes \`theme\`, \`resolvedTheme\`, \`themes\`, and \`systemTheme\`. Assign
\`theme.theme\` to switch themes. The optional \`transition\` prop applies a named view transition;
unsupported browsers and reduced-motion users switch instantly.

\`spinnerVariant\` sets the global default spinner animation. The children snippet is required.

## Build-time boundary

The Tailwind plugin still generates color palettes and registers utility names, variants,
keyframes, and spinner CSS. Spacing, radius, typography scale, and raised borders belong to
\`Theme.designTokens\`; colors remain CSS variables and can be overridden directly.
`;
