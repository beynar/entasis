export const themePluginDescription = `
# Theme Tailwind plugin

\`@plugin 'svelai/tailwind-plugin/theme'\` generates color variables for each named theme. The declaration
marked \`default: true\` also registers the shared utility vocabulary, variants, spinner styles,
and keyframes.

\`\`\`css
@import 'tailwindcss';

@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
	primary: #6366f1;
	surface: #ffffff;
	neutral: #121212;
}

@plugin 'svelai/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
	primary: #818cf8;
	surface: #15161c;
	neutral: #ffffff;
}
\`\`\`

## Identity

- \`name: string\` scopes variables to \`html[data-theme="<name>"]\` and \`.<name>\`.
- \`default: boolean\` also applies the palette to bare \`html\` and installs the shared engine.
- \`colorscheme: 'light' | 'dark'\` controls mode-aware color defaults.
- \`prefersDark: boolean\` also emits the palette under the dark system media query.

## Palette inputs

Base semantic colors are \`primary\`, \`secondary\`, \`danger\`, \`success\`, \`warning\`, \`info\`,
and \`neutral\`. \`surface\` seeds the elevation ladder: \`surface-recessed\`,
\`surface-canvas\`, \`surface\`, \`surface-raised\`, and \`surface-floating\`.

Each semantic color supports explicit \`-light\`, \`-lighter\`, \`-dark\`, \`-muted\`,
\`-contrast\`, \`-readable\`, and \`-muted-readable\` overrides. Missing variants are generated.
\`luminance\` and \`saturation\` adjust the generated palette.

\`state-hover-opacity\` and \`state-pressed-opacity\` calibrate the CSS variables consumed by
\`.state-layer\`. They default to 0.05/0.10 in light mode and 0.16/0.32 in dark mode.

## Runtime boundary

Spacing, radius, typography scale, and raised borders are not plugin options. Configure them with
the \`designTokens\` prop on \`Theme\`. Tailwind still discovers and compiles the finite utility
names; runtime theming changes the CSS variables those utilities consume.

The public spacing vocabulary is \`xs | sm | md | lg | xl\`, available through named gap, padding,
and margin utilities such as \`gap-md\` and \`px-lg\`. The \`micro\` and \`layout-*\` values are
internal component-recipe tokens. Generated interfaces should prefer Stack/Grid gaps and must not
emit arbitrary spacing or unsupported radius utilities.

Color variables can also be overridden directly at runtime:

\`\`\`css
html[data-theme='light'] {
	--color-primary: oklab(0.58 0.12 -0.2);
}
\`\`\`
`;
